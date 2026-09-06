import { describe, it, expect } from 'vitest';
import { TRAIN_COLS, TRAIN_FRAMES, TRAIN_ROWS } from './train';

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
