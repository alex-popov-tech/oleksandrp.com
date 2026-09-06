import { describe, it, expect } from 'vitest';
import { highlightLines } from './highlight';

describe('highlightLines', () => {
  it('returns one html string per line, keeping empty lines', async () => {
    const lines = await highlightLines('func a() {\n\n}', 'go');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('class="line"');
    expect(lines[0]).toContain('func');
    expect(lines[1]).toBe('<span class="line"></span>');
  });
});
