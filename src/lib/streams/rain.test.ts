import { describe, it, expect } from 'vitest';
import type { Role } from '../diagram';
import { FADE_ROWS, MAX_OP, type Stream } from './engine';
import {
  GIT_OBJECTS, GIT_WIRE, LANE, MIN_HOT_OP,
  MONKEY_IDENTS, MONKEY_KEYWORDS, MONKEY_OPS, MONKEY_TOKENS,
  git, interpreter, rain, type Vocab,
} from './rain';

const ROLES: Role[] = ['fg', 'muted', 'dim', 'faint', 'accent', 'blue', 'green', 'peach', 'teal', 'orange', 'red', 'mauve'];
const RAIN: [string, Stream][] = [['git', git], ['interpreter', interpreter]];

describe.each(RAIN)('%s', (_name, stream) => {
  it('is pure: the same t and height always give the same frame', () => {
    expect(stream.render(4.25, 20)).toEqual(stream.render(4.25, 20));
    expect(stream.render(31.5, 9)).toEqual(stream.render(31.5, 9));
  });

  it('fills the grid it is asked for, at any height', () => {
    for (const rows of [6, 12, 18, 40]) {
      const g = stream.render(3, rows);
      expect(g).toHaveLength(rows);
      for (const row of g) expect(row).toHaveLength(stream.cols);
    }
  });

  it('only uses colour roles the stylesheet knows', () => {
    for (let t = 0; t < 40; t += 0.5) {
      for (const row of stream.render(t, 20)) for (const cell of row) expect(ROLES).toContain(cell.color);
    }
  });

  it('never draws brighter than the strip maximum', () => {
    for (let t = 0; t < 40; t += 0.5) {
      for (const row of stream.render(t, 20)) {
        for (const cell of row) {
          expect(cell.op).toBeGreaterThanOrEqual(0);
          expect(cell.op).toBeLessThanOrEqual(MAX_OP + 1e-9);
        }
      }
    }
  });
});

describe('rain', () => {
  it('holds a highlighted word above MIN_HOT_OP away from the fades', () => {
    const rows = 30;
    const hot: Vocab = () => ({ text: 'commit', color: 'accent', hot: true });
    const g = rain(3, 18, rows, hot, [[0, 1, LANE]], 1, 22, 0.15);
    for (let r = FADE_ROWS; r < rows - FADE_ROWS; r++) {
      for (const cell of g[r]) {
        if (cell.op > 0) expect(cell.op).toBeGreaterThanOrEqual(MIN_HOT_OP * MAX_OP - 1e-9);
      }
    }
  });

  it('lets an ordinary word fade down the trail', () => {
    const rows = 30;
    const cold: Vocab = () => ({ text: 'abcdef', color: 'fg' });
    const g = rain(3, 18, rows, cold, [[0, 1, LANE]], 1, 22, 0.15);
    const ops = g.flat().map((c) => c.op).filter((op) => op > 0);
    expect(Math.min(...ops)).toBeLessThan(MIN_HOT_OP * MAX_OP);
  });

  it('drops a word too long for its lane rather than spilling into the next', () => {
    const tooLong: Vocab = () => ({ text: 'RETURNING', color: 'fg' });
    const g = rain(3, 18, 20, tooLong, [[0, 1, LANE]], 1, 10, 0.15);
    for (const row of g) for (const cell of row) expect(cell.op).toBe(0);
  });
});

describe('the vocabularies', () => {
  it('every word fits a lane', () => {
    const words = [
      ...GIT_OBJECTS, ...GIT_WIRE,
      ...MONKEY_KEYWORDS, ...MONKEY_IDENTS, ...MONKEY_OPS, ...MONKEY_TOKENS,
    ];
    for (const w of words) expect(w.length).toBeLessThanOrEqual(LANE);
  });

  it('spells git object types in full', () => {
    // the design handoff truncated this to fit a five-wide lane; the lane is six wide here
    expect(GIT_OBJECTS).toContain('commit');
    expect(GIT_OBJECTS).not.toContain('cmmit');
  });

  it('uses Monkey keywords only — the language has no `while`', () => {
    expect([...MONKEY_KEYWORDS].sort()).toEqual(['else', 'false', 'fn', 'if', 'let', 'return', 'true']);
  });
});
