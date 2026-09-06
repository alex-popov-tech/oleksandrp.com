import { describe, it, expect } from 'vitest';
import { frameFor, mirrorRow, TRAIN_COLS, TRAIN_FRAMES, TRAIN_FRAMES_FLIPPED, TRAIN_ROWS } from './train';

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

describe('frameFor', () => {
  const N = TRAIN_FRAMES.length;
  /** the pattern indexes seen as the train advances, in travel order */
  const walk = (from: number, eastbound: boolean) =>
    Array.from({ length: 24 }, (_, i) => frameFor(eastbound ? from + i : from - i, eastbound, 2, N));
  /** how the index moves between consecutive columns, as a signed step mod N */
  const steps = (seq: number[]) =>
    seq.slice(1).map((v, i) => (((v - seq[i]) % N) + N) % N);

  it('walks the cycle the same way whichever direction the train travels', () => {
    // the eastbound consist is mirrored, which reverses the apparent rotation; its basis
    // must reverse too, or the drivers spin backwards one way round. The phase differs,
    // the direction must not.
    const west = steps(walk(40, false));
    const east = steps(walk(40, true));
    expect(new Set(west)).toEqual(new Set(east));
    for (const s of west) expect([0, N - 1]).toContain(s);
  });

  it('shows every pattern for exactly colsPerFrame columns', () => {
    const counts = new Map<number, number>();
    for (let col = 0; col < N * 2; col++) {
      const f = frameFor(col, false, 2, N);
      counts.set(f, (counts.get(f) ?? 0) + 1);
    }
    expect([...counts.values()]).toEqual(Array(N).fill(2));
  });
});
