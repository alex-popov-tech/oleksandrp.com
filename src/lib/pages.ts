import { fileName, type Lang, type Section } from './tree';

export const ROOT = '~/oleksandr';

function parts(section: Section, id: string, lang: Lang): string[] {
  const segs = id.split('/');
  return [section, ...segs.slice(0, -1), fileName(id, lang)];
}

export function crumbFor(section: Section, id: string, lang: Lang): string {
  return parts(section, id, lang).join(' > ');
}

export function pathFor(section: Section, id: string, lang: Lang): string {
  return `${ROOT}/${parts(section, id, lang).join('/')}`;
}

export function shortPathFor(section: Section, id: string, lang: Lang): string {
  const p = parts(section, id, lang);
  return `.../${p.slice(-2).join('/')}`;
}

export interface BracketLink {
  label: string;
  href: string;
}

export function bracketLinks(data: { repo?: string; live?: string }): BracketLink[] {
  const out: BracketLink[] = [];
  if (data.repo) out.push({ label: '[github]', href: `https://github.com/${data.repo}` });
  if (data.live) out.push({ label: '[live]', href: data.live });
  return out;
}

/**
 * The site path of the page being rendered. With `build.format: 'file'` Astro hands us
 * `Astro.url.pathname` values like `/index.html` and `/projects/store.html`; the tree hrefs
 * and the canonical URL use extensionless paths without a trailing slash.
 */
export function currentPath(pathname: string): string {
  const noIndex = pathname.replace(/\/index\.html$/, '/');
  const noExt = noIndex.replace(/\.html$/, '');
  if (noExt === '' || noExt === '/') return '/';
  return noExt.replace(/\/$/, '');
}
