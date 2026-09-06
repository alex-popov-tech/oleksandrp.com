import { describe, it, expect } from 'vitest';
import { mirrorRow, TRAIN_COLS, TRAIN_FRAMES, TRAIN_FRAMES_FLIPPED, TRAIN_ROWS } from './train';

describe('sl train art', () => {
  it('is six wheel patterns of six rows', () => {
    expect(TRAIN_FRAMES).toHaveLength(6);
    for (const frame of TRAIN_FRAMES) expect(frame).toHaveLength(TRAIN_ROWS);
  });
  it('is a rectangle, so the sprite never ragged-edges mid-run', () => {
    for (const frame of TRAIN_FRAMES) for (const row of frame) expect(row).toHaveLength(TRAIN_COLS);
  });
  it('only animates the wheels: engine body, tender and carriage never change', () => {
    const body = TRAIN_FRAMES[0].slice(0, 4);
    for (const frame of TRAIN_FRAMES) expect(frame.slice(0, 4)).toEqual(body);
  });
  it('turns the drivers: the wheel rows differ between frames', () => {
    const wheels = TRAIN_FRAMES.map((f) => f.slice(4).join('\n'));
    expect(new Set(wheels).size).toBe(TRAIN_FRAMES.length);
  });
  it('stays small enough to cross a laptop screen quickly', () => {
    expect(TRAIN_COLS).toBeLessThan(70);
    expect(TRAIN_ROWS).toBeLessThan(8);
  });
});

describe('mirroring', () => {
  it('reverses the row and flips the glyphs that have a mirror image', () => {
    expect(mirrorRow('/~\\')).toBe('/~\\');
    expect(mirrorRow('(O)=--')).toBe('--=(O)');
    expect(mirrorRow('[a]')).toBe('[a]');
    expect(mirrorRow('|__/')).toBe('\\__|');
  });
  it('is its own inverse', () => {
    for (const row of TRAIN_FRAMES[0]) expect(mirrorRow(mirrorRow(row))).toBe(row);
  });
  it('keeps the flipped consist the same shape', () => {
    expect(TRAIN_FRAMES_FLIPPED).toHaveLength(TRAIN_FRAMES.length);
    for (const frame of TRAIN_FRAMES_FLIPPED) {
      expect(frame).toHaveLength(TRAIN_ROWS);
      for (const row of frame) expect(row).toHaveLength(TRAIN_COLS);
    }
  });
  it('puts the engine at the other end', () => {
    // the funnel sits in the first row; facing left it is near the start, facing right the end
    const facingLeft = TRAIN_FRAMES[0][0].indexOf('++');
    const facingRight = TRAIN_FRAMES_FLIPPED[0][0].indexOf('++');
    expect(facingLeft).toBeLessThan(TRAIN_COLS / 2);
    expect(facingRight).toBeGreaterThan(TRAIN_COLS / 2);
  });
});
