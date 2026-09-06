import { describe, it, expect } from 'vitest';
import { nextDelay, lineStarts, padTo, CPS, LINE_PAUSE_MS } from './typing';

describe('nextDelay', () => {
  it('jitters between 60% and 140% of the base interval', () => {
    const base = 1000 / CPS;
    expect(nextDelay(false, () => 0)).toBe(Math.round(base * 0.6));
    expect(nextDelay(false, () => 1)).toBe(Math.round(base * 1.4));
  });
  it('pauses before the first character of a line', () => {
    expect(nextDelay(true, () => 0) - nextDelay(false, () => 0)).toBe(LINE_PAUSE_MS);
  });
  it('honours a custom speed', () => {
    expect(nextDelay(false, () => 0.5, 100)).toBe(10);
  });
});

describe('lineStarts', () => {
  it('returns the character index where each non-empty line begins', () => {
    expect([...lineStarts([3, 0, 2])]).toEqual([0, 3]);
    expect([...lineStarts([])]).toEqual([]);
  });
});

describe('padTo', () => {
  it('pads with the fill value and never truncates below n', () => {
    expect(padTo(['a'], 3, '')).toEqual(['a', '', '']);
    expect(padTo(['a', 'b', 'c', 'd'], 3, '')).toEqual(['a', 'b', 'c', 'd']);
  });
});
