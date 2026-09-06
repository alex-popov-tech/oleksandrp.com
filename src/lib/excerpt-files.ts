import { parseExcerpt, type Excerpt } from './excerpts';

const raw = import.meta.glob('/src/excerpts/**/*', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

/** Load and parse an excerpt by its path under src/excerpts. Throws at build time if missing. */
export function loadExcerpt(file: string): Excerpt {
  const key = `/src/excerpts/${file}`;
  const src = raw[key];
  if (src === undefined) {
    throw new Error(`excerpt file not found: ${key} (have: ${Object.keys(raw).join(', ')})`);
  }
  return parseExcerpt(file, src);
}
