import { describe, it, expect } from 'vitest';
import { SCENARIOS, SCENARIO_S, renderFrame } from './rio';
import type { Role } from '../diagram';

const ROLES: Role[] = ['fg', 'dim', 'faint', 'accent', 'blue', 'green', 'peach', 'teal', 'orange', 'red', 'mauve'];
const rows = (t: number) => renderFrame(t).grid.map((r) => r.map((c) => c.ch).join(''));
const whole = (t: number) => rows(t).join('\n');
/** the panes are side by side: 1-36 is the session without rio, 38 on is the one with it */
const left = (t: number) => rows(t).map((r) => r.slice(0, 37)).join('\n');
const right = (t: number) => rows(t).map((r) => r.slice(37)).join('\n');

describe('renderFrame', () => {
  it('is pure: the same t always gives the same frame', () => {
    expect(whole(3.25)).toBe(whole(3.25));
    expect(whole(17)).toBe(whole(17));
  });

  it('only uses colour roles the stylesheet knows', () => {
    for (const t of [0, 3, 5, 7, 9.8, 15, 25]) {
      for (const row of renderFrame(t).grid) {
        for (const cell of row) expect(ROLES).toContain(cell.color);
      }
    }
  });

  it('gives each scenario ten seconds, then comes back round', () => {
    expect(renderFrame(1).scenario).toBe(0);
    expect(renderFrame(11).scenario).toBe(1);
    expect(renderFrame(21).scenario).toBe(2);
    expect(renderFrame(31).scenario).toBe(0);
  });

  it('types the prompt in, and only shows a cursor while typing', () => {
    expect(whole(0.1)).not.toContain('dockerfile');
    expect(whole(1.2)).toContain('add a dock');
    expect(whole(1.2)).not.toContain('postgres');
    expect(whole(2.5)).toContain('postgres');
    // the cursor is gone once the hook fires, whatever the blink phase
    for (let t = 3; t < 9; t += 0.25) expect(whole(t)).not.toContain('▌');
  });

  it('highlights the matched keywords, on the hooked side only, after the hook', () => {
    const colourOf = (t: number, pane: number, word: string) => {
      const row = renderFrame(t).grid.find((r) => r.map((c) => c.ch).join('').slice(pane).includes(word))!;
      const at = row.map((c) => c.ch).join('').indexOf(word, pane);
      return row[at].color;
    };
    expect(colourOf(2.6, 38, 'dockerfile')).toBe('fg'); // before the hook
    expect(colourOf(3, 38, 'dockerfile')).toBe('accent');
    expect(colourOf(3, 1, 'dockerfile')).toBe('fg'); // the unhooked session never highlights
    expect(colourOf(3, 38, 'add')).toBe('fg'); // and only the words rio matched on
  });

  it('ends with the skill ignored on one side and invoked on the other', () => {
    expect(left(8)).toContain('○ docker-helper ignored');
    expect(right(8)).toContain('◉ docker-helper invoked');
    expect(left(8)).not.toContain('invoked');
  });

  it('calls a skill a Skill and an agent a Task', () => {
    expect(right(8)).toContain('Skill(docker-helper)');
    expect(right(18)).toContain('Task(code-reviewer)');
    expect(right(18)).toContain('loaded agent');
  });

  it('clears both sides before the next scenario starts', () => {
    expect(whole(9.8)).not.toContain('docker-helper');
    expect(whole(9.8)).toContain('activation'); // the bars stay put
  });

  it('keeps each session inside its own pane', () => {
    // a longer prompt or response would run one pane into the other. The last row is the
    // caption, which is deliberately one line across both.
    for (let t = 0; t < SCENARIO_S * SCENARIOS.length; t += 0.1) {
      for (const row of rows(t).slice(0, -1)) {
        expect(row.slice(36, 38), `t=${t.toFixed(1)}`).toBe('  ');
      }
    }
  });
});
