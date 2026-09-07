/** Split a markdown body into paragraphs: blank lines separate, soft wraps join with a space. */
export function paragraphs(body: string | undefined): string[] {
  if (!body) return [];
  return body
    .split(/\n[ \t]*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter((p) => p.length > 0);
}

/**
 * Column the prose is hard-wrapped to, the way a README is stored on disk.
 *
 * 76 rather than a terminal's 80: the margin stream is a column beside the buffer, so the
 * buffer has to stay at least this wide or the hard-wrapped lines would soft-wrap again.
 * Four columns off the default is what buys every strip a home on a 1280px screen.
 */
export const WRAP_COLUMNS = 76;

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

/**
 * Cut text to fit a column budget, ending on an ellipsis so the cut reads as deliberate
 * rather than as a rendering fault. Characterwise, not on word boundaries: in a narrow
 * column "manage global…" carries more than "manage…".
 */
export function clip(text: string, columns: number): string {
  return text.length <= columns ? text : `${text.slice(0, columns - 1).trimEnd()}…`;
}
