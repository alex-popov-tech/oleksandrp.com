/**
 * store.nvim in miniature: the cursor walks the plugin list with `j`, the readme pane
 * follows, `i` installs the selected plugin. Ported from the design handoff, keeping its
 * geometry and 12-second timeline.
 *
 * One deliberate change: the handoff squeezes the description into whatever room the
 * install mark leaves, which reduces it to a three-letter stub. Here a marked row drops
 * its description instead.
 */
import { Grid, type Diagram, type Frame, type Role } from '../diagram';
import { hardWrap } from '../text';

export interface Plugin {
  name: string;
  stars: string;
  desc: string;
  author: string;
}

export const PLUGINS: Plugin[] = [
  { name: 'neoconf.nvim', stars: '944', desc: 'manage global and project-local settings', author: 'folke' },
  { name: 'sidekick.nvim', stars: '2.5k', desc: 'your neovim AI sidekick', author: 'folke' },
  { name: 'tokyonight.nvim', stars: '7.9k', desc: 'a clean, dark neovim theme', author: 'folke' },
  { name: 'snacks.nvim', stars: '7.3k', desc: 'a collection of QoL plugins', author: 'folke' },
  { name: 'telescope.nvim', stars: '17k', desc: 'find, filter, preview, pick', author: 'nvim-telescope' },
  { name: 'lazydev.nvim', stars: '1.5k', desc: 'faster LuaLS setup', author: 'folke' },
  { name: 'nvim-cmp', stars: '8.6k', desc: 'completion engine in lua', author: 'hrsh7th' },
  { name: 'todo-comments.nvim', stars: '4.1k', desc: 'highlight and search TODOs', author: 'folke' },
  { name: 'oil.nvim', stars: '5.4k', desc: 'edit your filesystem like a buffer', author: 'stevearc' },
  { name: 'noice.nvim', stars: '5.7k', desc: 'highly experimental UI for messages', author: 'folke' },
  { name: 'trouble.nvim', stars: '6.7k', desc: 'a pretty diagnostics list', author: 'folke' },
];

const C: Record<string, Role> = { fg: 'fg', dim: 'faint', mute: 'dim', amber: 'accent', blue: 'blue', grn: 'green', cyan: 'teal' };

/**
 * The real store.nvim spins braille dots, but braille is not in JetBrains Mono: it falls back
 * to another face 1.26px wider than the cell and shears the row. Rotating quadrants are in the
 * font and hold the grid.
 */
const SPIN = '▘▝▗▖';
const SPIN_FPS = 8;
/** when each `j` lands, then `i`, then when lazy.nvim reports back */
const MOVES = [0.6, 1.3, 2.0, 2.7, 3.4];
const INSTALL = 4.6;
const DONE = 7.2;
const FLASH_S = 0.5;

export const COLS = 78;
export const ROWS = 19;
export const LOOP_S = 12;

/** the first list row, and the last one that still fits inside the pane */
const FIRST_ROW = 5;
const LAST_ROW = 16;
/** the list pane's inner right edge: marks are right-aligned against it */
const LIST_RIGHT = 44;
/** room for the description beside a plugin name, and in the readme pane */
const DESC_COLS = 15;
const README_COLS = 27;

/** Truncate on the ellipsis rather than mid-word, so a cut description still reads as one. */
function clip(text: string, columns: number): string {
  return text.length <= columns ? text : `${text.slice(0, columns - 1).trimEnd()}…`;
}

export interface StoreFrame extends Frame {
  selected: number;
  installing: boolean;
  installed: boolean;
}

