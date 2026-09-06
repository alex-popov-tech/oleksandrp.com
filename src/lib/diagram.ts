/**
 * Shared machinery for the animated ASCII diagrams.
 *
 * Every project diagram is a pure `render(t)` over a fixed character grid: the same t always
 * gives the same picture. That is what makes them testable, and what lets the server draw the
 * first frame so the diagram is a real image before any JavaScript runs.
 *
 * Colours are role tokens rather than the hex the design handoffs name, so a diagram themes
 * with the rest of the site and survives a palette swap.
 */

export type Role =
  | 'fg' | 'dim' | 'faint' | 'accent' | 'blue' | 'green' | 'peach' | 'teal' | 'orange' | 'mauve';

/** Row highlights. Only store.nvim uses these, but the cell has to carry them for everyone. */
export type Bg = 'sel' | 'flash';

export interface Cell {
  ch: string;
  color: Role;
  op: number;
  bg?: Bg;
}

export interface Frame {
  grid: Cell[][];
  /** data-* attributes the host element should carry this frame, e.g. ['on', 'flash'] */
  flags?: readonly string[];
}

export interface Diagram {
  cols: number;
  rows: number;
  render(t: number): Frame;
}

/** A character grid with the handful of drawing primitives every diagram needs. */
export class Grid {
  readonly cells: Cell[][];

  constructor(
    readonly cols: number,
    readonly rows: number,
  ) {
    this.cells = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, (): Cell => ({ ch: ' ', color: 'fg', op: 1 })),
    );
  }

  private inside(r: number, c: number) {
    return r >= 0 && r < this.rows && c >= 0 && c < this.cols;
  }

  /** Write a string rightwards from (r, c), keeping whatever background is already there. */
  put(r: number, c: number, str: string, color: Role, op = 1, bg?: Bg) {
    for (let i = 0; i < str.length; i++) {
      if (!this.inside(r, c + i)) continue;
      this.cells[r][c + i] = { ch: str[i], color, op, bg: bg ?? this.cells[r][c + i].bg };
    }
  }

  putLines(r: number, c: number, lines: string[], color: Role, op?: number) {
    lines.forEach((line, i) => this.put(r + i, c, line, color, op));
  }

  /** Replace one cell outright, background included. */
  set(r: number, c: number, cell: Cell) {
    if (this.inside(r, c)) this.cells[r][c] = cell;
  }

  fillBg(r: number, c0: number, c1: number, bg: Bg) {
    for (let c = c0; c <= c1; c++) if (this.inside(r, c)) this.cells[r][c].bg = bg;
  }

  /** A rounded box, corners included. The site uses `╭╮╰╯` everywhere; so do the diagrams. */
  box(r0: number, c0: number, r1: number, c1: number, color: Role) {
    const span = '─'.repeat(Math.max(0, c1 - c0 - 1));
    this.put(r0, c0, `╭${span}╮`, color);
    this.put(r1, c0, `╰${span}╯`, color);
    for (let r = r0 + 1; r < r1; r++) {
      this.put(r, c0, '│', color);
      this.put(r, c1, '│', color);
    }
  }
}

export interface Run {
  text: string;
  color: Role;
  op: number;
  bg?: Bg;
}

/** Group a row into runs of the same colour, so a row ships a few spans instead of 78. */
export function runs(row: Cell[]): Run[] {
  const out: Run[] = [];
  for (const cell of row) {
    const last = out[out.length - 1];
    if (last && last.color === cell.color && last.op === cell.op && last.bg === cell.bg) last.text += cell.ch;
    else out.push({ text: cell.ch, color: cell.color, op: cell.op, bg: cell.bg });
  }
  return out;
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * One row of spans. The server and the client both go through here, so the first painted
 * frame and every frame after it are built the same way.
 */
export function rowHtml(row: Cell[]): string {
  return runs(row)
    .map((r) => {
      const cls = r.bg ? `c-${r.color} bg-${r.bg}` : `c-${r.color}`;
      const style = r.op === 1 ? '' : ` style="opacity:${r.op}"`;
      return `<span class="${cls}"${style}>${escape(r.text)}</span>`;
    })
    .join('');
}
