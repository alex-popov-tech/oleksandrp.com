import { describe, it, expect } from 'vitest';
import { clip, hardWrap, paragraphs } from './text';

describe('paragraphs', () => {
  it('splits on blank lines and joins soft wraps', () => {
    expect(paragraphs('one\ntwo\n\nthree')).toEqual(['one two', 'three']);
  });
  it('drops empty paragraphs and trims', () => {
    expect(paragraphs('\n\n  a  \n\n\n b \n')).toEqual(['a', 'b']);
  });
  it('handles undefined', () => {
    expect(paragraphs(undefined)).toEqual([]);
  });
});

describe('hardWrap', () => {
  it('breaks on spaces at the column boundary', () => {
    expect(hardWrap('aaa bbb ccc ddd', 7)).toEqual(['aaa bbb', 'ccc ddd']);
    expect(hardWrap('aaa bbb ccc', 11)).toEqual(['aaa bbb ccc']);
  });
  it('never splits a word, even one longer than the column', () => {
    expect(hardWrap('hi supercalifragilistic yo', 6)).toEqual(['hi', 'supercalifragilistic', 'yo']);
  });
  it('collapses runs of whitespace and handles empty input', () => {
    expect(hardWrap('a   b', 80)).toEqual(['a b']);
    expect(hardWrap('   ', 80)).toEqual([]);
  });
  it('defaults to 80 columns and keeps every line within it', () => {
    const prose = 'A grep built from scratch in Go with no regex libraries, where the pattern is compiled by hand into a token list and matching is a backtracking DFS.';
    const lines = hardWrap(prose);
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines) expect(l.length).toBeLessThanOrEqual(80);
    expect(lines.join(' ')).toBe(prose);
  });
});

describe('clip', () => {
  it('leaves text that already fits', () => {
    expect(clip('short', 10)).toBe('short');
    expect(clip('exactly te', 10)).toBe('exactly te');
  });

  it('ends on an ellipsis, within the budget', () => {
    expect(clip('manage global and project-local settings', 15)).toBe('manage global…');
    expect(clip('manage global and project-local settings', 15)).toHaveLength(14);
  });

  it('does not leave a space stranded before the ellipsis', () => {
    expect(clip('a collection of QoL plugins', 16)).toBe('a collection of…');
  });
});
