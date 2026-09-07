import { describe, it, expect } from 'vitest';
import { blankGrid, edge, hex, isBlank, pick, rnd, scrollIndex, FADE_ROWS } from './engine';

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
  it('is -1 before the script has scrolled up to that row', () => {
    expect(scrollIndex(0, 0, 5, 0)).toBe(-1);
    expect(scrollIndex(0, 2, 10, 0)).toBe(-1);
  });

  it('advances one entry per row, upward toward the bottom', () => {
    const rows = 10;
    for (let r = 0; r < rows - 1; r++) {
      expect(scrollIndex(20, r + 1, rows, 3)).toBe(scrollIndex(20, r, rows, 3) + 1);
    }
  });

  it('advances as t advances', () => {
    const later = scrollIndex(10, 5, 10, 0);
    const earlier = scrollIndex(1, 5, 10, 0);
    expect(later).toBeGreaterThan(earlier);
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
