import { describe, it, expect } from 'vitest';
import { SCRIPT } from './readme';
import { LANGUAGES, LANGUAGE_TOTAL } from './languages';
import { renderSession } from './lib/session';

const rows = renderSession(SCRIPT, Number.MAX_SAFE_INTEGER).rows;
const lines = rows.map((r) => r.spans.map((s) => s.text).join(''));

describe('README.sh', () => {
  it('runs every command and shows its output', () => {
    const commands = lines.filter((l) => l.startsWith('❯ '));
    expect(commands).toEqual([
      '❯ whoami',
      '❯ cat about.txt',
      '❯ ll projects/',
      '❯ cat start-here.md',
      '❯ ls ~/zmk/',
      '❯ cat ~/zmk/skean/config/skean.keymap | grep -A4 GALLIUM',
      '❯ echo $EDITOR $SHELL',
      '❯ open github.com/alex-popov-tech',
    ]);
  });

  it('fits the 80 columns the rest of the site wraps to', () => {
    // two extra for the indent every output row carries
    for (const row of rows) {
      const width = row.spans.reduce((n, s) => n + s.text.length, 0) + (row.indent ? 2 : 0);
      expect(width, row.spans.map((s) => s.text).join('')).toBeLessThanOrEqual(80);
    }
  });

  it('reports the language counts it was given', () => {
    for (const l of LANGUAGES) {
      const row = lines.find((line) => line.startsWith(l.name));
      expect(row).toContain(l.lines.toLocaleString('en-US'));
      expect(row).toContain(`${l.percent}%`);
    }
    const total = lines.find((l) => l.startsWith('Total'))!;
    expect(total).toContain(LANGUAGE_TOTAL.lines.toLocaleString('en-US'));
    expect(total).toContain(LANGUAGE_TOTAL.files.toLocaleString('en-US'));
  });

  it('draws a bar for every language, longest first', () => {
    const bars = LANGUAGES.map((l) => lines.find((line) => line.startsWith(l.name))!.replace(/[^█▌]/g, ''));
    expect(bars.every((b) => b.length > 0)).toBe(true);
    for (let i = 1; i < bars.length; i++) expect(bars[i].length).toBeLessThanOrEqual(bars[i - 1].length);
  });

  it('lets the prose reflow but never the drawings', () => {
    // on a phone the pane is narrower than 76 columns; prose has to give, a table cannot
    const prose = rows.filter((r) => r.spans.map((s) => s.text).join('').startsWith('Currently writing Go'));
    expect(prose).toHaveLength(1);
    expect(prose[0].wrap).toBe(true);
    const drawn = rows.filter((r) => r.spans.some((s) => /[┌│█▌]/.test(s.text)));
    expect(drawn.length).toBeGreaterThan(5);
    expect(drawn.some((r) => r.wrap)).toBe(false);
  });

  it('links the four projects worth opening first', () => {
    const links = rows.flatMap((r) => r.spans).filter((s) => s.href && !s.external);
    expect(links.map((l) => l.href)).toEqual([
      '/projects/from_scratch/redis',
      '/projects/from_scratch/git',
      '/projects/store',
      '/projects/acapulko',
    ]);
  });

  it('keeps the keyboard rectangular', () => {
    // every row but the thumb cluster spans both halves, so they are all one width
    const full = lines.filter((l) => /^[┌│├└]/.test(l));
    expect(full).toHaveLength(7);
    expect(new Set(full.map((l) => l.length))).toEqual(new Set([65]));
  });

  it('highlights the home row of the layer it is showing', () => {
    const homeRow = rows.find((r) => r.spans.map((s) => s.text).join('').startsWith('│F11'));
    expect(homeRow, 'the GALLIUM home row').toBeDefined();
    const amber = homeRow!.spans.filter((s) => s.color === 'accent').map((s) => s.text).join('');
    expect(amber).toBe('NRTSHAEI');
    // the caption names the same letters, so the two cannot drift apart
    const caption = lines.find((l) => l.startsWith('layer 0'))!;
    expect(caption).toContain([...amber.slice(0, 4)].join(' '));
    expect(caption).toContain([...amber.slice(4)].join(' '));
  });
});
