import { describe, it, expect } from 'vitest';
import { COLS, LOOP_S, ROWS, renderFrame } from './acapulko';
import type { Role } from '../diagram';

const ROLES: Role[] = ['fg', 'muted', 'dim', 'faint', 'accent', 'blue', 'green', 'peach', 'teal', 'orange', 'red'];
const textAt = (t: number, row: number) =>
  renderFrame(t).grid[row].map((c) => c.ch).join('').trimEnd();
const whole = (t: number) => renderFrame(t).grid.map((r) => r.map((c) => c.ch).join('')).join('\n');

describe('renderFrame', () => {
  it('is a 14 by 100 grid', () => {
    const { grid } = renderFrame(0);
    expect(grid).toHaveLength(ROWS);
    for (const row of grid) expect(row).toHaveLength(COLS);
  });

  it('is pure: the same t always gives the same frame', () => {
    expect(whole(3.25)).toBe(whole(3.25));
    expect(whole(9.5)).toBe(whole(9.5));
  });

  it('repeats its state every loop, though the marching packets do not', () => {
    // the packet phase is driven by absolute time, so the picture is not 16s-periodic
    for (const t of [1, 6, 8, 12]) {
      const a = renderFrame(t);
      const b = renderFrame(t + LOOP_S);
      expect([b.gridOn, b.bulbOn, b.phase, Math.round(b.pct)]).toEqual([a.gridOn, a.bulbOn, a.phase, Math.round(a.pct)]);
    }
  });

  it('only uses colour roles the stylesheet knows', () => {
    for (const t of [0, 5.5, 8, 12, 15.9]) {
      for (const row of renderFrame(t).grid) {
        for (const cell of row) expect(ROLES).toContain(cell.color);
      }
    }
  });

  it('runs on the grid, then loses it, then gets it back', () => {
    expect(renderFrame(2).gridOn).toBe(true);
    expect(renderFrame(8).gridOn).toBe(false);
    expect(renderFrame(13).gridOn).toBe(true);
  });

  it('turns the bulb off during the outage, after the notification lands', () => {
    expect(renderFrame(2).bulbOn).toBe(true);
    expect(renderFrame(5.2).bulbOn).toBe(true); // pulse still travelling
    expect(renderFrame(8).bulbOn).toBe(false);
    expect(renderFrame(13).bulbOn).toBe(true);
  });

  it('drains the battery on outage and charges it back on the grid', () => {
    expect(renderFrame(8).pct).toBeLessThan(renderFrame(6).pct);
    expect(renderFrame(4).pct).toBeGreaterThan(renderFrame(1).pct);
    for (const t of [0, 4, 6, 10, 12, 15]) {
      expect(renderFrame(t).pct).toBeGreaterThan(0);
      expect(renderFrame(t).pct).toBeLessThanOrEqual(100);
    }
  });

  it('shows the outage banner then the recovery banner', () => {
    expect(whole(8)).toContain('power outage detected');
    expect(whole(14)).toContain('power is back');
    expect(whole(2)).not.toContain('power outage detected');
  });

  it('leaves the state to colour rather than repeating it in words', () => {
    // the bulb and the grid pylon carry their state as colour; no "~ on" / "power on" text
    expect(whole(2)).toContain('status page');
    expect(whole(2)).not.toContain('~ on');
    expect(whole(8)).not.toContain('~ off');
    expect(textAt(2, 13).trim()).toBe('status page');
  });

  it('names the phase for the header line', () => {
    expect(renderFrame(1).phase).toBe('steady · on grid');
    expect(renderFrame(5.5).phase).toBe('grid dropped → notifying');
    expect(renderFrame(8).phase).toBe('on battery');
    expect(renderFrame(11.5).phase).toBe('grid restored → notifying');
  });

  it('draws every node', () => {
    const frame = whole(2);
    expect(frame).toContain('pi5');
    expect(frame).toContain('grid');
    expect(frame).toContain('deye');
    expect(frame).toContain('telegram');
    expect(frame).toContain('status page');
  });
});
