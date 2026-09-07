import { describe, it, expect } from 'vitest';
import { COLS, ROWS, SAMPLE, renderFrame } from './schedule';
import type { Role } from '../diagram';

const ROLES: Role[] = ['fg', 'muted', 'dim', 'faint', 'accent', 'blue', 'green', 'peach', 'teal', 'orange', 'red', 'mauve'];
const whole = (t: number) => renderFrame(t).grid.map((r) => r.map((c) => c.ch).join('')).join('\n');
const rowAt = (t: number, row: number) => renderFrame(t).grid[row].map((c) => c.ch).join('');
/** the left column only: the agenda shares these rows */
const leftAt = (t: number, row: number) => rowAt(t, row).slice(0, 21).trim();
/** the row the pointer is on, or -1 */
const pointerRow = (t: number) => renderFrame(t).grid.findIndex((r) => r[22].ch === '▶');

describe('renderFrame', () => {
  it('is pure: the same t always gives the same frame', () => {
    expect(whole(3.25)).toBe(whole(3.25));
    expect(whole(30)).toBe(whole(30));
  });

  it('shows an outage in red, not the amber a maybe uses', () => {
    // 06:00 sits in 04:00-07:30, an outage; the range after it is a maybe
    expect(renderFrame(0).grid[2][39].color).toBe('red');
    expect(renderFrame(0).grid[3][39].color).toBe('accent');
    expect(renderFrame(0).grid[1][39].color).toBe('faint'); // past, so dimmed
  });

  it('only uses colour roles the stylesheet knows', () => {
    for (const t of [0, 6, 18, 30, 50, 71.9]) {
      for (const row of renderFrame(t).grid) {
        for (const cell of row) expect(ROLES).toContain(cell.color);
      }
    }
  });

  it('runs an hour of the day per second, from 06:00', () => {
    expect(renderFrame(0).clock).toBe('06:00');
    expect(renderFrame(1.5).clock).toBe('07:30');
    expect(renderFrame(12).clock).toBe('18:00');
  });

  it('rolls over midnight rather than reaching 24:00', () => {
    expect(renderFrame(17.99).clock).toBe('23:50');
    expect(renderFrame(18).clock).toBe('00:00');
  });

  it('steps the clock in ten-minute marks, so the digits stay readable', () => {
    // a simulated hour per second means a true minute count changes faster than the redraw
    const minutes = new Set<string>();
    for (let t = 0; t < 1; t += 1 / 120) minutes.add(renderFrame(t).clock);
    expect([...minutes]).toEqual(['06:00', '06:10', '06:20', '06:30', '06:40', '06:50']);
  });

  it('keeps the countdown in step with the clock it is shown beside', () => {
    // 06:20 with the change at 07:30 is 1h10m: a countdown off by minutes reads as a bug
    expect(renderFrame(1 / 3).clock).toBe('06:20');
    expect(leftAt(1 / 3, 10)).toBe('in 1h10m');
  });

  it('cycles today, tomorrow, the day after, and back', () => {
    expect(renderFrame(0).day).toBe(0);
    expect(renderFrame(20).day).toBe(1);
    expect(renderFrame(44).day).toBe(2);
    expect(renderFrame(68).day).toBe(0);
    expect(leftAt(0, 5)).toBe('today');
    expect(leftAt(20, 5)).toBe('tomorrow');
    expect(leftAt(44, 5)).toBe('day after');
  });

  it('points at exactly one range, the one the clock is inside', () => {
    for (const t of [0, 2, 5, 9, 14, 17.9]) {
      const row = pointerRow(t);
      expect(row).toBeGreaterThan(0);
      // one pointer, and it is on the range holding the current hour
      const hour = (t + 6) % 24;
      const [from, to] = SAMPLE.today[row - 1];
      expect(hour).toBeGreaterThanOrEqual(from);
      expect(hour).toBeLessThan(to);
    }
  });

  it('walks the pointer down the day, never back up', () => {
    let last = 0;
    for (let t = 0; t < 17.9; t += 0.25) {
      const row = pointerRow(t);
      expect(row).toBeGreaterThanOrEqual(last);
      last = row;
    }
  });

  it('dims the ranges already over and leaves the rest in colour', () => {
    // at 06:00 the first range (00:00-04:00) is past, the second is now
    const frame = renderFrame(0);
    expect(frame.grid[1][24].op).toBe(0.6);
    expect(frame.grid[1][24].color).toBe('faint');
    expect(frame.grid[2][24].color).toBe('fg'); // the current range reads as foreground
    expect(frame.grid[3][24].op).toBe(1);
  });

  it('counts down to the next change and never past it', () => {
    expect(leftAt(0, 10)).toBe('in 1h30m'); // 06:00 -> 07:30
    expect(leftAt(1, 10)).toBe('in 30m');
    expect(leftAt(1.4, 10)).toBe('in 10m');
    for (let t = 0; t < 17.9; t += 0.1) {
      expect(rowAt(t, 10)).not.toContain('-');
    }
  });

  it('names the status that comes next, not the one showing', () => {
    expect(renderFrame(0).status).toBe('no');
    expect(rowAt(0, 9)).toContain('next 07:30 maybe');
    // the last range of the day points at midnight and tomorrow's first status
    expect(rowAt(17.9, 9)).toContain('next tomorrow 00:00');
  });

  it('fills the progress bar across the current range', () => {
    const bar = (t: number) => rowAt(t, pointerRow(t)).slice(50, 62);
    expect(bar(2.01)).toBe('[░░░░░░░░░░]'); // 08:00, the range just started
    expect(bar(4.5)).toBe('[█████░░░░░]'); // 10:30, halfway through 08:00-13:00
    expect(bar(6)).toBe('[████████░░]'); // 12:00, four hours of five
  });
});
