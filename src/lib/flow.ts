/**
 * The acapulko data-flow diagram: grid or battery feeds the pi, the pi notifies Telegram
 * and the status page. Ported from the design handoff's `renderFrame`, keeping its glyphs,
 * geometry and 16-second timeline exactly. The one deliberate change is colour: the handoff
 * names Tokyo Night hex values, this returns role tokens so the diagram themes with the rest
 * of the site and survives a palette swap.
 *
 * Pure: the same `t` always yields the same grid, which is what makes it testable.
 */

export type Role = 'fg' | 'dim' | 'faint' | 'accent' | 'blue' | 'green' | 'peach' | 'teal' | 'orange';

export interface Cell {
  ch: string;
  color: Role;
  op: number;
}

export interface Frame {
  grid: Cell[][];
  phase: string;
  gridOn: boolean;
  bulbOn: boolean;
  pct: number;
  /** true for the moment a notification lands, when the target nodes flash */
  flashing: boolean;
}

/** Where the SVG nodes sit on the character grid: [row, col, cols, rows]. */
export const NODE_BOX = {
  telegram: { row: 1, col: 57, cols: 9, rows: 4 },
  bulb: { row: 7, col: 56, cols: 10, rows: 6 },
} as const;

export const FLOW_COLS = 100;
export const FLOW_ROWS = 14;
/** the timeline repeats every 16 seconds */
export const FLOW_LOOP_S = 16;

