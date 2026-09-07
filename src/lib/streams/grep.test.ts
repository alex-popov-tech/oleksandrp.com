import { describe, it, expect } from 'vitest';
import type { Role } from '../diagram';
import { MAX_OP } from './engine';
import { COLS, PREFIX, SESSIONS, command, grep, matchMask } from './grep';

const ROLES: Role[] = ['fg', 'muted', 'dim', 'faint', 'accent', 'blue', 'green', 'peach', 'teal', 'orange', 'red', 'mauve'];
const lit = (mask: boolean[]) => mask.map((h, i) => (h ? i : -1)).filter((i) => i >= 0);

describe('matchMask', () => {
  it('marks exactly the spans the pattern matches', () => {
    expect(lit(matchMask('is', 'it is is broken'))).toEqual([3, 4, 6, 7]);
  });

  it('resolves a backreference', () => {
    // `bar bar` is the match; `baz` is not part of it
    const mask = matchMask('(\\w+) \\1', 'bar bar baz');
    expect(lit(mask)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('honours a {n,m} range', () => {
    expect(matchMask('^a{2,4}$', 'aaa').every(Boolean)).toBe(true);
    expect(matchMask('^a{2,4}$', 'aaaaa').some(Boolean)).toBe(false);
    expect(matchMask('^a{2,4}$', 'a').some(Boolean)).toBe(false);
  });

  it('is pure: a call that stops on a zero-width match cannot leak into the next', () => {
    // `a*` matches `aa`, then matches empty and breaks — leaving lastIndex at 2 on any RegExp
    // that outlived the call. A cached one would resume past the `aa` and return nothing.
    const first = matchMask('a*', 'aab');
    expect(lit(first)).toEqual([0, 1]);
    expect(matchMask('a*', 'aab')).toEqual(first);
  });

  it('does not spin on a zero-width match', () => {
    expect(matchMask('x*', 'abc').some(Boolean)).toBe(false);
  });
});

describe('the sessions', () => {
  it('every command and every line fits the strip', () => {
    for (const s of SESSIONS) {
      expect(command(s).length).toBeLessThanOrEqual(COLS);
      for (const line of s.lines) expect(line.length).toBeLessThanOrEqual(COLS - PREFIX);
    }
  });

  it('every session shows both a match and a miss', () => {
    for (const s of SESSIONS) {
      const hits = s.lines.filter((l) => matchMask(s.pattern, l).some(Boolean));
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.length).toBeLessThan(s.lines.length);
    }
  });

  it('demonstrates the syntax grep-go is built around', () => {
    const patterns = SESSIONS.map((s) => s.pattern);
    expect(patterns).toContain('(\\w+) \\1');
    expect(patterns).toContain('^a{2,4}$');
    expect(patterns.some((p) => p.includes('|'))).toBe(true);
    expect(patterns.some((p) => p.includes('[^'))).toBe(true);
  });

  it('writes the command from the pattern, so the two cannot drift', () => {
    expect(command({ pattern: '^foo$', lines: [] })).toBe("❯ grep -nE '^foo$'");
  });
});

describe('grep', () => {
  it('is pure: the same t and height always give the same frame', () => {
    expect(grep.render(4.25, 20)).toEqual(grep.render(4.25, 20));
  });

  it('fills the grid it is asked for, at any height', () => {
    for (const rows of [6, 12, 18, 40]) {
      const g = grep.render(3, rows);
      expect(g).toHaveLength(rows);
      for (const row of g) expect(row).toHaveLength(COLS);
    }
  });

  it('only uses colour roles the stylesheet knows, and never over-brightens', () => {
    for (let t = 0; t < 60; t += 0.5) {
      for (const row of grep.render(t, 20)) {
        for (const cell of row) {
          expect(ROLES).toContain(cell.color);
          expect(cell.op).toBeLessThanOrEqual(MAX_OP + 1e-9);
        }
      }
    }
  });

  it('lights up exactly the characters the pattern matches', () => {
    const pattern = new Map<string, string>();
    for (const s of SESSIONS) for (const line of s.lines) pattern.set(line, s.pattern);

    let checked = 0;
    for (let t = 0; t < 60; t += 0.9) {
      for (const row of grep.render(t, 24)) {
        const text = row.slice(PREFIX).map((c) => c.ch).join('').replace(/ +$/, '');
        const p = pattern.get(text);
        if (!p) continue;
        const mask = matchMask(p, text);
        for (let i = 0; i < text.length; i++) expect(row[i + PREFIX].bg === 'match').toBe(mask[i]);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('only ever puts the match background under green text', () => {
    for (let t = 0; t < 60; t += 0.5) {
      for (const row of grep.render(t, 20)) {
        for (const cell of row) if (cell.bg === 'match') expect(cell.color).toBe('green');
      }
    }
  });
});
