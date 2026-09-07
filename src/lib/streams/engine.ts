/**
 * Shared machinery for the margin streams — the animated text strips that sit in the right
 * margin of the from_scratch file views.
 *
 * A stream is a pure `render(t, rows)` over a character grid, like a diagram, with one
 * difference that shapes everything here: its height is not fixed. The strip fills whatever
 * pane it is given, so `rows` arrives at render time and there is no server-drawn first
 * frame to keep in step. See docs/superpowers/specs/2026-09-07-from-scratch-margin-streams-design.md.
 *
 * Colours are role tokens rather than the hex the design handoff names, so a stream themes
 * with the rest of the site and survives a palette swap.
 */
import type { Cell } from '../diagram';

export interface Stream {
  /** the strip is exactly this many columns wide */
  cols: number;
  /** the grid for this second, at whatever height the pane allows */
  render(t: number, rows: number): Cell[][];
}

/** Lines per second, and how fast rain falls. The handoff's slider, fixed at its default. */
export const DENSITY = 1;
/** The brightest any cell gets. The strip is background, so it never reaches full white. */
export const MAX_OP = 0.9;
/** How many rows the top and bottom fades take. */
export const FADE_ROWS = 5;
/** Both scrolling engines advance a line at this rate, in lines per second. */
export const SCROLL_RATE = 1.1;

/**
 * Deterministic pseudo-random from three coordinates. A sine hash rather than a seeded PRNG
 * because it has no state: `render(t, rows)` stays a pure function of its arguments, which is
 * what makes every test below possible.
 */
export function rnd(a: number, b: number, c: number): number {
  const x = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return x - Math.floor(x);
}

export function pick<T>(arr: readonly T[], a: number, b: number, c: number): T {
  return arr[Math.floor(rnd(a, b, c) * arr.length)];
}

/** One byte of the object store, as git would print it. */
export function hex(a: number, b: number, c: number): string {
  return Math.floor(rnd(a, b, c) * 256)
    .toString(16)
    .padStart(2, '0');
}

/**
 * The opacity multiplier for a row: the strip fades out over its top and bottom rows so it
 * has no hard edge against the pane. Never reaches zero, so a row is never drawn invisibly.
 */
export function edge(r: number, rows: number): number {
  return Math.min(1, (r + 1) / FADE_ROWS, (rows - r) / FADE_ROWS);
}

/**
 * Which entry of a `len`-long script belongs on row `r`.
 *
 * These strips are logs, and a log reads down the page: the oldest line at the top, the
 * newest arriving at the bottom, everything above it shifting up to make room. Requests come
 * before their responses that way, which is the whole reason to print an exchange at all —
 * scrolling the other way puts `200 OK` above the GET that earned it. The falling rain in
 * `rain.ts` is the opposite case and runs downward on its own terms. `seed` offsets each
 * strip so two of them on neighbouring pages are not in lockstep.
 *
 * The script wraps in both directions, so every row carries an entry from the very first
 * frame. Counting only forwards from t=0 would leave the strip filling from the bottom for
 * the half-minute it takes to reach the top row, which reads as a bug rather than as a start.
 */
export function scrollIndex(t: number, r: number, rows: number, seed: number, len: number): number {
  const head = Math.floor(t * SCROLL_RATE * DENSITY + seed);
  return ((((head - (rows - 1 - r)) % len) + len) % len);
}

/**
 * Whether row `r` carries the newest entry — the strip's bottom row, since `scrollIndex`
 * counts back up from there. Exposed so a caller never has to recompute the head to compare.
 */
export const isScrollHead = (r: number, rows: number): boolean => r === rows - 1;

/** A cell that shows nothing. `runs()` folds a row of these into a single span. */
const blankCell = (): Cell => ({ ch: ' ', color: 'fg', op: 0 });

export const isBlank = (cell: Cell): boolean => cell.op === 0;

export function blankGrid(cols: number, rows: number): Cell[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, blankCell));
}
