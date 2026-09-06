import { describe, it, expect } from 'vitest';
import { DIAGRAMS, DIAGRAM_IDS } from './index';
import { SCRIPT } from '../../readme';
import { renderSession } from '../session';

/**
 * Every diagram is a character grid: one glyph, one cell. A glyph JetBrains Mono does not
 * carry falls back to another face at a different advance width and shears the row it is on
 * — braille (`⠋`) measures 10.26px against the 9px cell, `⎿` measures 15px, and `★` is not
 * in the font at all despite looking like it belongs.
 *
 * So the set below is a whitelist, and it is deliberately narrow: ASCII, plus the glyphs
 * carried by the symbol subset in src/fonts (U+2190-21FF, U+2500-25FF, U+2700-27BF), which
 * are 600/1000 em like every letter. Adding a glyph to a diagram fails this test until it is
 * confirmed present in that subset — check with the pyftsubset recipe in README > Icons.
 */
const SAFE = new Set([
  // ascii
  ...Array.from({ length: 0x7f - 0x20 }, (_, i) => String.fromCharCode(0x20 + i)),
  // box drawing
  ...'─│┌┐└┘├┤┬┴┼╭╮╰╯',
  // blocks
  ...'█▓▒░▀▄▌▐▖▗▘▝▙▚▞▛▜▟',
  // geometric
  ...'■□▪▫▲△▶▷▸◀◁◆◇◈◉○◌◎●',
  // arrows, marks and punctuation
  ...'←↑→↓↔↕⇥✓✕✗✶➔➜➝➞·–—…',
  // the shell prompt and the modifier keys the keymap names
  ...'❯⌃⌘⌥',
]);

describe.each(DIAGRAM_IDS)('%s', (id) => {
  const diagram = DIAGRAMS[id];

  it('draws only glyphs that are one cell wide in JetBrains Mono', () => {
    const used = new Set<string>();
    // 80s covers the longest loop; the step is fine enough to catch a glyph that only
    // shows for a fraction of a second, like the install flash or a notification banner
    for (let t = 0; t < 80; t += 0.05) {
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

describe('README.sh', () => {
  it('draws only glyphs that are one cell wide in JetBrains Mono', () => {
    const used = new Set<string>();
    for (const row of renderSession(SCRIPT, Number.MAX_SAFE_INTEGER).rows) {
      for (const span of row.spans) for (const ch of span.text) used.add(ch);
    }
    for (const { cmd } of SCRIPT) for (const ch of cmd) used.add(ch);
    expect([...used].filter((ch) => !SAFE.has(ch))).toEqual([]);
  });
});
