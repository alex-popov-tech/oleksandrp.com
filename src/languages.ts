import type { Role } from './lib/diagram';

/**
 * Lines of code across the projects this site lists — a snapshot, not a live figure. The
 * sources are not in this repo, so the build cannot count them; see README > The README
 * session for the tokei command and the exclusions behind these numbers.
 *
 * Counted 2026-09-07 over 19 repositories: every project on this site, ~/.dotfiles, and all
 * four store.nvim modules. Vendored and generated trees excluded (node_modules, .svelte-kit,
 * .wrangler, git worktrees, templ output).
 */
export interface LanguageCount {
  name: string;
  files: number;
  lines: number;
  /** whole percent of the counted lines; these add up to 100 */
  percent: number;
  color: Role;
}

export const LANGUAGES: LanguageCount[] = [
  { name: 'Go', files: 262, lines: 24787, percent: 40, color: 'teal' },
  { name: 'TypeScript', files: 165, lines: 17062, percent: 28, color: 'blue' },
  { name: 'Lua', files: 111, lines: 15400, percent: 25, color: 'mauve' },
  { name: 'JavaScript', files: 29, lines: 2433, percent: 4, color: 'accent' },
  { name: 'Svelte', files: 20, lines: 951, percent: 2, color: 'peach' },
  { name: 'Shell', files: 17, lines: 846, percent: 1, color: 'green' },
];

export const LANGUAGE_TOTAL = { files: 604, lines: 61479 };
