/** Relative line number labels, 1-based cursor. The cursor line shows its absolute number. */
export function gutter(cursor: number, total: number): string[] {
  const out: string[] = [];
  for (let n = 1; n <= total; n++) out.push(n === cursor ? String(n) : String(Math.abs(n - cursor)));
  return out;
}

const MARK = '<span class="nr"></span>';
const FIRST = '<div class="ln">';

/**
 * Build-time numbering: fill every empty `.nr` in order with relative numbers for cursor = 1,
 * and mark the first `.ln` as `cur`. Client JS re-numbers when the cursor moves.
 */
export function numberLines(html: string): string {
  const total = html.split(MARK).length - 1;
  if (total === 0) return html;
  const labels = gutter(1, total);
  let i = 0;
  const numbered = html.replaceAll(MARK, () => `<span class="nr">${labels[i++]}</span>`);
  return numbered.replace(FIRST, '<div class="ln cur">');
}