export function renderFrame(tSeconds: number, opts: { speed?: number } = {}): Frame {
const P = opts;
const speed = P.speed ?? 1;
const C: Record<string, Role> = { fg: 'fg', dim: 'faint', mute: 'dim', amber: 'accent', blue: 'blue', red: 'peach', grn: 'green', cyan: 'teal', org: 'orange', pulse: 'accent' };

const LOOP = FLOW_LOOP_S, DROP = 5, RESTORE = 11, PULSE = 1.4, MSG = 3.6;
const T = tSeconds * speed, t = T % LOOP;
const gridOn = t < DROP || t >= RESTORE;
const eventT = t >= RESTORE ? t - RESTORE : t >= DROP ? t - DROP : null;
const kind = t >= RESTORE ? 'restore' : t >= DROP ? 'drop' : null;
const pulseProg = eventT !== null && eventT < PULSE ? eventT / PULSE : null;
const arrived = eventT !== null && eventT >= PULSE;
const msgOn = arrived && eventT < PULSE + MSG;
const bulbOn = t < DROP ? true : t < RESTORE ? t - DROP < PULSE : t - RESTORE >= PULSE;
const pct = t < DROP ? 76 + t * 2.4 : t < RESTORE ? 88 - (t - DROP) * 3.5 : 67 + (t - RESTORE) * 2.4;

const W = FLOW_COLS, H = FLOW_ROWS;
const g: Cell[][] = Array.from({ length: H }, () => Array.from({ length: W }, () => ({ ch: ' ', color: C.fg, op: 1 })));
const put = (r: number, c: number, str: string, color: Role, op = 1) => { for (let i = 0; i < str.length; i++) if (c + i < W && r < H) g[r][c + i] = { ch: str[i], color, op }; };
const putLines = (r: number, c: number, lines: string[], color: Role, op?: number) => lines.forEach((l, i) => put(r + i, c, l, color, op));

// ---- nodes ----
const gc = gridOn ? C.amber : C.dim;
putLines(0, 2, ['   ┌┐', ' ┌─┼┼─┐', '─┴─┼┼─┴─', '   ││', '   ││', '  ─┴┴─'], gc);
put(1, 10, 'grid', gridOn ? C.fg : C.mute);

const fill = Math.round(pct / 100 * 8), bc = gridOn ? C.dim : C.blue;
put(9, 1, '╭────────╮', C.fg);
put(10, 1, '│', C.fg); put(10, 2, '█'.repeat(fill) + '░'.repeat(8 - fill), gridOn ? C.grn : C.blue); put(10, 10, '├┤', C.fg);
put(11, 1, '╰────────╯', C.fg);
put(12, 1, `deye ${Math.round(pct)}%`, C.mute); put(12, 10, gridOn ? '⇡' : '⇣', gridOn ? C.grn : C.blue);

putLines(4, 30, ['╭───────╮', '│       │', '│  pi5  │', '│       │', '╰───────╯'], C.fg);
put(6, 33, 'pi5', C.org);
// the source indicator sits inside the box: amber on grid, blue on battery
put(7, 33, '▪', gridOn ? C.amber : C.blue);
put(7, 35, '▪', Math.floor(T * 5) % 3 === 0 ? C.grn : C.dim);

// the plane and the bulb are drawn as SVG over these cells; leave them empty
put(5, 59, 'telegram', C.mute);

put(13, 57, 'status page', C.mute);

// ---- power lines ----
const gridPath: [number, number, string][] = []; for (let c = 12; c <= 19; c++) gridPath.push([2, c, '─']); gridPath.push([2, 20, '╮']); for (let r = 3; r <= 5; r++) gridPath.push([r, 20, '│']); gridPath.push([6, 20, '├']);
const piPath: [number, number, string][] = []; for (let c = 21; c <= 28; c++) piPath.push([6, c, '─']); piPath.push([6, 29, '▶']);
const battPath: [number, number, string][] = []; for (let r = 7; r <= 9; r++) battPath.push([r, 20, '│']); battPath.push([10, 20, '╰']); for (let c = 19; c >= 13; c--) battPath.push([10, c, '─']);
const flow = Math.floor(T * 7);
const drawPower = (path: [number, number, string][], color: Role, active: boolean, reverse: boolean) => {
  const cells = reverse ? [...path].reverse() : path;
  cells.forEach(([r, c, ch], i) => {
    if (!active) { g[r][c] = { ch, color: C.dim, op: 1 }; return; }
    const hot = (i - flow) % 5 === 0 || (i - flow) % 5 === -0;
    const hot2 = ((i - flow) % 5 + 5) % 5 === 0;
    // arrowheads are terminators: always crisp, or the bus looks two-toned
    const head = ch === '▶' || ch === '◀';
    g[r][c] = hot2 ? { ch: '●', color, op: 1 } : { ch, color, op: head ? 1 : 0.55 };
  });
};
drawPower(gridPath, C.amber, gridOn, false);
drawPower(piPath, gridOn ? C.amber : C.blue, true, false);
drawPower(battPath, gridOn ? C.amber : C.blue, true, !gridOn);
if (!gridOn) g[6][20] = { ch: '╭', color: C.blue, op: 0.55 };
if (gridOn) put(10, 13, '◀', C.amber); else put(10, 13, '─', C.blue, 0.55);

// ---- notification lines ----
const tgPath: [number, number, string][] = []; for (let c = 39; c <= 47; c++) tgPath.push([5, c, '─']); tgPath.push([5, 48, '╯']); for (let r = 4; r >= 3; r--) tgPath.push([r, 48, '│']); tgPath.push([2, 48, '╭']); for (let c = 49; c <= 55; c++) tgPath.push([2, c, '─']); tgPath.push([2, 56, '▶']);
const webPath: [number, number, string][] = []; for (let c = 39; c <= 47; c++) webPath.push([7, c, '─']); webPath.push([7, 48, '╮']); for (let r = 8; r <= 9; r++) webPath.push([r, 48, '│']); webPath.push([10, 48, '╰']); for (let c = 49; c <= 55; c++) webPath.push([10, c, '─']); webPath.push([10, 56, '▶']);
for (const p of [tgPath, webPath]) p.forEach(([r, c, ch]) => { g[r][c] = { ch, color: C.dim, op: 1 }; });
if (pulseProg !== null) {
  for (const p of [tgPath, webPath]) {
    const i = Math.min(p.length - 1, Math.floor(pulseProg * p.length));
    for (let k = 0; k < 4 && i - k >= 0; k++) { const [r, c, ch] = p[i - k]; g[r][c] = { ch: k === 0 ? '●' : ch, color: C.pulse, op: k === 0 ? 1 : 0.8 - k * 0.2 }; }
  }
}
const flashing = arrived && eventT < PULSE + 0.4;
if (flashing) { put(5, 59, 'telegram', C.pulse); put(13, 57, 'status page', C.pulse); }
if (msgOn) {
  const txt = kind === 'drop' ? ' [!] power outage detected ' : ' [ok] power is back ';
  const col = kind === 'drop' ? C.red : C.grn;
  put(1, 69, '┌' + '─'.repeat(txt.length) + '┐', col, 0.7); put(2, 69, '│', col, 0.7); put(2, 70, txt, col); put(2, 70 + txt.length, '│', col, 0.7); put(3, 69, '└' + '─'.repeat(txt.length) + '┘', col, 0.7);
}


    const phase = t < DROP ? 'steady · on grid' : t < DROP + PULSE ? 'grid dropped → notifying' : t < RESTORE ? 'on battery' : t < RESTORE + PULSE ? 'grid restored → notifying' : 'steady · on grid';
return { grid: g, phase, gridOn, bulbOn, pct, flashing };
}
