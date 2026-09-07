/**
 * The grep engine: real `grep -nE` sessions scrolling up the strip, newest at the bottom.
 *
 * The patterns are ERE that grep-go actually supports, and the two features it was built for
 * — backreferences and {n,m} ranges — lead. What lights up on a line is computed by running
 * the pattern against it, never marked by hand, so the highlight cannot disagree with the
 * command above it.
 */
import type { Cell } from '../diagram';
import { DENSITY, MAX_OP, blankGrid, edge, type Stream } from './engine';

export interface GrepSession {
  /** the ERE, exactly as it appears in the command line above the output */
  pattern: string;
  lines: readonly string[];
}

export const COLS = 28;
/** `n:` and the space after it */
export const PREFIX = 3;

/**
 * Which characters of `text` the pattern matches. Builds a fresh RegExp every call: a shared
 * one carries `lastIndex` between calls, which would make `render` impure.
 */
export function matchMask(pattern: string, text: string): boolean[] {
  const mask = new Array<boolean>(text.length).fill(false);
  const re = new RegExp(pattern, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    // a zero-width match never advances lastIndex, so it would spin here forever
    if (m[0].length === 0) break;
    for (let i = m.index; i < m.index + m[0].length; i++) mask[i] = true;
  }
  return mask;
}

export const command = (s: GrepSession): string => `❯ grep -nE '${s.pattern}'`;

export const SESSIONS: readonly GrepSession[] = [
  {
    // backreferences: grep-go's headline extension
    pattern: '(\\w+) \\1',
    lines: ['the the quick brown fox', 'a cat sat on the mat', 'it is is broken', 'no repeats in this one', 'bar bar baz', 'to be or not to be'],
  },
  {
    // {n,m} ranges, anchored
    pattern: '^a{2,4}$',
    lines: ['a', 'aa', 'aaa', 'aaaa', 'aaaaa', 'aaab'],
  },
  {
    // a negated character class between anchors
    pattern: '^[^0-9]+$',
    lines: ['hello world', 'abc123', 'only letters here', '42', 'no digits at all', 'v2'],
  },
  {
    // alternation, a group and an optional quantifier — and `catalog`, which matches too
    pattern: '(cat|dog)s?',
    lines: ['two cats on the wall', 'one dog barking', 'a bird in the tree', 'dogs and cats', 'nothing here at all', 'catalog'],
  },
  {
    // character classes — note `root@localhost` has no dot, so it does not match
    pattern: '\\w+@\\w+\\.\\w+',
    lines: ['mail alex@example.com', 'cc: bob@corp.io', 'no address in this line', 'ping root@localhost', 'from ci@github.com now', 'x@y is not one'],
  },
];

type Row =
  | { kind: 'cmd'; text: string }
  | { kind: 'line'; text: string; pattern: string; n: number }
  | { kind: 'gap' };

/** The sessions flattened into the scrolling list: a command, its numbered output, a blank. */
const ROWS: readonly Row[] = SESSIONS.flatMap((s): Row[] => [
  { kind: 'cmd', text: command(s) },
  ...s.lines.map((text, i): Row => ({ kind: 'line', text, pattern: s.pattern, n: i + 1 })),
  { kind: 'gap' },
]);

/** The strip scrolls at this many lines a second. */
const RATE = 1.1;
const SEED = 4;

export const grep: Stream = {
  cols: COLS,
  render(t, rows) {
    const g = blankGrid(COLS, rows);
    const head = Math.floor(t * RATE * DENSITY + SEED * 5);

    for (let r = rows - 1; r >= 0; r--) {
      const i = head - (rows - 1 - r);
      if (i < 0) continue;
      const row = ROWS[i % ROWS.length];
      if (row.kind === 'gap') continue;
      const op = MAX_OP * edge(r, rows);

      if (row.kind === 'cmd') {
        for (let k = 0; k < row.text.length && k < COLS; k++) {
          g[r][k] = { ch: row.text[k], color: k === 0 ? 'green' : 'fg', op };
        }
        continue;
      }

      const mask = matchMask(row.pattern, row.text);
      const any = mask.some(Boolean);
      const n = `${row.n}:`;
      for (let k = 0; k < n.length && k < COLS; k++) g[r][k] = { ch: n[k], color: 'faint', op };
      for (let k = 0; k < row.text.length && k + PREFIX < COLS; k++) {
        const hit = mask[k];
        g[r][k + PREFIX] = {
          ch: row.text[k],
          // a matching line reads as found, a line with no match recedes
          color: hit ? 'green' : any ? 'fg' : 'faint',
          op: hit ? op : op * (any ? 0.9 : 0.6),
          bg: hit ? 'match' : undefined,
        };
      }
    }

    return g;
  },
};
