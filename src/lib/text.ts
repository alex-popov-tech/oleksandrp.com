/** Split a markdown body into paragraphs: blank lines separate, soft wraps join with a space. */
export function paragraphs(body: string | undefined): string[] {
  if (!body) return [];
  return body
    .split(/\n[ \t]*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter((p) => p.length > 0);
}
