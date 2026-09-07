/**
 * The rain engine: columns of words falling down fixed lanes, each with a bright head and a
 * fading trail. git drops the object store it reads and writes; the interpreter drops what
 * the Monkey lexer actually emits.
 *
 * Ported from the design handoff. Two corrections to it: lanes are six columns wide rather
 * than five, so git can say `commit` instead of the handoff's `cmmit` and Monkey can say
 * `return`; and `while`, which the handoff listed, is not a Monkey keyword.
 */
import type { Cell, Role } from '../diagram';
import { DENSITY, MAX_OP, blankGrid, edge, hex, pick, rnd, type Stream } from './engine';

/** A word the rain can drop, with the colour it falls in. */
export interface Token {
  text: string;
  color: Role;
  /** a word worth reading: it never dims past MIN_HOT_OP, so the trail cannot swallow it */
  hot?: boolean;
}

export type Vocab = (stream: number, cycle: number, k: number) => Token;

/** `[column, speed, lane width]` */
export type Lane = readonly [x: number, speed: number, width: number];

export const MIN_HOT_OP = 0.7;
/** Six columns is what `commit`, `return`, `ASSIGN` and `LPAREN` need. */
export const LANE = 6;
/** Three lanes of six, with structural gutters at columns 6 and 13. */
const COLS = 20;

export function rain(
  t: number,
  cols: number,
  rows: number,
  vocab: Vocab,
  lanes: readonly Lane[],
  seed: number,
  trail: number,
  floor: number,
): Cell[][] {
  const g = blankGrid(cols, rows);
  const taken = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false));

  lanes.forEach(([x, speed, width], s) => {
    const fall = speed * 2.6 * DENSITY;
    const span = rows + trail;
    /* Lanes past the third repeat the first three half a cycle out of phase. That is what
       makes git's columns read as continuous rather than as separate falling drops. */
    const pos = t * fall + rnd(s % 3, 1, seed) * span + (s >= 3 ? span / 2 : 0);
    const cycle = Math.floor(pos / span);
    const head = Math.floor(pos % span);

    for (let k = 0; k < trail; k++) {
      const r = head - k;
      if (r < 0 || r >= rows) continue;

      // a word too long for its lane is re-rolled, then given up on — never clipped
      let token = vocab(s, cycle, k);
      for (let n = 1; n < 8 && token.text.length > width; n++) token = vocab(s, cycle, k + n * 31);
      if (token.text.length > width) continue;

      const faded = k === 0 ? 1 : Math.max(floor, 0.8 - k * (0.65 / trail));
      const op = (token.hot ? Math.max(faded, MIN_HOT_OP) : faded) * MAX_OP * edge(r, rows);
      // the head of a dim column is the brightest thing in it
      const dim = token.color === 'dim' || token.color === 'faint';
      const color: Role = k === 0 && !token.hot && dim ? 'fg' : token.color;

      let free = true;
      for (let i = 0; i < token.text.length && x + i < cols; i++) if (taken[r][x + i]) { free = false; break; }
      // a half-drawn word is unreadable noise, so it is all or nothing
      if (!free) continue;
      for (let i = 0; i < token.text.length && x + i < cols; i++) {
        taken[r][x + i] = true;
        g[r][x + i] = { ch: token.text[i], color, op };
      }
    }
  });

  return g;
}

/* ---- git: the object store, and the Smart HTTP protocol it clones over ---- */

export const GIT_OBJECTS = ['blob', 'tree', 'commit', 'tag', 'HEAD'] as const;
export const GIT_WIRE = ['zlib', 'sha1', 'PACK', 'want', 'NAK', 'delta', 'pkt'] as const;

export const gitVocab: Vocab = (s, c, k) => {
  const r = rnd(s, c, k);
  if (r < 0.09) return { text: pick(GIT_OBJECTS, s, c, k + 9), color: 'accent', hot: true };
  if (r < 0.15) return { text: pick(GIT_WIRE, s, c, k + 5), color: 'blue', hot: true };
  return { text: `${hex(s, c, k)} ${hex(s, c, k + 1)}`, color: r < 0.6 ? 'dim' : 'fg' };
};

/* ---- Monkey, as `Writing An Interpreter In Go` defines it ---- */

export const MONKEY_KEYWORDS = ['let', 'fn', 'if', 'else', 'return', 'true', 'false'] as const;
export const MONKEY_IDENTS = ['x', 'y', 'add', 'foo', 'result', 'len', 'first', 'last', 'rest', 'push', 'puts'] as const;
export const MONKEY_OPS = ['+', '-', '*', '/', '!', '=', '==', '!=', '<', '>', '(', ')', '{', '}', '[', ']', ',', ';'] as const;
export const MONKEY_TOKENS = ['IDENT', 'INT', 'LET', 'EOF', 'BANG', 'PLUS', 'MINUS', 'ASSIGN', 'LPAREN', 'LBRACE', 'STRING', 'COMMA', 'EQ', 'LT', 'GT'] as const;

export const monkeyVocab: Vocab = (s, c, k) => {
  const r = rnd(s, c, k);
  if (r < 0.25) return { text: pick(MONKEY_KEYWORDS, s, c, k + 1), color: 'mauve', hot: true };
  if (r < 0.45) return { text: pick(MONKEY_IDENTS, s, c, k + 2), color: 'fg' };
  if (r < 0.65) return { text: String(Math.floor(rnd(s, c, k + 3) * 100)), color: 'accent' };
  if (r < 0.85) return { text: pick(MONKEY_OPS, s, c, k + 4), color: 'teal' };
  return { text: pick(MONKEY_TOKENS, s, c, k + 5), color: 'faint' };
};

const GIT_LANES: readonly Lane[] = [[0, 0.8, LANE], [7, 1.1, LANE], [14, 0.95, LANE]];
const MONKEY_LANES: readonly Lane[] = [[0, 1.2, LANE], [7, 1.5, LANE], [14, 1.0, LANE]];

export const git: Stream = {
  cols: COLS,
  // six streams on three lanes, a long trail and a high floor: near-continuous columns
  render: (t, rows) => rain(t, COLS, rows, gitVocab, [...GIT_LANES, ...GIT_LANES], 2, 22, 0.35),
};

export const interpreter: Stream = {
  cols: COLS,
  // one stream per lane and a short trail: discrete tokens, the way a lexer emits them
  render: (t, rows) => rain(t, COLS, rows, monkeyVocab, MONKEY_LANES, 5, 10, 0.15),
};
