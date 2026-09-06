import { describe, it, expect } from 'vitest';
import { COLS, LOOP_S, PLUGINS, ROWS, renderFrame } from './store';
import type { Bg, Role } from '../diagram';

const ROLES: Role[] = ['fg', 'dim', 'faint', 'accent', 'blue', 'green', 'peach', 'teal', 'orange', 'red', 'mauve'];
const BGS: Bg[] = ['sel', 'flash'];
const whole = (t: number) => renderFrame(t).grid.map((r) => r.map((c) => c.ch).join('')).join('\n');
const rowAt = (t: number, row: number) => renderFrame(t).grid[row].map((c) => c.ch).join('');

describe('renderFrame', () => {
  it('is a 19 by 78 grid', () => {
    const { grid } = renderFrame(0);
    expect(grid).toHaveLength(ROWS);
    for (const row of grid) expect(row).toHaveLength(COLS);
  });

  it('is pure: the same t always gives the same frame', () => {
    expect(whole(2.5)).toBe(whole(2.5));
    expect(whole(6)).toBe(whole(6));
  });

  it('only uses colours and highlights the stylesheet knows', () => {
    for (const t of [0, 2, 5, 7.3, 11.9]) {
      for (const row of renderFrame(t).grid) {
        for (const cell of row) {
          expect(ROLES).toContain(cell.color);
          if (cell.bg) expect(BGS).toContain(cell.bg);
        }
      }
    }
  });

  it('walks the list one plugin per j, and stays there', () => {
    expect(renderFrame(0).selected).toBe(0);
    expect(renderFrame(1).selected).toBe(1);
    expect(renderFrame(2.5).selected).toBe(3);
    expect(renderFrame(4).selected).toBe(5);
    expect(renderFrame(11).selected).toBe(5);
  });

  it('starts over on the next loop', () => {
    expect(renderFrame(LOOP_S + 0.1).selected).toBe(0);
    expect(renderFrame(LOOP_S + 0.1).installed).toBe(false);
  });

  it('spins while installing, then reports installed', () => {
    expect(renderFrame(4).installing).toBe(false);
    expect(renderFrame(5)).toMatchObject({ installing: true, installed: false });
    expect(whole(5)).toContain('installing');
    expect(renderFrame(8)).toMatchObject({ installing: false, installed: true });
    expect(whole(8)).toContain('✓ installed');
  });

  it('turns the spinner', () => {
    const spinner = (t: number) => rowAt(t, 5 + renderFrame(t).selected).match(/[▘▝▗▖]/)?.[0];
    expect(spinner(5)).toBeDefined();
    expect(spinner(5)).not.toBe(spinner(5 + 1 / 8));
    expect(spinner(5)).toBe(spinner(5 + 4 / 8)); // four frames, then round again
  });

  it('highlights the selected row, and flashes it green when the install lands', () => {
    const bgOf = (t: number, row: number) => renderFrame(t).grid[row][10].bg;
    expect(bgOf(2, 5 + renderFrame(2).selected)).toBe('sel');
    expect(bgOf(2, 5)).toBeUndefined(); // a row nobody is on carries no highlight
    expect(bgOf(7.3, 5 + 5)).toBe('flash');
    expect(bgOf(9, 5 + 5)).toBe('sel'); // the flash is over, the selection remains
  });

  it('follows the selection in the readme pane', () => {
    for (const [t, i] of [[0, 0], [2.5, 3], [4, 5]] as const) {
      expect(rowAt(t, 5)).toContain(PLUGINS[i].name);
      expect(rowAt(t, 11)).toContain(`"${PLUGINS[i].author}/${PLUGINS[i].name}",`);
    }
  });

  it('echoes the keys pressed, then what lazy.nvim did', () => {
    expect(rowAt(0.1, 18).trim()).toBe('');
    expect(rowAt(2.5, 18).trim()).toBe('j j j');
    expect(rowAt(5, 18).trim()).toBe('j j j j j i');
    expect(rowAt(8, 18).trim()).toBe(`installed ${PLUGINS[5].name} · lazy-sync ok`);
  });

  it('keeps the install mark inside the list pane', () => {
    // the pane's right border is column 45; a mark that spills past it breaks the box
    for (const t of [5, 6, 8, 11]) {
      expect(renderFrame(t).grid[5 + 5][45].ch).toBe('│');
    }
  });
});
