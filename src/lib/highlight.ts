import { codeToHast } from 'shiki';
import { toHtml } from 'hast-util-to-html';
import type { Element } from 'hast';

export const THEME = 'catppuccin-mocha';

/** Highlight code and return each line's HTML (`<span class="line">…</span>`), no <pre>. */
export async function highlightLines(code: string, lang: string): Promise<string[]> {
  const root = await codeToHast(code, { lang, theme: THEME });
  const pre = root.children.find((n): n is Element => n.type === 'element');
  const codeEl = pre?.children.find((n): n is Element => n.type === 'element');
  if (!codeEl) throw new Error('shiki returned no <code> element');
  return codeEl.children
    .filter((n): n is Element => n.type === 'element' && n.properties?.class === 'line')
    .map((line) => toHtml(line));
}
