import { describe, it, expect } from 'vitest';
import { DIAGRAMS, DIAGRAM_IDS } from './index';

/**
 * Every diagram is a character grid: one glyph, one cell. A glyph JetBrains Mono does not
 * carry falls back to another face at a different advance width and shears the row it is on
 * — braille (`⠋`) measures 10.26px against the 9px cell, for instance.
 *
 * So the set below is a whitelist: each of these was measured in the browser at exactly one
 * cell. Adding a glyph to a diagram fails this test until it is measured and listed here.
 */
const SAFE = new Set([
  // ascii
  ...Array.from({ length: 0x7f - 0x20 }, (_, i) => String.fromCharCode(0x20 + i)),
  // box drawing
  ...'─│┌┐└┘├┤┬┴┼╭╮╰╯',
  // blocks
  ...'█▓▒░▀▄▌▐▖▗▘▝▙▚▞▛▜▟',
  // geometric
  ...'▪▫●○◉◎◐◑◒◓◜◝◞◟▶◀★✓',
  // arrows and punctuation
  ...'⇡⇣→←↑↓·–—…',
]);

describe.each(DIAGRAM_IDS)('%s', (id) => {
  const diagram = DIAGRAMS[id];

  it('draws only glyphs that are one cell wide in JetBrains Mono', () => {
    const used = new Set<string>();
    // sample the whole loop: a glyph may only appear for a fraction of a second
    for (let t = 0; t < 20; t += 0.05) {
      for (const row of diagram.render(t).grid) for (const cell of row) used.add(cell.ch);
    }
    expect([...used].filter((ch) => !SAFE.has(ch))).toEqual([]);
  });

  it('fills its declared grid', () => {
    const { grid } = diagram.render(0);
    expect(grid).toHaveLength(diagram.rows);
    for (const row of grid) expect(row).toHaveLength(diagram.cols);
  });
});
