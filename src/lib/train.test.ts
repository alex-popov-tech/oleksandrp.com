import { describe, it, expect } from 'vitest';
import { D51_FRAMES, TRAIN_COLS, TRAIN_ROWS } from './train';

describe('D51 art', () => {
  it('is six wheel patterns of ten rows', () => {
    expect(D51_FRAMES).toHaveLength(6);
    for (const frame of D51_FRAMES) expect(frame).toHaveLength(TRAIN_ROWS);
  });
  it('is a rectangle, so the sprite never ragged-edges mid-run', () => {
    for (const frame of D51_FRAMES) for (const row of frame) expect(row).toHaveLength(TRAIN_COLS);
  });
  it('only animates the wheels: the body and tender are identical in every frame', () => {
    const body = D51_FRAMES[0].slice(0, 7);
    for (const frame of D51_FRAMES) expect(frame.slice(0, 7)).toEqual(body);
  });
  it('turns the drivers: the wheel rows differ between frames', () => {
    const wheels = D51_FRAMES.map((f) => f.slice(7).join('\n'));
    expect(new Set(wheels).size).toBe(D51_FRAMES.length);
  });
});
