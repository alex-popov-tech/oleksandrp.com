import { describe, it, expect } from 'vitest';
import { gutter, numberLines } from './numbers';

describe('gutter', () => {
  it('shows the absolute number on the cursor line and distances elsewhere', () => {
    expect(gutter(1, 4)).toEqual(['1', '1', '2', '3']);
    expect(gutter(3, 5)).toEqual(['2', '1', '3', '1', '2']);
  });
  it('handles an empty buffer', () => {
    expect(gutter(1, 0)).toEqual([]);
  });
});

describe('numberLines', () => {
  const html =
    '<div class="ln"><span class="nr"></span><div class="tx">a</div></div>' +
    '<div class="ln"><span class="nr"></span><div class="tx">b</div></div>' +
    '<div class="ln"><span class="nr"></span><div class="tx">c</div></div>';
  it('fills numbers for cursor on line 1 and marks the first line current', () => {
    const out = numberLines(html);
    expect(out).toBe(
      '<div class="ln cur"><span class="nr">1</span><div class="tx">a</div></div>' +
        '<div class="ln"><span class="nr">1</span><div class="tx">b</div></div>' +
        '<div class="ln"><span class="nr">2</span><div class="tx">c</div></div>',
    );
  });
  it('leaves html without lines untouched', () => {
    expect(numberLines('<p>x</p>')).toBe('<p>x</p>');
  });
});
