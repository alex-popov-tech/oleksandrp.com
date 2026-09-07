import { describe, it, expect } from 'vitest';
import { blankGrid, edge, hex, isBlank, isScrollHead, pick, rnd, scrollIndex, FADE_ROWS, SCROLL_RATE } from './engine';

describe('rnd', () => {
  it('is deterministic', () => {
    expect(rnd(1, 2, 3)).toBe(rnd(1, 2, 3));
    expect(rnd(1, 2, 3)).not.toBe(rnd(1, 2, 4));
  });

  it('stays in [0, 1)', () => {
    for (let a = 0; a < 20; a++) {
      for (let b = 0; b < 20; b++) {
        const v = rnd(a, b, a + b);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    }
  });
});

describe('pick', () => {
  it('always returns a member of the list', () => {
    const list = ['a', 'b', 'c'] as const;
    for (let i = 0; i < 50; i++) expect(list).toContain(pick(list, i, 1, 2));
  });
});

describe('hex', () => {
  it('is always two lowercase hex digits', () => {
    for (let i = 0; i < 200; i++) expect(hex(i, 1, 2)).toMatch(/^[0-9a-f]{2}$/);
  });
});

describe('edge', () => {
  it('is full in the middle and fades at both ends', () => {
    const rows = 30;
    expect(edge(15, rows)).toBe(1);
    expect(edge(0, rows)).toBeLessThan(1);
    expect(edge(rows - 1, rows)).toBeLessThan(1);
    // it climbs on the way in and falls on the way out
    expect(edge(0, rows)).toBeLessThan(edge(1, rows));
    expect(edge(rows - 1, rows)).toBeLessThan(edge(rows - 2, rows));
  });

  it('never returns zero, so nothing is drawn perfectly invisible', () => {
    for (let rows = 6; rows < 40; rows++) {
      for (let r = 0; r < rows; r++) expect(edge(r, rows)).toBeGreaterThan(0);
    }
  });

  it('is full for every row of a strip shorter than two fades', () => {
    // a short pane must not fade to nothing everywhere
    expect(edge(2, 5)).toBeGreaterThan(0);
    expect(FADE_ROWS).toBe(5);
  });
});

describe('scrollIndex', () => {
  it('gives every row an entry from the very first frame', () => {
    // no row is ever empty waiting for the script to arrive
    for (let r = 0; r < 40; r++) {
      const i = scrollIndex(0, r, 40, 0, 12);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(12);
    }
  });

  it('puts the newest entry on the top row and older ones below it', () => {
    const len = 50;
    for (let r = 0; r < 9; r++) {
      // one row further down is one entry older
      expect(scrollIndex(20, r + 1, 10, 3, len)).toBe(scrollIndex(20, r, 10, 3, len) - 1);
    }
    expect(isScrollHead(0)).toBe(true);
    expect(isScrollHead(1)).toBe(false);
  });

  it('carries an entry downward as t advances', () => {
    // whatever sits on the top row now is one row lower a beat later
    const entry = scrollIndex(10, 0, 12, 0, 40);
    expect(scrollIndex(10 + 1 / SCROLL_RATE, 1, 12, 0, 40)).toBe(entry);
  });

  it('wraps the script rather than running off the end of it', () => {
    for (const t of [0, 5, 50, 500]) {
      for (let r = 0; r < 30; r++) {
        const i = scrollIndex(t, r, 30, 7, 9);
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(9);
      }
    }
  });
});

describe('blankGrid', () => {
  it('is rows tall and cols wide, and every cell reads as blank', () => {
    const g = blankGrid(7, 4);
    expect(g).toHaveLength(4);
    for (const row of g) {
      expect(row).toHaveLength(7);
      for (const cell of row) expect(isBlank(cell)).toBe(true);
    }
  });

  it('gives every cell its own object, so writing one never writes another', () => {
    const g = blankGrid(3, 2);
    g[0][0].ch = 'x';
    expect(g[0][1].ch).toBe(' ');
    expect(g[1][0].ch).toBe(' ');
  });
});
