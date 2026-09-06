import { describe, it, expect } from 'vitest';
import { CHAR_S, duration, renderSession, rowHtml, type Command } from './session';

const SCRIPT: Command[] = [
  { cmd: 'ab', out: [[{ text: 'first', color: 'fg' }]] },
  { cmd: 'cd', out: [[{ text: 'second', color: 'dim' }]] },
];
const text = (t: number) => renderSession(SCRIPT, t).rows.map((r) => r.spans.map((s) => s.text).join(''));

describe('renderSession', () => {
  it('types a command one character at a time', () => {
    expect(renderSession(SCRIPT, 0).typing).toBe('');
    expect(renderSession(SCRIPT, CHAR_S * 1.5).typing).toBe('a');
    expect(renderSession(SCRIPT, CHAR_S * 1.99).typing).toBe('a');
  });

  it('holds the output back until the command has finished running', () => {
    const typed = CHAR_S * 2;
    expect(text(typed + 0.01)).toEqual(['❯ ab']);
    expect(text(typed + 0.2)).toEqual(['❯ ab', 'first', '']);
  });

  it('pauses before starting the next command', () => {
    const afterFirst = CHAR_S * 2 + 0.18 + 0.55;
    expect(renderSession(SCRIPT, afterFirst - 0.01).typing).toBe(null);
    expect(renderSession(SCRIPT, afterFirst + 0.01).typing).toBe('');
  });

  it('keeps everything that has already run on screen', () => {
    expect(text(duration(SCRIPT))).toEqual(['❯ ab', 'first', '', '❯ cd', 'second', '']);
  });

  it('is done only after the last command has answered', () => {
    expect(renderSession(SCRIPT, 0).done).toBe(false);
    expect(renderSession(SCRIPT, duration(SCRIPT) - 0.6).done).toBe(false);
    expect(renderSession(SCRIPT, duration(SCRIPT)).done).toBe(true);
  });

  it('renders the whole session for a t past the end, which is what the build asks for', () => {
    const end = renderSession(SCRIPT, Number.MAX_SAFE_INTEGER);
    expect(end.rows).toHaveLength(6);
    expect(end.typing).toBe(null);
    expect(end.done).toBe(true);
  });

  it('indents output but not the prompt', () => {
    const { rows } = renderSession(SCRIPT, Number.MAX_SAFE_INTEGER);
    expect(rows.map((r) => r.indent)).toEqual([false, true, false, false, true, false]);
  });
});

describe('rowHtml', () => {
  it('carries the colour role as a class', () => {
    expect(rowHtml([{ text: 'hi', color: 'green' }])).toBe('<span class="c-green">hi</span>');
  });

  it('makes a link out of a span with an href, and opens external ones away', () => {
    expect(rowHtml([{ text: 'redis.go', color: 'blue', href: '/projects/redis' }]))
      .toBe('<a class="c-blue" href="/projects/redis">redis.go</a>');
    expect(rowHtml([{ text: 'gh', color: 'blue', href: 'https://github.com', external: true }]))
      .toContain('target="_blank" rel="noopener"');
  });

  it('escapes text, so a shell command cannot become markup', () => {
    expect(rowHtml([{ text: 'grep -A4 <x> & y', color: 'fg' }]))
      .toBe('<span class="c-fg">grep -A4 &lt;x&gt; &amp; y</span>');
  });
});
