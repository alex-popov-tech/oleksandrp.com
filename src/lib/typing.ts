export const CPS = 40;
export const HOLD_MS = 4000;
export const LINE_PAUSE_MS = 150;

/** Delay before revealing the next character. Jittered; longer when the character starts a line. */
export function nextDelay(atLineStart: boolean, rand: () => number = Math.random, cps: number = CPS): number {
  const base = 1000 / cps;
  const jitter = base * (0.6 + 0.8 * rand());
  return Math.round(jitter + (atLineStart ? LINE_PAUSE_MS : 0));
}

/** Character indexes (over the concatenated lines) at which a non-empty line begins. */
export function lineStarts(lengths: number[]): Set<number> {
  const starts = new Set<number>();
  let acc = 0;
  for (const len of lengths) {
    if (len > 0) starts.add(acc);
    acc += len;
  }
  return starts;
}

/** Pad `arr` with `fill` up to length `n`; longer arrays are returned as they are. */
export function padTo<T>(arr: T[], n: number, fill: T): T[] {
  return arr.length >= n ? arr : [...arr, ...Array<T>(n - arr.length).fill(fill)];
}
