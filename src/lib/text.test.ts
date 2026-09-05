import { describe, it, expect } from 'vitest';
import { paragraphs } from './text';

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