export function renderFrame(tSeconds: number, opts: { speed?: number; plugins?: Plugin[] } = {}): StoreFrame {
  const speed = opts.speed ?? 1;
  const plugins = opts.plugins ?? PLUGINS;
  const T = tSeconds * speed;
  const t = T % LOOP_S;

  const selected = MOVES.filter((at) => t >= at).length;
  const installing = t >= INSTALL && t < DONE;
  const installed = t >= DONE;
  const mark = installing ? `${SPIN[Math.floor(T * SPIN_FPS) % SPIN.length]} installing` : installed ? '✓ installed' : '';

  const keys = [...MOVES.map((at) => [at, 'j'] as const), [INSTALL, 'i'] as const];
  const cmdline = installed
    ? `installed ${plugins[selected].name} · lazy-sync ok`
    : keys.filter(([at]) => t >= at).map(([, key]) => key).join(' ');

  const g = new Grid(COLS, ROWS);

  // ---- header ----
  g.box(0, 0, 3, COLS - 1, C.dim);
  g.put(1, 2, '▛▀▘▜▛ ▛▜ ▛▜ ▛▀▘', C.blue);
  g.put(2, 2, '▄▄▌▐▙ ▙▟ ▌▐ ▙▄▖', C.blue);
  g.put(1, 18, 'plugin store', C.dim);
  g.put(2, 18, '.nvim', C.mute);
  const sort = 'Sort: Recently Updated';
  const filter = 'Filter: author:folke;';
  g.put(1, COLS - 3 - sort.length, sort, C.cyan);
  g.put(2, COLS - 3 - filter.length, filter, C.cyan);

  // ---- list pane ----
  g.box(4, 0, 17, 45, C.dim);
  g.put(4, 2, ' List ─ Install ', C.fg);
  g.put(4, 3, 'L', C.amber);
  g.put(4, 10, 'I', C.amber);
  const count = `${plugins.length}/6172`;
  g.put(4, LIST_RIGHT - count.length - 1, ` ${count} `, C.mute);

  plugins.forEach((plugin, i) => {
    const r = FIRST_ROW + i;
    if (r > LAST_ROW) return;
    const isSelected = i === selected;
    const rowMark = isSelected ? mark : '';
    if (isSelected) g.fillBg(r, 1, LIST_RIGHT, 'sel');
    g.put(r, 2, '★', C.amber);
    g.put(r, 3, plugin.stars.padEnd(5), C.amber);
    g.put(r, 9, plugin.name.padEnd(19), C.fg);
    if (rowMark) g.put(r, LIST_RIGHT - rowMark.length - 1, rowMark, C.grn);
    else g.put(r, 28, clip(plugin.desc, DESC_COLS), C.mute);
  });
  // the row flashes green for a moment when lazy.nvim reports the install done
  if (installed && t < DONE + FLASH_S) g.fillBg(FIRST_ROW + selected, 1, LIST_RIGHT, 'flash');

  // ---- readme pane ----
  g.box(4, 47, 17, COLS - 1, C.dim);
  g.put(4, 49, ' Readme ─ Docs ', C.fg);
  g.put(4, 50, 'R', C.amber);
  g.put(4, 59, 'D', C.amber);
  const { name, desc, author } = plugins[selected];
  g.put(5, 49, name, C.amber);
  // wrap on spaces, the way the real readme pane does; a raw slice cuts words in half
  hardWrap(desc, README_COLS).slice(0, 2).forEach((line, i) => g.put(6 + i, 49, line, C.fg));
  g.put(9, 49, 'INSTALLATION', C.grn);
  g.put(10, 49, '{', C.fg);
  g.put(11, 51, `"${author}/${name}",`, C.grn);
  g.put(12, 51, 'opts = {},', C.fg);
  g.put(13, 51, 'keys = {', C.fg);
  g.put(14, 53, '{ "<leader>s" }', C.grn);
  g.put(15, 51, '},', C.fg);
  g.put(16, 49, '}', C.fg);

  // ---- cmdline ----
  g.put(18, 0, cmdline, C.mute);

  return { grid: g.cells, selected, installing, installed };
}

export const diagram: Diagram = { cols: COLS, rows: ROWS, render: (t) => renderFrame(t) };
