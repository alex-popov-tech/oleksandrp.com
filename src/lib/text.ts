/** Split a markdown body into paragraphs: blank lines separate, soft wraps join with a space. */
export function paragraphs(body: string | undefined): string[] {
  if (!body) return [];
  return body
    .split(/\n[ \t]*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter((p) => p.length > 0);
}

/** Column the prose is hard-wrapped to, the way a README is stored on disk. */
export const WRAP_COLUMNS = 80;

/**
 * Greedy word wrap, like `gq` in vim: break on spaces only, never inside a word.
 * A word longer than the column gets a line to itself rather than being split.
 */
export function hardWrap(text: string, columns: number = WRAP_COLUMNS): string[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return [];
  const lines: string[] = [];
  let line = words[0];
  for (const word of words.slice(1)) {
    if (line.length + 1 + word.length <= columns) line += ` ${word}`;
    else {
      lines.push(line);
      line = word;
    }
  }
  lines.push(line);
  return lines;
}
