export interface Excerpt {
  /** path under src/excerpts, e.g. 'redis-go/unmarshal.go' */
  file: string;
  /** 'owner/repo' */
  repo: string;
  /** path inside the repo */
  path: string;
  from: number;
  to: number;
  permalink: string;
  /** shiki language id */
  lang: string;
  /** code without the header line, trailing whitespace trimmed */
  code: string;
}

const HEADER =
  /^(?:\/\/|--|#|;)\s*(https:\/\/github\.com\/([^/\s]+\/[^/\s]+)\/blob\/[0-9a-f]+\/([^#\s]+)#L(\d+)-L(\d+))\s*$/;

export const SHIKI_LANG: Record<string, string> = {
  go: 'go',
  lua: 'lua',
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  sh: 'bash',
  svelte: 'svelte',
  md: 'markdown',
};

export function langFor(file: string): string {
  const ext = file.slice(file.lastIndexOf('.') + 1);
  const lang = SHIKI_LANG[ext];
  if (!lang) throw new Error(`no shiki language for ${file}`);
  return lang;
}

export function parseExcerpt(file: string, raw: string): Excerpt {
  const nl = raw.indexOf('\n');
  const first = (nl === -1 ? raw : raw.slice(0, nl)).trim();
  const m = HEADER.exec(first);
  if (!m) {
    throw new Error(`excerpt ${file}: first line must be a GitHub permalink comment, got: ${first}`);
  }
  const code = (nl === -1 ? '' : raw.slice(nl + 1)).replace(/\s+$/, '');
  return {
    file,
    permalink: m[1],
    repo: m[2],
    path: m[3],
    from: Number(m[4]),
    to: Number(m[5]),
    lang: langFor(file),
    code,
  };
}

export function excerptLabel(e: Excerpt): string {
  return `${e.repo.slice(e.repo.indexOf('/') + 1)}/${e.path}:${e.from}-${e.to}`;
}
