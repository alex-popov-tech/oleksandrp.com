# Portfolio v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Oleksandr Popov's portfolio as a static Astro site that looks and behaves like a Neovim workspace, fully buildable and testable locally, with everything a Cloudflare Pages deploy needs already committed.

**Architecture:** Markdown content collections mirror the sidebar file tree (directory = folder, file = entry). One layout renders winbar, tree, buffer, statusline and command line; every buffer child is a numbered "line" so relative line numbers work at any width. Code excerpts are real source files highlighted by Shiki at build time and typed out by a small custom element; a single vanilla-TS island adds vim keys.

**Tech Stack:** Astro 7 (static, content layer with `glob` loader, `ClientRouter` view transitions), Shiki 4 (`catppuccin-mocha`), `hast-util-to-html`, `@fontsource-variable/jetbrains-mono`, Vitest 5, Playwright 1.63, npm, Node 24.

**Spec:** `docs/superpowers/specs/2026-09-06-portfolio-v2-design.md`

## Global Constraints

- Repo root is `/Users/alex/me/pet/portfolio_v2`. `design/` stays in the repo untouched. Every command below runs from the repo root unless it says otherwise.
- Node 24 (`.nvmrc` = `24`), npm. No pnpm, no wrangler.
- Dependencies: `astro@^7.3.1`, `@astrojs/sitemap@^3.7.4`, `shiki@^4.4.3`, `hast-util-to-html@^9.0.5`, `@fontsource-variable/jetbrains-mono@^5.3.0`; dev: `@astrojs/check@^0.9.10`, `typescript@^6.0.3`, `vitest@^5.0.0`, `@playwright/test@^1.63.0`, `@types/hast`.
- `site: 'https://oleksandrp.com'`, `output: 'static'`, `build.format: 'file'`, `trailingSlash: 'never'`. URLs are extensionless: `/projects/from_scratch/redis`.
- One theme, Catppuccin Mocha. Colors come from the `CATPPUCCIN` dict in `design/gen_v4.py`; Shiki theme is `catppuccin-mocha`.
- Font: `'JetBrains Mono Variable'` from fontsource, ligatures off. 15px / 22px line height on desktop, 13px / 20px under 900px.
- Placeholders in `[BRACKETS]` ship as written. Never invent dates, roles or employers.
- No Ctrl-based key bindings. No client frameworks. Every link works with JavaScript disabled.
- v1 data source: `/Users/alex/me/pet/portfolio/src/data.astro`; images in `/Users/alex/me/pet/portfolio/src/images/`; video `/Users/alex/me/pet/portfolio/public/videos/aoc2024.mp4`.
- Commit after every task. Commit messages end with:
  ```
  Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_019g1dE5VEZvmCiBSw3yE1BW
  ```
- Verified facts (a throwaway probe was built with these exact APIs): `defineCollection` and `z` come from `astro:content`, `glob` from `astro/loaders`, `getCollection` and `render` from `astro:content`, `ClientRouter` from `astro:transitions`, `getViteConfig` from `astro/config`. An entry in `src/content/projects/from_scratch/redis.md` has `entry.id === 'from_scratch/redis'`. `astro preview` serves `/projects/store` as 200 and `/projects/store/` as 404 with the file format. Shiki's `codeToHast` gives `pre > code > span.line` where the line element has `properties.class === 'line'` (a string, not an array) and empty lines are empty spans.

---

## File structure

```
astro.config.mjs            site, static, file format, no trailing slash, sitemap, shiki theme
package.json  tsconfig.json  .nvmrc  vitest.config.ts  playwright.config.ts
.github/workflows/ci.yml    check, unit, build, e2e on push and PR
public/
  favicon.svg  robots.txt  _headers  _redirects  og.png
  videos/aoc2024.mp4        copied from v1
  cv/.gitkeep               PDFs land here later
src/
  content.config.ts         three collections: projects, work, elsewhere
  content/projects/**/*.md  one file per project, image beside it
  content/work/*.md         four jobs, placeholders
  content/elsewhere/*.md    advent_of_code
  excerpts/<repo>/<file>    verbatim code, first line is the GitHub permalink comment
  cv.json                   { "<file>.pdf": "<label>" }
  site.ts                   SITE meta, FOLDED folders, README showcase list
  readme.ts                 README lines as data
  styles/theme.css          palette variables (+ Gruvbox commented out)
  styles/global.css         layout, lines, tree, statusline, mobile
  lib/tree.ts               buildTree, fileName, countFiles          (pure, tested)
  lib/numbers.ts            gutter, numberLines                      (pure, tested)
  lib/text.ts               paragraphs                               (pure, tested)
  lib/excerpts.ts           parseExcerpt, langFor, excerptLabel      (pure, tested)
  lib/excerpt-files.ts      loadExcerpt via import.meta.glob         (Vite only)
  lib/highlight.ts          highlightLines                           (tested)
  lib/typing.ts             nextDelay, lineStarts, padTo             (pure, tested)
  lib/cv.ts                 cvMenu                                   (pure, tested)
  lib/cv-files.ts           cvFiles via import.meta.glob             (Vite only)
  lib/pages.ts              crumbFor, pathFor, shortPathFor, bracketLinks (pure, tested)
  components/
    Icon.astro  Line.astro  TreeNodes.astro  Sidebar.astro  Winbar.astro  CvButton.astro
    Statusline.astro  Cmdline.astro  Readme.astro  Pane.astro  Hero.astro
    Cycler.astro  Showcase.astro  Shell.astro  HelpOverlay.astro
  layouts/Nvim.astro        the one layout; numbers the slot's lines at build time
  pages/index.astro  404.astro  projects/[...slug].astro  work/[...slug].astro  elsewhere/[...slug].astro
  scripts/nvim.ts           keyboard island
  scripts/cycler.ts         <code-cycler> custom element
e2e/landing.spec.ts  keys.spec.ts  phone.spec.ts  cycler.spec.ts  pages.spec.ts
README.md                   how to add content, run, build, deploy
```

Line model: every direct child of `#buffer` is `<div class="ln"><span class="nr"></span><div class="tx">…</div></div>`. `Nvim.astro` renders the slot to a string and `numberLines()` fills the empty `.nr` spans with relative numbers for cursor = line 1 and marks the first line `cur`. Components never compute numbers.

---

### Task 1: Scaffold, toolchain, CI

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.nvmrc`, `vitest.config.ts`, `playwright.config.ts`, `src/pages/index.astro`, `src/env.d.ts`, `e2e/smoke.spec.ts`, `.github/workflows/ci.yml`
- Modify: `.gitignore`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `preview`, `check`, `test`, `test:e2e`; Playwright projects `desktop` (1440×900) and `phone` (iPhone 13, `isMobile: true`); preview server on port 4321.

- [ ] **Step 1: Write package.json**

```json
{
  "name": "portfolio-v2",
  "type": "module",
  "version": "2.0.0",
  "private": true,
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "vitest run --passWithNoTests",
    "test:e2e": "playwright test",
    "astro": "astro"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install astro@^7.3.1 @astrojs/sitemap@^3.7.4 shiki@^4.4.3 hast-util-to-html@^9.0.5 @fontsource-variable/jetbrains-mono@^5.3.0
npm install -D @astrojs/check@^0.9.10 typescript@^6.0.3 vitest@^5.0.0 @playwright/test@^1.63.0 @types/hast
npx playwright install chromium
```

- [ ] **Step 3: Write config files**

`astro.config.mjs`:
```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://oleksandrp.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap()],
  markdown: { shikiConfig: { theme: 'catppuccin-mocha' } },
});
```

`tsconfig.json`:
```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`.nvmrc`:
```
24
```

`src/env.d.ts`:
```ts
/// <reference path="../.astro/types.d.ts" />
```

`vitest.config.ts`:
```ts
/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: { include: ['src/**/*.test.ts'] },
});
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  webServer: {
    command: 'npm run build && npm run preview -- --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  use: { baseURL: 'http://localhost:4321' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'phone', use: { ...devices['iPhone 13'] } },
  ],
});
```

`src/pages/index.astro` (placeholder, replaced in Task 4):
```astro
---
---
<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Oleksandr Popov</title></head>
  <body><h1>Oleksandr Popov</h1></body>
</html>
```

`.github/workflows/ci.yml`:
```yaml
name: ci
on:
  push:
    branches: [main]
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run check
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
        env:
          CI: 'true'
```

Append to `.gitignore`:
```
.astro/
```
(`node_modules/`, `dist/`, `test-results/`, `playwright-report/` are already listed.)

- [ ] **Step 4: Write the smoke e2e test**

`e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('landing responds with the site title', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/Oleksandr Popov/);
});
```

- [ ] **Step 5: Run every script and verify**

```bash
npm run check      # expected: 0 errors
npm test           # expected: "No test files found" and exit 0
npm run build      # expected: "1 page(s) built", dist/index.html exists
npm run test:e2e   # expected: 2 passed (desktop + phone)
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Astro 7 project with vitest, playwright and CI"
```

---

### Task 2: Content collections, excerpt parsing, highlighting

**Files:**
- Create: `src/content.config.ts`, `src/lib/text.ts`, `src/lib/text.test.ts`, `src/lib/excerpts.ts`, `src/lib/excerpts.test.ts`, `src/lib/excerpt-files.ts`, `src/lib/highlight.ts`, `src/lib/highlight.test.ts`, `src/excerpts/redis-go/unmarshal.go`, `src/content/projects/from_scratch/redis.md`, `src/content/projects/from_scratch/redis.png`, `src/content/work/lokalise.md`, `src/content/elsewhere/advent_of_code.md`, `public/videos/aoc2024.mp4`

**Interfaces:**
- Produces:
  - collections `projects`, `work`, `elsewhere` with the schemas below; `CollectionEntry<'projects'>['data']` has `title, lang, order, repo?, live?, tags, hero?, excerpts`.
  - `paragraphs(body: string | undefined): string[]`
  - `parseExcerpt(file: string, raw: string): Excerpt` where `Excerpt = { file, repo, path, from, to, permalink, lang, code }`; `langFor(file): string`; `excerptLabel(e): string` → `redis-go/app/internal/resp/unmarshal.go:7-25`
  - `loadExcerpt(file: string): Excerpt` (reads `src/excerpts/<file>`)
  - `highlightLines(code: string, lang: string): Promise<string[]>` (one HTML string per line, each `<span class="line">…</span>`); `THEME = 'catppuccin-mocha'`

- [ ] **Step 1: Write the failing tests for text and excerpts**

`src/lib/text.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { paragraphs } from './text';

describe('paragraphs', () => {
  it('splits on blank lines and joins soft wraps', () => {
    expect(paragraphs('one\ntwo\n\nthree')).toEqual(['one two', 'three']);
  });
  it('drops empty paragraphs and trims', () => {
    expect(paragraphs('\n\n  a  \n\n\n b \n')).toEqual(['a', 'b']);
  });
  it('handles undefined', () => {
    expect(paragraphs(undefined)).toEqual([]);
  });
});
```

`src/lib/excerpts.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { parseExcerpt, langFor, excerptLabel } from './excerpts';

const GO = `// https://github.com/alex-popov-tech/redis-go/blob/df77b784abd992c8fa52e2ae9c27c0c3b119f74a/app/internal/resp/unmarshal.go#L7-L25
func Parse(r Reader) (RESPValue, error) {
\tb, err := r.ReadByte()
}
`;

describe('parseExcerpt', () => {
  it('parses a Go permalink header', () => {
    const e = parseExcerpt('redis-go/unmarshal.go', GO);
    expect(e.repo).toBe('alex-popov-tech/redis-go');
    expect(e.path).toBe('app/internal/resp/unmarshal.go');
    expect(e.from).toBe(7);
    expect(e.to).toBe(25);
    expect(e.permalink).toMatch(/^https:\/\/github\.com\/.*#L7-L25$/);
    expect(e.lang).toBe('go');
    expect(e.code).toBe('func Parse(r Reader) (RESPValue, error) {\n\tb, err := r.ReadByte()\n}');
  });
  it('parses a Lua header', () => {
    const e = parseExcerpt('store.nvim/sort.lua', '-- https://github.com/alex-popov-tech/store.nvim/blob/c52e4fff19f3c59589328ffd352d7502fa8b580d/lua/store/sort.lua#L3-L27\nlocal M = {}');
    expect(e.lang).toBe('lua');
    expect(e.path).toBe('lua/store/sort.lua');
    expect(e.code).toBe('local M = {}');
  });
  it('throws without a permalink header', () => {
    expect(() => parseExcerpt('x/y.go', 'func main() {}')).toThrow(/permalink/);
  });
  it('maps extensions to shiki languages', () => {
    expect(langFor('a/b.ts')).toBe('typescript');
    expect(langFor('a/b.sh')).toBe('bash');
    expect(() => langFor('a/b.xyz')).toThrow();
  });
  it('builds a label', () => {
    const e = parseExcerpt('redis-go/unmarshal.go', GO);
    expect(excerptLabel(e)).toBe('redis-go/app/internal/resp/unmarshal.go:7-25');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npm test`
Expected: FAIL, modules `./text` and `./excerpts` not found.

- [ ] **Step 3: Implement text.ts and excerpts.ts**

`src/lib/text.ts`:
```ts
/** Split a markdown body into paragraphs: blank lines separate, soft wraps join with a space. */
export function paragraphs(body: string | undefined): string[] {
  if (!body) return [];
  return body
    .split(/\n[ \t]*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter((p) => p.length > 0);
}
```

`src/lib/excerpts.ts`:
```ts
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
```

`src/lib/excerpt-files.ts`:
```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: 8 passed.

- [ ] **Step 5: Write the failing highlight test**

`src/lib/highlight.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { highlightLines } from './highlight';

describe('highlightLines', () => {
  it('returns one html string per line, keeping empty lines', async () => {
    const lines = await highlightLines('func a() {\n\n}', 'go');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('class="line"');
    expect(lines[0]).toContain('func');
    expect(lines[1]).toBe('<span class="line"></span>');
  });
});
```

- [ ] **Step 6: Run it to verify it fails**

Run: `npm test -- highlight`
Expected: FAIL, module `./highlight` not found.

- [ ] **Step 7: Implement highlight.ts**

`src/lib/highlight.ts`:
```ts
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
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test`
Expected: 9 passed.

- [ ] **Step 9: Write the collections config**

`src/content.config.ts`:
```ts
import { defineCollection, z, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';

export const LANGS = ['go', 'lua', 'ts', 'js', 'sh', 'md'] as const;
const lang = z.enum(LANGS);

const link = {
  /** GitHub path after github.com/, e.g. 'alex-popov-tech/redis-go' */
  repo: z.string().regex(/^[^/\s]+\/[^\s]+$/).optional(),
  live: z.string().url().optional(),
};

const projectSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    lang,
    order: z.number().int(),
    ...link,
    tags: z.array(z.string()).default([]),
    hero: z
      .discriminatedUnion('type', [
        z.object({ type: z.literal('image'), src: image() }),
        z.object({ type: z.literal('video'), src: z.string().startsWith('/') }),
      ])
      .optional(),
    /** files under src/excerpts, e.g. 'redis-go/unmarshal.go' */
    excerpts: z.array(z.string()).default([]),
  });

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: projectSchema,
});

const elsewhere = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/elsewhere' }),
  schema: projectSchema,
});

const work = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    role: z.string(),
    from: z.string(),
    to: z.string(),
    lang: lang.default('md'),
    order: z.number().int(),
    tags: z.array(z.string()).default([]),
    shipped: z
      .array(
        z.object({
          title: z.string(),
          ...link,
          tags: z.array(z.string()).default([]),
          description: z.string(),
        }),
      )
      .default([]),
  }),
});

export const collections = { projects, elsewhere, work };
```

- [ ] **Step 10: Add the first real entries and the first excerpt**

```bash
mkdir -p src/content/projects/from_scratch src/content/work src/content/elsewhere src/excerpts/redis-go public/videos
cp /Users/alex/me/pet/portfolio/src/images/redis-go.png src/content/projects/from_scratch/redis.png
cp /Users/alex/me/pet/portfolio/public/videos/aoc2024.mp4 public/videos/aoc2024.mp4
```

`src/excerpts/redis-go/unmarshal.go` (tabs, exactly as in the repo):
```go
// https://github.com/alex-popov-tech/redis-go/blob/df77b784abd992c8fa52e2ae9c27c0c3b119f74a/app/internal/resp/unmarshal.go#L7-L25
func Parse(r Reader) (RESPValue, error) {
	b, err := r.ReadByte()
	if err != nil {
		return nil, err
	}
	switch b {
	case '*':
		return ParseArray(r)
	case '$':
		return ParseBulkString(r)
	case ':':
		return ParseInteger(r)
	case '+':
		return ParseSimpleString(r)

	default:
		return nil, fmt.Errorf("unexpected input %q", b)
	}
}
```

`src/content/projects/from_scratch/redis.md`:
```md
---
title: A Redis-compatible server, from scratch, in Go
lang: go
order: 1
repo: alex-popov-tech/redis-go
tags: [Go, RESP, TCP, Streams, Transactions, Replication, CodeCrafters]
hero:
  type: image
  src: ./redis.png
excerpts:
  - redis-go/unmarshal.go
---
A Redis-compatible server built from scratch in Go, speaking the real RESP wire protocol over TCP — you can talk to it with redis-cli. Concurrent clients are handled with a goroutine-per-connection model over a thread-safe keyspace.

Implements strings with expiry, streams (XADD/XRANGE/XREAD), transactions (MULTI/EXEC/DISCARD), optimistic locking (WATCH), and full leader-follower replication with command propagation and WAIT. Built through the CodeCrafters challenge — base stages plus the Streams, Transactions, Optimistic Locking, and Replication extensions.
```

`src/content/work/lokalise.md`:
```md
---
title: "[ROLE]"
role: "[ROLE]"
from: "[YYYY]"
to: "[YYYY]"
order: 1
tags: ["[THE STACK YOU USED THERE]"]
---
[ONE LINE ON WHAT YOU OWNED THERE, IN YOUR OWN WORDS]

[A SECOND LINE: THE THING YOU SHIPPED, OR THE PROBLEM YOU SOLVED]
```

`src/content/elsewhere/advent_of_code.md`:
```md
---
title: Advent of Code 2024
lang: go
order: 1
repo: alex-popov-tech/advent_of_code_2024_golang
tags: [Go, GitHub]
hero:
  type: video
  src: /videos/aoc2024.mp4
---
Advent of Code is an Advent calendar of small programming puzzles for a variety of skill levels that can be solved in any programming language you like. People use them as interview prep, company training, university coursework, practice problems, a speed contest, or to challenge each other.

You don't need a computer science background to participate - just a little programming knowledge and some problem solving skills will get you pretty far. Nor do you need a fancy computer; every problem has a solution that completes in at most 15 seconds on ten-year-old hardware.
```

- [ ] **Step 11: Verify the collections validate**

```bash
npx astro sync    # expected: "Types generated", no schema errors
npm run check     # expected: 0 errors
npm run build     # expected: builds; collections are validated during the build
```

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: content collections, excerpt parsing and shiki line highlighting"
```

---

### Task 3: Pure models: tree, numbers, cv, page helpers

**Files:**
- Create: `src/lib/tree.ts`, `src/lib/tree.test.ts`, `src/lib/numbers.ts`, `src/lib/numbers.test.ts`, `src/lib/cv.ts`, `src/lib/cv.test.ts`, `src/lib/pages.ts`, `src/lib/pages.test.ts`

**Interfaces:**
- Produces:
  - `type Lang = 'go'|'lua'|'ts'|'js'|'sh'|'md'`; `type Section = 'work'|'projects'|'elsewhere'`
  - `fileName(id: string, lang: Lang): string` → `'from_scratch/redis','go'` → `'redis.go'`
  - `buildTree(entries: TreeEntry[], opts?: { folded?: string[]; cv?: CvFile[] }): TreeNode[]`
  - `TreeNode = FileNode | FolderNode`; `FileNode = { kind:'file'; name; href; icon: Lang|'pdf'|'readme'; depth; download?: boolean }`; `FolderNode = { kind:'folder'; name; path; depth; count; folded; children }`
  - `countFiles(nodes: TreeNode[]): number`
  - `gutter(cursor: number, total: number): string[]`; `numberLines(html: string): string`
  - `cvMenu(manifest: Record<string,string>, existing: string[]): CvMenu` where `CvMenu = {kind:'none'} | {kind:'single'; item: CvItem} | {kind:'menu'; items: CvItem[]}` and `CvItem = { name; label; href }`
  - `crumbFor(section, id, lang)`, `pathFor(section, id, lang)`, `shortPathFor(section, id, lang)`, `bracketLinks({repo?, live?})`

- [ ] **Step 1: Write the failing tree tests**

`src/lib/tree.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { buildTree, countFiles, fileName, type TreeEntry, type FolderNode } from './tree';

const entries: TreeEntry[] = [
  { section: 'projects', id: 'store', lang: 'lua', order: 1 },
  { section: 'projects', id: 'from_scratch/git', lang: 'go', order: 2 },
  { section: 'projects', id: 'from_scratch/redis', lang: 'go', order: 1 },
  { section: 'elsewhere', id: 'advent_of_code', lang: 'go', order: 1 },
  { section: 'work', id: 'lokalise', lang: 'md', order: 1 },
];

const folder = (nodes: ReturnType<typeof buildTree>, name: string) =>
  nodes.find((n) => n.kind === 'folder' && n.name === name) as FolderNode;

describe('fileName', () => {
  it('appends the extension for the language', () => {
    expect(fileName('from_scratch/redis', 'go')).toBe('redis.go');
    expect(fileName('store', 'lua')).toBe('store.lua');
  });
});

describe('buildTree', () => {
  it('orders sections work, projects, elsewhere and ends with README', () => {
    const tree = buildTree(entries);
    expect(tree.map((n) => n.name)).toEqual(['work', 'projects', 'elsewhere', 'README.md']);
    expect(tree.at(-1)).toMatchObject({ kind: 'file', href: '/', icon: 'readme', depth: 0 });
  });
  it('puts subfolders before files and sorts files by order', () => {
    const projects = folder(buildTree(entries), 'projects');
    expect(projects.children.map((c) => c.name)).toEqual(['from_scratch', 'store.lua']);
    const fs = projects.children[0] as FolderNode;
    expect(fs.children.map((c) => c.name)).toEqual(['redis.go', 'git.go']);
    expect(fs.children[0]).toMatchObject({ href: '/projects/from_scratch/redis', icon: 'go', depth: 2 });
    expect(fs.path).toBe('projects/from_scratch');
    expect(fs.depth).toBe(1);
  });
  it('counts files recursively', () => {
    const projects = folder(buildTree(entries), 'projects');
    expect(projects.count).toBe(3);
    expect((projects.children[0] as FolderNode).count).toBe(2);
  });
  it('folds the folders named in options', () => {
    const tree = buildTree(entries, { folded: ['elsewhere'] });
    expect(folder(tree, 'elsewhere').folded).toBe(true);
    expect(folder(tree, 'projects').folded).toBe(false);
  });
  it('adds a cv folder before README only when files exist', () => {
    expect(buildTree(entries).some((n) => n.name === 'cv')).toBe(false);
    const tree = buildTree(entries, { cv: [{ name: 'golang.pdf', href: '/cv/golang.pdf' }] });
    expect(tree.map((n) => n.name)).toEqual(['work', 'projects', 'elsewhere', 'cv', 'README.md']);
    expect(folder(tree, 'cv').children[0]).toMatchObject({ kind: 'file', name: 'golang.pdf', icon: 'pdf', download: true, depth: 1 });
  });
  it('omits empty sections', () => {
    const tree = buildTree(entries.filter((e) => e.section !== 'work'));
    expect(tree.map((n) => n.name)).toEqual(['projects', 'elsewhere', 'README.md']);
  });
});

describe('countFiles', () => {
  it('counts every file including README', () => {
    expect(countFiles(buildTree(entries))).toBe(6);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- tree`
Expected: FAIL, module `./tree` not found.

- [ ] **Step 3: Implement tree.ts**

`src/lib/tree.ts`:
```ts
export type Lang = 'go' | 'lua' | 'ts' | 'js' | 'sh' | 'md';
export type Section = 'work' | 'projects' | 'elsewhere';

export const EXT: Record<Lang, string> = { go: '.go', lua: '.lua', ts: '.ts', js: '.js', sh: '.sh', md: '.md' };
export const SECTION_ORDER: Section[] = ['work', 'projects', 'elsewhere'];

export interface TreeEntry {
  section: Section;
  /** collection entry id, e.g. 'from_scratch/redis' */
  id: string;
  lang: Lang;
  order: number;
}

export interface CvFile {
  name: string;
  href: string;
}

export interface TreeOptions {
  /** folder paths that start folded, e.g. ['elsewhere'] */
  folded?: string[];
  cv?: CvFile[];
}

export interface FileNode {
  kind: 'file';
  name: string;
  href: string;
  icon: Lang | 'pdf' | 'readme';
  depth: number;
  download?: boolean;
}

export interface FolderNode {
  kind: 'folder';
  name: string;
  /** 'projects/from_scratch' */
  path: string;
  depth: number;
  count: number;
  folded: boolean;
  children: TreeNode[];
}

export type TreeNode = FileNode | FolderNode;

export function fileName(id: string, lang: Lang): string {
  return id.slice(id.lastIndexOf('/') + 1) + EXT[lang];
}

export function buildTree(entries: TreeEntry[], opts: TreeOptions = {}): TreeNode[] {
  const folded = new Set(opts.folded ?? []);
  const roots: TreeNode[] = [];
  for (const section of SECTION_ORDER) {
    const own = entries.filter((e) => e.section === section);
    if (own.length === 0) continue;
    roots.push(folder(section, section, 0, section, '', own, folded));
  }
  if (opts.cv && opts.cv.length > 0) {
    roots.push({
      kind: 'folder',
      name: 'cv',
      path: 'cv',
      depth: 0,
      count: opts.cv.length,
      folded: folded.has('cv'),
      children: opts.cv.map((f) => ({ kind: 'file', name: f.name, href: f.href, icon: 'pdf', depth: 1, download: true })),
    });
  }
  roots.push({ kind: 'file', name: 'README.md', href: '/', icon: 'readme', depth: 0 });
  return roots;
}

function folder(
  name: string,
  path: string,
  depth: number,
  section: Section,
  prefix: string,
  entries: TreeEntry[],
  folded: Set<string>,
): FolderNode {
  const subfolders = new Map<string, TreeEntry[]>();
  const files: TreeEntry[] = [];
  for (const e of entries) {
    const rel = e.id.slice(prefix.length);
    const slash = rel.indexOf('/');
    if (slash === -1) {
      files.push(e);
    } else {
      const sub = rel.slice(0, slash);
      subfolders.set(sub, [...(subfolders.get(sub) ?? []), e]);
    }
  }
  const children: TreeNode[] = [];
  for (const sub of [...subfolders.keys()].sort()) {
    children.push(folder(sub, `${path}/${sub}`, depth + 1, section, `${prefix}${sub}/`, subfolders.get(sub)!, folded));
  }
  files.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  for (const e of files) {
    children.push({ kind: 'file', name: fileName(e.id, e.lang), href: `/${section}/${e.id}`, icon: e.lang, depth: depth + 1 });
  }
  return { kind: 'folder', name, path, depth, count: entries.length, folded: folded.has(path), children };
}

export function countFiles(nodes: TreeNode[]): number {
  let n = 0;
  for (const node of nodes) n += node.kind === 'file' ? 1 : countFiles(node.children);
  return n;
}
```

- [ ] **Step 4: Run tree tests**

Run: `npm test -- tree`
Expected: 8 passed.

- [ ] **Step 5: Write failing numbers, cv and pages tests**

`src/lib/numbers.test.ts`:
```ts
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
```

`src/lib/cv.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { cvMenu } from './cv';

const manifest = { 'golang.pdf': 'Golang developer', 'qa.pdf': 'QA automation' };

describe('cvMenu', () => {
  it('is none without files', () => {
    expect(cvMenu(manifest, [])).toEqual({ kind: 'none' });
  });
  it('is single with one file present', () => {
    expect(cvMenu(manifest, ['golang.pdf'])).toEqual({
      kind: 'single',
      item: { name: 'golang.pdf', label: 'Golang developer', href: '/cv/golang.pdf' },
    });
  });
  it('is a menu with several files, in manifest order', () => {
    const m = cvMenu(manifest, ['qa.pdf', 'golang.pdf']);
    expect(m.kind).toBe('menu');
    if (m.kind === 'menu') expect(m.items.map((i) => i.name)).toEqual(['golang.pdf', 'qa.pdf']);
  });
  it('ignores files not in the manifest', () => {
    expect(cvMenu(manifest, ['other.pdf'])).toEqual({ kind: 'none' });
  });
});
```

`src/lib/pages.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { crumbFor, pathFor, shortPathFor, bracketLinks } from './pages';

describe('page helpers', () => {
  it('builds the breadcrumb from section, folders and file name', () => {
    expect(crumbFor('projects', 'from_scratch/redis', 'go')).toBe('projects > from_scratch > redis.go');
    expect(crumbFor('work', 'lokalise', 'md')).toBe('work > lokalise.md');
  });
  it('builds the statusline path', () => {
    expect(pathFor('projects', 'from_scratch/redis', 'go')).toBe('~/oleksandr/projects/from_scratch/redis.go');
    expect(pathFor('projects', 'store', 'lua')).toBe('~/oleksandr/projects/store.lua');
  });
  it('shortens to the last folder and file', () => {
    expect(shortPathFor('projects', 'from_scratch/redis', 'go')).toBe('.../from_scratch/redis.go');
    expect(shortPathFor('projects', 'store', 'lua')).toBe('.../projects/store.lua');
  });
  it('builds bracket links', () => {
    expect(bracketLinks({ repo: 'alex-popov-tech/redis-go' })).toEqual([{ label: '[github]', href: 'https://github.com/alex-popov-tech/redis-go' }]);
    expect(bracketLinks({ live: 'https://x.y' })).toEqual([{ label: '[live]', href: 'https://x.y' }]);
    expect(bracketLinks({})).toEqual([]);
  });
});
```

- [ ] **Step 6: Run to verify failure**

Run: `npm test`
Expected: FAIL for numbers, cv and pages (modules not found); tree, text, excerpts, highlight still pass.

- [ ] **Step 7: Implement numbers.ts, cv.ts, pages.ts**

`src/lib/numbers.ts`:
```ts
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
```

`src/lib/cv.ts`:
```ts
export interface CvItem {
  name: string;
  label: string;
  href: string;
}

export type CvMenu = { kind: 'none' } | { kind: 'single'; item: CvItem } | { kind: 'menu'; items: CvItem[] };

/** Intersect the manifest (filename -> label) with the PDFs actually present in public/cv. */
export function cvMenu(manifest: Record<string, string>, existing: string[]): CvMenu {
  const items: CvItem[] = Object.entries(manifest)
    .filter(([name]) => existing.includes(name))
    .map(([name, label]) => ({ name, label, href: `/cv/${name}` }));
  if (items.length === 0) return { kind: 'none' };
  if (items.length === 1) return { kind: 'single', item: items[0] };
  return { kind: 'menu', items };
}
```

`src/lib/pages.ts`:
```ts
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
```

- [ ] **Step 8: Run all tests**

Run: `npm test`
Expected: all pass (about 25 tests).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: pure models for the file tree, line numbers, cv menu and page paths"
```

---

### Task 4: Layout shell, tree, README landing, CV button

**Files:**
- Create: `src/styles/theme.css`, `src/styles/global.css`, `src/site.ts`, `src/readme.ts`, `src/cv.json`, `public/cv/.gitkeep`, `src/lib/cv-files.ts`, `src/components/Icon.astro`, `src/components/Line.astro`, `src/components/TreeNodes.astro`, `src/components/Sidebar.astro`, `src/components/Winbar.astro`, `src/components/CvButton.astro`, `src/components/Statusline.astro`, `src/components/Cmdline.astro`, `src/components/Readme.astro`, `src/layouts/Nvim.astro`, `e2e/landing.spec.ts`
- Modify: `src/pages/index.astro` (replace the placeholder)
- Delete: `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: `buildTree`, `countFiles`, `numberLines`, `cvMenu`, `pathFor`.
- Produces:
  - `Nvim.astro` props `{ title: string; description: string; crumb: string; short: string; path: string; shortPath: string }`. Renders `#app > #sidebar, #main > (.winbar, main#buffer), #statusline, #cmdline`. Slot content must be `.ln` rows.
  - `Line.astro` props `{ cls?: string }`, renders `<div class="ln"><span class="nr"></span><div class="tx {cls}"><slot/></div></div>`.
  - `Icon.astro` prop `name` in `folder | folder-open | file | branch | go | lua | ts | js | sh | md | readme | pdf | arrow`.
  - `SITE`, `FOLDED` from `src/site.ts`; `cvFiles(): CvFile[]` from `src/lib/cv-files.ts`.
  - DOM contract used by later tasks: tree rows are `#tree .row[data-row]`; folder rows carry `data-folder="<path>"`, `data-depth`, optional `data-folded`; their children live in the next sibling `.children[data-children="<path>"]` (hidden when folded); file rows carry an `<a class="name">`; the current file's row has class `sel`. Sidebar is `nav#sidebar[popover="manual"]` with `transition:persist`. Buffer is `main#buffer`.

- [ ] **Step 1: Theme and global styles**

`src/styles/theme.css`:
```css
/* Catppuccin Mocha, copied from CATPPUCCIN in design/gen_v4.py */
:root {
  --bg: #1e1e2e;
  --bar: #181825;
  --sel: #313244;
  --cursor: #2a2b3c;
  --fg: #cdd6f4;
  --muted: #a6adc8;
  --dim: #6c7086;
  --faint: #45475a;
  --guide: #45475a;
  --accent: #f9e2af;
  --blue: #89b4fa;
  --mauve: #cba6f7;
  --green: #a6e3a1;
  --peach: #fab387;
  --teal: #94e2d5;
}

/* Gruvbox, the other palette from design/gen_v4.py. To retheme, swap this block in
   and set markdown.shikiConfig.theme and THEME in src/lib/highlight.ts to 'gruvbox-dark-medium'.
:root {
  --bg: #282828; --bar: #1d2021; --sel: #3c3836; --cursor: #32302f;
  --fg: #ebdbb2; --muted: #bdae93; --dim: #928374; --faint: #504945; --guide: #504945;
  --accent: #fabd2f; --blue: #83a598; --mauve: #d3869b; --green: #b8bb26;
  --peach: #fe8019; --teal: #8ec07c;
}
*/
```

`src/styles/global.css`:
```css
@import '@fontsource-variable/jetbrains-mono';
@import './theme.css';

:root {
  --font: 'JetBrains Mono Variable', ui-monospace, SFMono-Regular, Menlo, monospace;
  --fs: 15px;
  --lh: 22px;
  --side: 38ch;
  --gutter: 4ch;
  color-scheme: dark;
}
@media (max-width: 1199px) {
  :root { --side: 30ch; }
}

* { box-sizing: border-box; }
html, body { margin: 0; height: 100%; background: var(--bg); color: var(--fg); }
body {
  font-family: var(--font);
  font-size: var(--fs);
  line-height: var(--lh);
  font-variant-ligatures: none;
  tab-size: 4;
  -webkit-font-smoothing: antialiased;
}
a { color: var(--blue); text-decoration: none; }
a:hover { color: var(--accent); text-decoration: underline; }
button.ghost { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
[hidden] { display: none !important; }

/* ---- app grid ---- */
#app {
  display: grid;
  height: 100dvh;
  grid-template-columns: var(--side) minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) var(--lh) var(--lh);
}
#sidebar[popover] {
  /* override the UA popover styles so the sidebar is a normal grid item on desktop */
  display: flex;
  flex-direction: column;
  position: static;
  inset: auto;
  width: auto;
  height: auto;
  margin: 0;
  padding: 0;
  border: 0;
  border-right: 1px solid var(--faint);
  overflow: visible;
  color: inherit;
  background: var(--bar);
  grid-column: 1;
  grid-row: 1;
  min-height: 0;
}
#main { grid-column: 2; grid-row: 1; display: flex; flex-direction: column; min-height: 0; min-width: 0; }
#statusline { grid-column: 1 / 3; grid-row: 2; }
#cmdline { grid-column: 1 / 3; grid-row: 3; }
.phone-only { display: none; }
.drawer-status { display: none; }

/* ---- winbars ---- */
.winbar {
  height: var(--lh);
  flex: none;
  display: flex;
  align-items: center;
  gap: 1ch;
  padding: 0 1ch;
  color: var(--dim);
  white-space: nowrap;
  overflow: hidden;
}
#sidebar .winbar { background: var(--bar); }
#main .winbar { background: var(--bg); }
.winbar .crumb { overflow: hidden; text-overflow: ellipsis; }
.winbar .crumb .short { display: none; }
.winbar .spacer { flex: 1; }
.cta {
  background: var(--accent);
  color: var(--bg);
  padding: 0 1ch;
  font-weight: 700;
  cursor: pointer;
  list-style: none;
}
.cta:hover { color: var(--bg); text-decoration: none; filter: brightness(1.1); }
.cta .short { display: none; }
details.cv { position: relative; }
details.cv summary::-webkit-details-marker { display: none; }
details.cv ul {
  position: absolute;
  right: 0;
  top: var(--lh);
  margin: 0;
  padding: 0;
  list-style: none;
  background: var(--bar);
  border: 1px solid var(--faint);
  min-width: 24ch;
  z-index: 5;
}
details.cv li a { display: block; padding: 0 1ch; color: var(--fg); }
details.cv li a:hover { background: var(--sel); text-decoration: none; }

/* ---- buffer lines ---- */
#buffer { flex: 1; overflow-y: auto; overflow-x: hidden; padding: var(--lh) 0; outline: none; }
.ln { display: flex; min-height: var(--lh); }
.ln .nr {
  flex: none;
  width: var(--gutter);
  padding-right: 1ch;
  text-align: right;
  color: var(--faint);
  user-select: none;
}
.ln.cur { background: var(--cursor); }
.ln.cur .nr { color: var(--accent); text-align: left; }
.ln .tx { flex: 1; min-width: 0; padding-right: 2ch; color: var(--muted); overflow-wrap: anywhere; }
.ln .tx.h1 { color: var(--peach); }
.ln .tx.h2 { color: var(--teal); }
.ln .tx.title { color: var(--fg); display: flex; flex-wrap: wrap; column-gap: 2ch; }
.ln .tx.title .links { margin-left: auto; white-space: nowrap; display: inline-flex; gap: 2ch; }
.ln .tx.tags { color: var(--dim); display: flex; flex-wrap: wrap; column-gap: 3ch; }
.ln .tx.label { color: var(--teal); }
.ln .tx.sub { color: var(--dim); padding-left: 2ch; }
.ln .tx.faint { color: var(--faint); }
.ln .tx.err { color: var(--peach); }
.ln .tx.punct, .ln .tx .punct { color: var(--dim); }
.ln .tx .dim { color: var(--dim); }
.ln .tx .path { color: var(--green); }
.ln .tx.media img, .ln .tx.media video { display: block; max-width: 100%; height: auto; border: 1px solid var(--faint); }

/* code lines never wrap; the block scrolls sideways, the gutter stays put */
.code { overflow-x: auto; }
.code .ln .tx { white-space: pre; overflow-wrap: normal; color: var(--fg); }
.code .ln .nr { position: sticky; left: 0; background: var(--bg); }
.code .ln.cur .nr { background: var(--cursor); }

/* ---- tree ---- */
.tree { flex: 1; overflow-y: auto; overflow-x: hidden; padding: var(--lh) 0; }
.row { display: flex; align-items: center; height: var(--lh); padding: 0 1ch; white-space: nowrap; color: var(--fg); }
.row .guide { color: var(--guide); white-space: pre; }
.row .chev { color: var(--dim); width: 2ch; flex: none; }
.row .icon { width: 2ch; flex: none; display: inline-flex; align-items: center; }
.row .name { color: inherit; overflow: hidden; text-overflow: ellipsis; }
.row.file .name:hover { color: var(--accent); text-decoration: none; }
.row.folder { color: var(--accent); cursor: pointer; }
.row.folder[data-depth="1"] { color: var(--muted); }
.row .count { margin-left: auto; color: var(--dim); }
.row.sel { background: var(--sel); }
.row.sel .name { color: var(--blue); }
body[data-pane="tree"] .row.tcur { outline: 1px solid var(--dim); outline-offset: -1px; }

/* ---- statusline and command line ---- */
#statusline { display: flex; align-items: center; background: var(--bar); white-space: nowrap; overflow: hidden; }
#statusline .mode { background: var(--accent); color: var(--bg); padding: 0 1ch; font-weight: 700; }
#statusline .arrow { display: inline-flex; }
#statusline .path { color: var(--fg); margin-left: 1ch; display: inline-flex; align-items: center; gap: 1ch; overflow: hidden; }
#statusline .path .short { display: none; }
#statusline .branch { color: var(--muted); margin-left: 2ch; display: inline-flex; align-items: center; gap: 1ch; }
#statusline .right { margin-left: auto; color: var(--dim); padding-right: 1ch; }
#cmdline { display: flex; align-items: center; background: var(--bg); color: var(--dim); padding: 0 1ch; white-space: nowrap; overflow: hidden; }
#cmdline.err { color: var(--peach); }
#cmdline input { font: inherit; color: var(--fg); background: transparent; border: 0; outline: 0; padding: 0; flex: 1; }
```

- [ ] **Step 2: Site data, README data, CV manifest**

`src/site.ts`:
```ts
export const SITE = {
  name: 'Oleksandr Popov',
  url: 'https://oleksandrp.com',
  description: 'A neovimmer and a web dev who likes to re-invent the wheel. Go, TypeScript and Lua, built from the wire up.',
  github: 'https://github.com/alex-popov-tech',
  root: '~/oleksandr',
};

/** folder paths that start folded in the tree */
export const FOLDED = ['elsewhere'];
```

`src/readme.ts` (copy from the README block in `design/gen_v4.py`, minus the `languages.go` line; the showcase slot is added in Task 7):
```ts
export type ReadmeLine =
  | { kind: 'h1'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'sub'; text: string }
  | { kind: 'link'; text: string; href: string }
  | { kind: 'blank' }
  | { kind: 'showcase' };

export const README: ReadmeLine[] = [
  { kind: 'h1', text: 'Oleksandr Popov' },
  { kind: 'blank' },
  { kind: 'p', text: 'A neovimmer and a web dev who likes to re-invent the wheel.' },
  { kind: 'blank' },
  { kind: 'p', text: 'Currently writing Go for things that already exist: Redis, DNS, Git, BitTorrent and HTTP, each built from the wire up, with no library doing the interesting part.' },
  { kind: 'blank' },
  { kind: 'p', text: 'Before that, TypeScript on the web and inside test frameworks. Lua in between, for Neovim plugins and a config I keep tweaking.' },
  { kind: 'blank' },
  { kind: 'h2', text: 'Start here' },
  { kind: 'blank' },
  { kind: 'link', text: 'redis.go', href: '/projects/from_scratch/redis' },
  { kind: 'sub', text: 'a Redis server that redis-cli cannot tell apart' },
  { kind: 'link', text: 'git.go', href: '/projects/from_scratch/git' },
  { kind: 'sub', text: 'the object store by hand, then clone over Smart HTTP' },
  { kind: 'link', text: 'store.lua', href: '/projects/store' },
  { kind: 'sub', text: 'a plugin browser for Neovim, with live README preview' },
  { kind: 'link', text: 'acapulko.go', href: '/projects/acapulko' },
  { kind: 'sub', text: 'an outage tracker on a Raspberry Pi, still running' },
  { kind: 'blank' },
  { kind: 'h2', text: 'Languages' },
  { kind: 'blank' },
  { kind: 'p', text: 'Go, TypeScript, Lua, Gleam, JavaScript and Shell.' },
  { kind: 'blank' },
  { kind: 'h2', text: 'Find me' },
  { kind: 'blank' },
  { kind: 'link', text: 'github.com/alex-popov-tech', href: 'https://github.com/alex-popov-tech' },
  { kind: 'link', text: 'oleksandrp.com', href: 'https://oleksandrp.com' },
  { kind: 'p', text: '- [EMAIL]' },
];
```

`src/cv.json`:
```json
{}
```

`public/cv/.gitkeep`: empty file.

`src/lib/cv-files.ts`:
```ts
import manifest from '../cv.json';
import { cvMenu, type CvItem, type CvMenu } from './cv';
import type { CvFile } from './tree';

const present = Object.keys(import.meta.glob('/public/cv/*.pdf')).map((p) => p.slice(p.lastIndexOf('/') + 1));

export function cvState(): CvMenu {
  return cvMenu(manifest as Record<string, string>, present);
}

export function cvFiles(): CvFile[] {
  const m = cvState();
  const items: CvItem[] = m.kind === 'none' ? [] : m.kind === 'single' ? [m.item] : m.items;
  return items.map((i) => ({ name: i.name, href: i.href }));
}
```

- [ ] **Step 3: Icon and Line components**

`src/components/Icon.astro`:
```astro
---
interface Props { name: string }
const { name } = Astro.props;

const S = (color: string, body: string, w = 1.7) =>
  `<g fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round">${body}</g>`;

const FOLDER = '<path d="M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h3.6l1.8 2h8.1a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z"/>';
const FOLDER_OPEN = '<path d="M3.5 18.5v-11A1.5 1.5 0 0 1 5 6h3.6l1.8 2h6.1A1.5 1.5 0 0 1 18 9.5v1"/><path d="M3.5 18.5l2.6-7h15l-2.6 7z"/>';
const FILE = '<path d="M14 3H7a1.6 1.6 0 0 0-1.6 1.6v14.8A1.6 1.6 0 0 0 7 21h10a1.6 1.6 0 0 0 1.6-1.6V7.6z"/><polyline points="14,3 14,8 19,8"/>';
const BRANCH = '<circle cx="7" cy="5.5" r="2.2"/><circle cx="7" cy="18.5" r="2.2"/><circle cx="17" cy="9.5" r="2.2"/><path d="M17 11.7v1.1a3 3 0 0 1-3 3H7"/><path d="M7 7.7v8.6"/>';
const MD = '<rect x="2.6" y="6" width="18.8" height="12" rx="2"/><polyline points="6,15 6,9 9,12.5 12,9 12,15"/><polyline points="15.4,9 15.4,14"/><polyline points="13.6,12.4 15.4,14.6 17.2,12.4"/>';
const SH = '<rect x="3.2" y="5.2" width="17.6" height="13.6" rx="2.4"/><polyline points="7.2,10 9.8,12.4 7.2,14.8"/><line x1="12.4" y1="15" x2="16.6" y2="15"/>';
const GOPHER =
  '<ellipse cx="12" cy="14" rx="6.6" ry="7.4" fill="#00ADD8"/>' +
  '<path d="M6.6 6.4q1.4-2.4 3 0" stroke="#00ADD8" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
  '<path d="M14.4 6.4q1.6-2.4 3 0" stroke="#00ADD8" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
  '<circle cx="9.3" cy="11.4" r="2.7" fill="#fff"/><circle cx="14.7" cy="11.4" r="2.7" fill="#fff"/>' +
  '<circle cx="10.1" cy="11.6" r="1.2" fill="#1b1b1b"/><circle cx="15.5" cy="11.6" r="1.2" fill="#1b1b1b"/>' +
  '<ellipse cx="12" cy="16.2" rx="1.7" ry="1.2" fill="#fff"/>';

const ICONS: Record<string, string> = {
  folder: S('var(--accent)', FOLDER),
  'folder-open': S('var(--accent)', FOLDER_OPEN),
  file: S('var(--blue)', FILE),
  branch: S('var(--mauve)', BRANCH),
  go: GOPHER,
  lua: '<circle cx="10.5" cy="13.5" r="7" fill="var(--blue)"/><circle cx="18" cy="6.5" r="2.6" fill="var(--blue)"/><circle cx="7.6" cy="10.6" r="2.1" fill="var(--bg)"/>',
  ts: '<rect x="4" y="4" width="16" height="16" rx="3" fill="#3178C6"/>',
  js: '<rect x="4" y="4" width="16" height="16" rx="3" fill="#F7DF1E"/>',
  sh: S('var(--green)', SH, 1.6),
  md: S('var(--dim)', MD, 1.6),
  readme: S('var(--accent)', MD, 1.6),
  pdf: S('var(--peach)', FILE, 1.6),
  arrow: '<path d="M0 0 L9 11 L0 22 Z" fill="var(--accent)"/>',
};

const body = ICONS[name] ?? ICONS.md;
const arrow = name === 'arrow';
---
<svg viewBox={arrow ? '0 0 9 22' : '0 0 24 24'} width={arrow ? 9 : 14} height={arrow ? 22 : 14} aria-hidden="true" set:html={body} />
```

`src/components/Line.astro`:
```astro
---
interface Props { cls?: string }
const { cls = '' } = Astro.props;
---
<div class="ln"><span class="nr"></span><div class:list={['tx', cls]}><slot /></div></div>
```

- [ ] **Step 4: Tree, sidebar, winbar, CV button, statusline, command line**

`src/components/TreeNodes.astro`:
```astro
---
import Icon from './Icon.astro';
import type { TreeNode } from '../lib/tree';
interface Props { nodes: TreeNode[]; current: string }
const { nodes, current } = Astro.props;
const guide = (depth: number) => (depth === 0 ? '' : '|  '.repeat(depth - 1) + '|- ');
---
{nodes.map((node) =>
  node.kind === 'folder' ? (
    <>
      <div class="row folder" data-row data-folder={node.path} data-depth={node.depth} data-folded={node.folded ? '' : undefined}>
        <span class="guide">{guide(node.depth)}</span>
        <span class="chev">{node.folded ? '>' : 'v'}</span>
        <span class="icon"><Icon name={node.folded ? 'folder' : 'folder-open'} /></span>
        <span class="name">{node.name}</span>
        {(node.depth > 0 || node.folded) && <span class="count">{node.count}</span>}
      </div>
      <div class="children" data-children={node.path} hidden={node.folded}>
        <Astro.self nodes={node.children} current={current} />
      </div>
    </>
  ) : (
    <div class:list={['row', 'file', { sel: node.href === current }]} data-row data-depth={node.depth}>
      <span class="guide">{guide(node.depth)}</span>
      <span class="icon"><Icon name={node.icon} /></span>
      <a class="name" href={node.href} download={node.download ? '' : undefined}>{node.name}</a>
    </div>
  ),
)}
```

`src/components/Sidebar.astro`:
```astro
---
import Icon from './Icon.astro';
import TreeNodes from './TreeNodes.astro';
import { countFiles, type TreeNode } from '../lib/tree';
import { SITE } from '../site';
interface Props { tree: TreeNode[]; current: string }
const { tree, current } = Astro.props;
---
<nav id="sidebar" popover="manual" aria-label="Files" transition:persist="sidebar">
  <div class="winbar">
    <button class="ghost phone-only" popovertarget="sidebar" popovertargetaction="hide" aria-label="Close file tree">x</button>
    <Icon name="folder" />
    <span>{SITE.root}</span>
    <span class="spacer"></span>
    <span class="phone-only">tap to open</span>
  </div>
  <div class="tree" id="tree">
    <TreeNodes nodes={tree} current={current} />
  </div>
  <div class="winbar drawer-status">
    <span class="mode">NORMAL</span>
    <span>explorer</span>
    <span class="spacer"></span>
    <span>{countFiles(tree)} files</span>
  </div>
</nav>
```

`src/components/CvButton.astro`:
```astro
---
import { cvState } from '../lib/cv-files';
const menu = cvState();
---
{menu.kind === 'single' && (
  <a class="cta" href={menu.item.href} download><span class="long">Download CV pdf</span><span class="short">Download CV</span></a>
)}
{menu.kind === 'menu' && (
  <details class="cv">
    <summary class="cta"><span class="long">Download CV pdf</span><span class="short">Download CV</span></summary>
    <ul>{menu.items.map((i) => <li><a href={i.href} download>{i.label}</a></li>)}</ul>
  </details>
)}
```

`src/components/Winbar.astro`:
```astro
---
import CvButton from './CvButton.astro';
interface Props { crumb: string; short: string; isReadme: boolean }
const { crumb, short, isReadme } = Astro.props;
---
<div class="winbar">
  <button id="drawer-open" class="ghost phone-only" popovertarget="sidebar" popovertargetaction="show" aria-label="Open file tree">{isReadme ? '≡' : '<'}</button>
  <span class="crumb"><span class="long">{crumb}</span><span class="short">{short}</span></span>
  <span class="spacer"></span>
  <CvButton />
</div>
```

`src/components/Statusline.astro`:
```astro
---
import Icon from './Icon.astro';
interface Props { path: string; shortPath: string }
const { path, shortPath } = Astro.props;
---
<div id="statusline">
  <span class="mode" id="mode">NORMAL</span>
  <span class="arrow"><Icon name="arrow" /></span>
  <span class="path"><Icon name="file" /><span class="long">{path}</span><span class="short">{shortPath}</span></span>
  <span class="branch"><Icon name="branch" />main</span>
  <span class="right">utf-8</span>
</div>
```

`src/components/Cmdline.astro`:
```astro
---
const hint = 'hjkl to move · Enter to open · :q to quit';
---
<div id="cmdline" data-hint={hint}>{hint}</div>
```

- [ ] **Step 5: The layout**

`src/layouts/Nvim.astro`:
```astro
---
import '../styles/global.css';
import { ClientRouter } from 'astro:transitions';
import { getCollection } from 'astro:content';
import Sidebar from '../components/Sidebar.astro';
import Winbar from '../components/Winbar.astro';
import Statusline from '../components/Statusline.astro';
import Cmdline from '../components/Cmdline.astro';
import { buildTree, type TreeEntry } from '../lib/tree';
import { numberLines } from '../lib/numbers';
import { cvFiles } from '../lib/cv-files';
import { FOLDED, SITE } from '../site';

interface Props {
  title: string;
  description: string;
  crumb: string;
  short: string;
  path: string;
  shortPath: string;
}
const { title, description, crumb, short, path, shortPath } = Astro.props;

const [projects, work, elsewhere] = await Promise.all([
  getCollection('projects'),
  getCollection('work'),
  getCollection('elsewhere'),
]);
const entries: TreeEntry[] = [
  ...work.map((e) => ({ section: 'work' as const, id: e.id, lang: e.data.lang, order: e.data.order })),
  ...projects.map((e) => ({ section: 'projects' as const, id: e.id, lang: e.data.lang, order: e.data.order })),
  ...elsewhere.map((e) => ({ section: 'elsewhere' as const, id: e.id, lang: e.data.lang, order: e.data.order })),
];
const tree = buildTree(entries, { folded: FOLDED, cv: cvFiles() });
const current = Astro.url.pathname === '/' ? '/' : Astro.url.pathname.replace(/\/$/, '');
const fullTitle = title === SITE.name ? title : `${title} · ${SITE.name}`;
const body = numberLines(await Astro.slots.render('default'));
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{fullTitle}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={new URL(current, Astro.site)} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <ClientRouter />
  </head>
  <body data-pane="buffer">
    <div id="app">
      <Sidebar tree={tree} current={current} />
      <div id="main">
        <Winbar crumb={crumb} short={short} isReadme={current === '/'} />
        <main id="buffer" tabindex="-1" set:html={body} />
      </div>
      <Statusline path={path} shortPath={shortPath} />
      <Cmdline />
    </div>
  </body>
</html>
```

- [ ] **Step 6: README component and the landing page**

`src/components/Readme.astro`:
```astro
---
import Line from './Line.astro';
import { README } from '../readme';
---
{README.map((l) => {
  switch (l.kind) {
    case 'h1':
      return <Line cls="h1"><span class="punct"># </span>{l.text}</Line>;
    case 'h2':
      return <Line cls="h2"><span class="punct">## </span>{l.text}</Line>;
    case 'p':
      return <Line>{l.text}</Line>;
    case 'sub':
      return <Line cls="sub">{l.text}</Line>;
    case 'link':
      return (
        <Line>
          <span class="punct">- [</span><a href={l.href}>{l.text}</a><span class="punct">]</span><span class="path">({l.href})</span>
        </Line>
      );
    case 'showcase':
      return null;
    default:
      return <Line />;
  }
})}
```
(`showcase` renders nothing until Task 7 replaces that branch.)

`src/pages/index.astro`:
```astro
---
import Nvim from '../layouts/Nvim.astro';
import Readme from '../components/Readme.astro';
import { SITE } from '../site';
---
<Nvim
  title={SITE.name}
  description={SITE.description}
  crumb="README.md"
  short={SITE.root}
  path={`${SITE.root}/README.md`}
  shortPath="README.md"
>
  <Readme />
</Nvim>
```

- [ ] **Step 7: Replace the smoke test with landing tests**

Delete `e2e/smoke.spec.ts`. Create `e2e/landing.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('README opens with the cursor on line 1 and relative numbers', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Oleksandr Popov');
  const lines = page.locator('#buffer .ln');
  await expect(lines.first()).toHaveClass(/cur/);
  await expect(lines.first()).toContainText('# Oleksandr Popov');
  await expect(lines.nth(0).locator('.nr')).toHaveText('1');
  await expect(lines.nth(1).locator('.nr')).toHaveText('1');
  await expect(lines.nth(2).locator('.nr')).toHaveText('2');
  await expect(page.locator('#statusline')).toContainText('README.md');
});

test('the tree shows every section with README last', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the tree is a drawer on phones, covered in phone.spec.ts');
  await page.goto('/');
  const names = await page.locator('#tree .row[data-depth="0"] .name').allTextContents();
  expect(names).toEqual(['work', 'projects', 'elsewhere', 'README.md']);
  await expect(page.locator('#tree .row.sel .name')).toHaveText('README.md');
  await expect(page.locator('#tree [data-children="elsewhere"]')).toBeHidden();
  await expect(page.locator('#tree .row', { hasText: 'redis.go' })).toBeVisible();
});

test('start-here links point at real pages', async ({ page }) => {
  await page.goto('/');
  const href = await page.locator('#buffer a', { hasText: 'redis.go' }).getAttribute('href');
  expect(href).toBe('/projects/from_scratch/redis');
});
```

- [ ] **Step 8: Build, run, look**

```bash
npm run check                        # expected: 0 errors
npm run build                        # expected: index.html built
npm run test:e2e -- landing          # expected: 5 passed, 1 skipped (phone tree test)
```
Then `npm run preview` and open http://localhost:4321 in a browser: dark Catppuccin page, tree on the left with work/projects/elsewhere/README.md, README on the right with `1` on the first line and `1 2 3…` below, statusline at the bottom, the hint under it. No CV button (manifest empty). Stop the preview.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: nvim layout with file tree, numbered README buffer, statusline"
```

---

### Task 5: Pane template, entry routes, hero, 404

**Files:**
- Create: `src/components/Pane.astro`, `src/components/Hero.astro`, `src/pages/projects/[...slug].astro`, `src/pages/work/[...slug].astro`, `src/pages/elsewhere/[...slug].astro`, `src/pages/404.astro`, `e2e/pages.spec.ts`

**Interfaces:**
- Consumes: `Nvim.astro`, `Line.astro`, `paragraphs`, `crumbFor`, `pathFor`, `shortPathFor`, `bracketLinks`, `fileName`.
- Produces:
  - `Pane.astro` props `{ title: string; links?: BracketLink[]; meta?: string; paragraphs: string[]; tags: string[] }` and a default slot for the bottom block.
  - `Hero.astro` props `{ hero: ProjectData['hero']; alt: string }`.
  - Routes `/projects/<id>`, `/work/<id>`, `/elsewhere/<id>`, `/404`.

- [ ] **Step 1: Pane and Hero**

`src/components/Pane.astro`:
```astro
---
import Line from './Line.astro';
import type { BracketLink } from '../lib/pages';
interface Props { title: string; links?: BracketLink[]; meta?: string; paragraphs: string[]; tags: string[] }
const { title, links = [], meta, paragraphs, tags } = Astro.props;
---
<Line cls="title">
  <span>{title}</span>
  {(links.length > 0 || meta) && (
    <span class="links">
      {meta && <span class="dim">{meta}</span>}
      {links.map((l) => <a href={l.href} target="_blank" rel="noopener">{l.label}</a>)}
    </span>
  )}
</Line>
<Line />
{paragraphs.map((p, i) => (
  <>
    <Line>{p}</Line>
    {i < paragraphs.length - 1 && <Line />}
  </>
))}
<Line />
<Line cls="tags">{tags.map((t) => <span>{t}</span>)}</Line>
<Line />
<slot />
```

`src/components/Hero.astro`:
```astro
---
import { Image } from 'astro:assets';
import Line from './Line.astro';
import type { CollectionEntry } from 'astro:content';
type Hero = NonNullable<CollectionEntry<'projects'>['data']['hero']>;
interface Props { hero: Hero; alt: string }
const { hero, alt } = Astro.props;
---
<Line cls="label">{hero.type === 'image' ? 'screenshot' : 'recording'}</Line>
<Line />
<Line cls="media">
  {hero.type === 'image' ? (
    <Image src={hero.src} alt={alt} widths={[640, 960, 1280]} sizes="(max-width: 899px) 100vw, 70vw" loading="lazy" />
  ) : (
    <video src={hero.src} controls muted loop playsinline preload="metadata"></video>
  )}
</Line>
```

- [ ] **Step 2: Routes**

`src/pages/projects/[...slug].astro`:
```astro
---
import { getCollection } from 'astro:content';
import Nvim from '../../layouts/Nvim.astro';
import Pane from '../../components/Pane.astro';
import Hero from '../../components/Hero.astro';
import { paragraphs } from '../../lib/text';
import { bracketLinks, crumbFor, pathFor, shortPathFor } from '../../lib/pages';

export async function getStaticPaths() {
  const entries = await getCollection('projects');
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}
const { entry } = Astro.props;
const d = entry.data;
const paras = paragraphs(entry.body);
const parent = entry.id.includes('/') ? entry.id.slice(0, entry.id.lastIndexOf('/')) : 'projects';
---
<Nvim
  title={d.title}
  description={paras[0] ?? d.title}
  crumb={crumbFor('projects', entry.id, d.lang)}
  short={parent}
  path={pathFor('projects', entry.id, d.lang)}
  shortPath={shortPathFor('projects', entry.id, d.lang)}
>
  <Pane title={d.title} links={bracketLinks(d)} paragraphs={paras} tags={d.tags}>
    {d.hero && <Hero hero={d.hero} alt={d.title} />}
  </Pane>
</Nvim>
```

`src/pages/elsewhere/[...slug].astro`:
```astro
---
import { getCollection } from 'astro:content';
import Nvim from '../../layouts/Nvim.astro';
import Pane from '../../components/Pane.astro';
import Hero from '../../components/Hero.astro';
import { paragraphs } from '../../lib/text';
import { bracketLinks, crumbFor, pathFor, shortPathFor } from '../../lib/pages';

export async function getStaticPaths() {
  const entries = await getCollection('elsewhere');
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}
const { entry } = Astro.props;
const d = entry.data;
const paras = paragraphs(entry.body);
const parent = entry.id.includes('/') ? entry.id.slice(0, entry.id.lastIndexOf('/')) : 'elsewhere';
---
<Nvim
  title={d.title}
  description={paras[0] ?? d.title}
  crumb={crumbFor('elsewhere', entry.id, d.lang)}
  short={parent}
  path={pathFor('elsewhere', entry.id, d.lang)}
  shortPath={shortPathFor('elsewhere', entry.id, d.lang)}
>
  <Pane title={d.title} links={bracketLinks(d)} paragraphs={paras} tags={d.tags}>
    {d.hero && <Hero hero={d.hero} alt={d.title} />}
  </Pane>
</Nvim>
```

`src/pages/work/[...slug].astro`:
```astro
---
import { getCollection } from 'astro:content';
import Nvim from '../../layouts/Nvim.astro';
import Pane from '../../components/Pane.astro';
import Line from '../../components/Line.astro';
import { paragraphs } from '../../lib/text';
import { bracketLinks, crumbFor, pathFor, shortPathFor } from '../../lib/pages';

export async function getStaticPaths() {
  const entries = await getCollection('work');
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
}
const { entry } = Astro.props;
const d = entry.data;
const paras = paragraphs(entry.body);
---
<Nvim
  title={d.title}
  description={paras[0] ?? d.title}
  crumb={crumbFor('work', entry.id, d.lang)}
  short="work"
  path={pathFor('work', entry.id, d.lang)}
  shortPath={shortPathFor('work', entry.id, d.lang)}
>
  <Pane title={d.role} meta={`${d.from} - ${d.to}`} paragraphs={paras} tags={d.tags}>
    {d.shipped.length > 0 && (
      <>
        <Line cls="label">shipped</Line>
        <Line />
        {d.shipped.map((s) => (
          <>
            <Line cls="title">
              <span>{s.title}</span>
              <span class="links">{bracketLinks(s).map((l) => <a href={l.href} target="_blank" rel="noopener">{l.label}</a>)}</span>
            </Line>
            <Line>{s.description}</Line>
            <Line cls="tags">{s.tags.map((t) => <span>{t}</span>)}</Line>
            <Line />
          </>
        ))}
      </>
    )}
  </Pane>
</Nvim>
```

`src/pages/404.astro`:
```astro
---
import Nvim from '../layouts/Nvim.astro';
import Line from '../components/Line.astro';
import { SITE } from '../site';
---
<Nvim title="Not found" description="No such file" crumb="" short={SITE.root} path={`${SITE.root}`} shortPath="">
  <Line cls="err">E484: Can't open file <span id="missing"></span></Line>
  <Line />
  <Line><a href="/">back to README.md</a></Line>
</Nvim>
<script>
  const el = document.getElementById('missing');
  if (el) el.textContent = location.pathname;
</script>
```

- [ ] **Step 3: Page tests**

`e2e/pages.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('a project page renders the pane template', async ({ page }) => {
  await page.goto('/projects/from_scratch/redis');
  const lines = page.locator('#buffer .ln');
  await expect(lines.first()).toContainText('A Redis-compatible server');
  await expect(lines.first().locator('a', { hasText: '[github]' })).toHaveAttribute('href', 'https://github.com/alex-popov-tech/redis-go');
  await expect(page.locator('#buffer .tx.tags')).toContainText('RESP');
  await expect(page.locator('#buffer .tx.media img')).toBeVisible();
  await expect(page.locator('#statusline')).toContainText('redis.go');
});

test('a work page shows role, dates and shipped items', async ({ page }) => {
  await page.goto('/work/lokalise');
  await expect(page.locator('#buffer .ln').first()).toContainText('[ROLE]');
  await expect(page.locator('#buffer .ln').first()).toContainText('[YYYY] - [YYYY]');
});

test('an elsewhere page renders a video', async ({ page }) => {
  await page.goto('/elsewhere/advent_of_code');
  await expect(page.locator('#buffer video')).toHaveAttribute('src', '/videos/aoc2024.mp4');
});

test('unknown paths answer 404', async ({ page }) => {
  const res = await page.goto('/projects/nope');
  expect(res?.status()).toBe(404);
});

test('the 404 page is an nvim error naming the path', async ({ page }) => {
  await page.goto('/404');
  await expect(page.locator('#buffer')).toContainText("E484: Can't open file /404");
  await expect(page.locator('#buffer a', { hasText: 'README.md' })).toHaveAttribute('href', '/');
});

test('routes have no trailing slash', async ({ page }) => {
  const res = await page.goto('/projects/from_scratch/redis/');
  expect(res?.status()).toBe(404);
});
```

- [ ] **Step 4: Build and test**

```bash
npm run check
npm run test:e2e -- pages    # expected: 12 passed (6 tests × 2 projects)
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: project, work and elsewhere pages on the pane template, nvim 404"
```

---

### Task 6: Migrate all content from v1

**Files:**
- Create: every file listed in the table below under `src/content/`, plus copied images and one new placeholder-free entry (`change_case`).
- Modify: nothing else.

**Interfaces:**
- Consumes: the collection schemas from Task 2.
- Produces: 20 project entries (7 in `from_scratch`, 13 flat), 4 work entries, 1 elsewhere entry. Slugs and hrefs used later: `/projects/from_scratch/{redis,git,bittorrent,dns,http,grep,interpreter}`, `/projects/{store,acapulko,better_dtek,dreampicai,claude_rio,dotfiles,change_case,lastpass,play_right,selenide,openai_chat,go_pay_taxes,rock_paper_scissors}`, `/elsewhere/advent_of_code`, `/work/{lokalise,informa,epam,keenethics}`.

The v1 source is `/Users/alex/me/pet/portfolio/src/data.astro`. Bodies below are its `description` strings, one paragraph each, copied verbatim (typos included; they are the user's copy). Tags are the `text` values of each v1 `stack` entry, except redis and acapulko which use the tags from the mockup. Titles for `from_scratch` are rewritten to the mockup's style; all others keep the v1 title.

- [ ] **Step 1: Copy images**

```bash
IMG=/Users/alex/me/pet/portfolio/src/images
FS=src/content/projects/from_scratch
P=src/content/projects
cp $IMG/git-go.png $FS/git.png
cp $IMG/bittorrent-go.png $FS/bittorrent.png
cp $IMG/dns-go.png $FS/dns.png
cp $IMG/go-http.png $FS/http.png
cp $IMG/grep-go.png $FS/grep.png
cp $IMG/go-interpreter.png $FS/interpreter.png
cp $IMG/store.nvim.png $P/store.png
cp $IMG/acapulko.png $P/acapulko.png
cp $IMG/better-dtek.png $P/better_dtek.png
cp $IMG/dreampicai.png $P/dreampicai.png
cp $IMG/claude-rio.png $P/claude_rio.png
cp $IMG/dotfiles.png $P/dotfiles.png
cp $IMG/lastpass.png $P/lastpass.png
cp $IMG/chatgpt.png $P/openai_chat.png
cp $IMG/go-pay-taxes.png $P/go_pay_taxes.png
```
(`redis.png` was copied in Task 2. `mayak.png` is not used: Mayak is a `shipped` item without a hero. `none.webp` is not used: those projects simply have no hero.)

- [ ] **Step 2: from_scratch entries**

`src/content/projects/from_scratch/git.md`:
```md
---
title: A Git implementation, from scratch, in Go
lang: go
order: 2
repo: alex-popov-tech/git-go
tags: [Go, Git, GitHub]
hero:
  type: image
  src: ./git.png
---
A Git implementation built from scratch in Go with no Git libraries — it reads and writes the real .git object store by hand (blobs, trees, commits), content-addressed with SHA-1 and zlib-compressed, byte-for-byte compatible with real git.

Implements the plumbing (init, hash-object, cat-file, ls-tree, write-tree, commit-tree) and a full clone of public repositories over the Smart HTTP protocol — pkt-line framing, packfile parsing, and ref-delta resolution including delta chains, then checkout. Built end-to-end as the CodeCrafters 'Build Your Own Git' challenge.
```

`src/content/projects/from_scratch/bittorrent.md`:
```md
---
title: A BitTorrent client, from scratch, in Go
lang: go
order: 3
repo: alex-popov-tech/bittorrent-go
tags: [Go, GitHub]
hero:
  type: image
  src: ./bittorrent.png
---
A BitTorrent client built from scratch in Go with no torrent libraries — it hand-rolls the bencode codec, parses .torrent files down to the info-hash, and announces to HTTP trackers to discover a peer swarm.

Speaks the raw peer wire protocol (68-byte handshake, then length-prefixed messages), downloads pieces in 16 KiB blocks with SHA-1 verification, and saturates the swarm with a goroutine-per-peer work queue. Magnet links are supported too, fetching the torrent metadata itself from peers over ut_metadata (BEP 9/10). Built end-to-end as the CodeCrafters 'Build Your Own BitTorrent' challenge.
```

`src/content/projects/from_scratch/dns.md`:
```md
---
title: A DNS server, from scratch, in Go
lang: go
order: 4
repo: alex-popov-tech/dns-go
tags: [Go, GitHub]
hero:
  type: image
  src: ./dns.png
---
A DNS server built from scratch in Go with no DNS libraries — it parses and serializes raw DNS packets byte by byte, across the header, question, and answer sections.

Handles DNS name compression (pointer labels), bit-packed header flags, and recursive forwarding to an upstream resolver. Completed end-to-end as the CodeCrafters 'Build Your Own DNS server' challenge.
```

`src/content/projects/from_scratch/http.md`:
```md
---
title: An HTTP/1.1 server, from scratch, in Go
lang: go
order: 5
repo: alex-popov-tech/go_http
tags: [Go, GitHub]
hero:
  type: image
  src: ./http.png
---
An HTTP/1.1 server built from scratch in Go directly on raw TCP, without using net/http for the server itself — it carves the request line, header block, and body out of the byte stream by hand, validates field names against the RFC tchar set, and reads bodies strictly against Content-Length.

Serializes responses by hand and supports chunked transfer encoding with trailer fields (X-Content-SHA256, X-Content-Length) computed once the body is fully sent, plus streamed file responses, reverse proxying, goroutine-per-connection concurrency and graceful shutdown. Built end-to-end as the Boot.dev 'Learn HTTP Protocol' course, starting from raw UDP datagrams.
```

`src/content/projects/from_scratch/grep.md`:
```md
---
title: A grep, from scratch, in Go
lang: go
order: 6
repo: alex-popov-tech/grep-go
tags: [Go, GitHub]
hero:
  type: image
  src: ./grep.png
---
A grep built from scratch in Go with no regex libraries — the pattern is compiled by hand into a token list, and matching is a backtracking DFS where every token reports all the ways it could consume the input, greedy-first.

Supports ERE-flavored syntax (character classes, anchors, quantifiers including {n,m} ranges, grouping and alternation), capture groups that survive nesting, and multiple and nested backreferences, behind a grep-style CLI with recursive directory walk and a goroutine-per-file fan-out. Built end-to-end as the CodeCrafters 'Build Your Own grep' challenge, including the Backreferences and File Search extensions.
```

`src/content/projects/from_scratch/interpreter.md`:
```md
---
title: A Monkey interpreter, in Go
lang: go
order: 7
repo: alex-popov-tech/go-interpreter
tags: [Go, GitHub]
hero:
  type: image
  src: ./interpreter.png
---
Interpreter for the Monkey programming language, built in Go following 'Writing An Interpreter In Go' by Thorsten Ball.

Features a lexer, parser, AST representation, and tree-walking evaluator supporting let/return statements, closures, integers, booleans, strings, arrays, and hash maps.
```

- [ ] **Step 3: Flat project entries**

`src/content/projects/store.md`:
```md
---
title: store.nvim
lang: lua
order: 1
repo: alex-popov-tech/store.nvim
tags: [GitHub, Lua, Neovim]
hero:
  type: image
  src: ./store.png
---
Store.nvim is a Neovim plugin that provides an intuitive modal interface for browsing and discovering awesome Neovim plugins.

It features a clean UI that allow users to explore plugins interactively. The plugin includes live README preview with markdown rendering and syntax highlighting, smart filtering capabilities for searching plugins by name, and other cool stuff :)
```

`src/content/projects/acapulko.md`:
```md
---
title: A power-outage tracker for one address in Ukraine
lang: go
order: 2
repo: alex-popov-tech/acapulko
live: https://acapulko.oleksandrp.com/
tags: [Go, Home Assistant, Telegram, Raspberry Pi, Docker, SSE]
hero:
  type: image
  src: ./acapulko.png
---
Self-hosted power outage tracker for a single Ukrainian address, built to survive the war-driven blackouts. Combines live grid sensor data from Home Assistant with emergency outage announcements from the DTEK utility API.

Pushes Telegram alerts when power flips or DTEK announces an outage, and serves a live PWA dashboard via Server-Sent Events. Runs on a Raspberry Pi 5, packaged as both a standalone binary and a Home Assistant add-on.
```

`src/content/projects/better_dtek.md`:
```md
---
title: Better DTEK
lang: ts
order: 3
repo: alex-popov-tech/better-dtek
live: https://dtek-theta.vercel.app
tags: [Playwright, Redis, SvelteKit, TailwindCSS, TypeScript, Vercel, Vite]
hero:
  type: image
  src: ./better_dtek.png
---
Real-time web application for tracking power outages in Ukraine across DTEK regions.

Features visual traffic light status indicators, multi-address tracking with custom labels, and hourly schedules for planned outages. Emergency alerts are distinguished with pulsing indicators.
```

`src/content/projects/dreampicai.md`:
```md
---
title: DreampicAI
lang: go
order: 4
repo: alex-popov-tech/dreampicai
live: https://dreampicai.oleksandrp.com
tags: [GitHub, Go, HTMX, Replicate, Supabase, Templ]
hero:
  type: image
  src: ./dreampicai.png
---
Image generation hub that leverages multiple AI models which streamlines the complex process of AI image generation by providing a simple interface for model selection and prompt input.

Built with ~0% javascript, utilizing the power of Golang, Templ and HTMX to deliver a user-friendly experience.
```

`src/content/projects/claude_rio.md`:
```md
---
title: Claude Rio
lang: js
order: 5
repo: alex-popov-tech/claude-rio
tags: [GitHub, JavaScript, Node.js]
hero:
  type: image
  src: ./claude_rio.png
---
Deterministic matcher system for Claude Code that improves activation of skills, agents, and commands through explicit keyword-based matching.

Lightweight architecture with no external dependencies, featuring shell preprocessing in 10-20ms and cross-platform support for macOS, Linux, and Windows.
```

`src/content/projects/dotfiles.md`:
```md
---
title: .dotfiles
lang: sh
order: 6
repo: alex-popov-tech/.dotfiles
live: https://dotfiles.oleksandrp.com
tags: [Git, Homebrew, Lua, Neovim, Raycast, WezTerm, Zsh, macOS]
hero:
  type: image
  src: ./dotfiles.png
---
Heavily opinionated comprehensive collection of configuration files for various tools and applications you use on macOS.

It includes settings for wezterm, zsh, nvim, and several others like tmux, htop, and btop.

It also features a Brewfile for managing macOS packages via Homebrew.
```

`src/content/projects/change_case.md` (new in v2; the description states only what `lua/change_case/case_transformers.lua` in the repo implements):
```md
---
title: change_case.nvim
lang: lua
order: 7
repo: alex-popov-tech/change_case.nvim
tags: [Lua, Neovim]
---
A small Neovim plugin that converts the word under the cursor between cases: camel, upper camel, snake, kebab, screaming snake, train, dot, lowercase and uppercase.

Pure Lua, no dependencies, with a test suite.
```

`src/content/projects/lastpass.md`:
```md
---
title: Lastpass for Raycast
lang: ts
order: 8
repo: alex-popov-tech/extensions/tree/main/extensions/lastpass
live: https://www.raycast.com/alex-popov-tech/lastpass
tags: [Node.js, Raycast, React]
hero:
  type: image
  src: ./lastpass.png
---
The LastPass Raycast Extension project provides an integration for LastPass within the Raycast productivity tool.

This extension enables users to manage and access their passwords directly from Raycast, enhancing efficiency and security.

The project focuses on providing a seamless user experience while maintaining robust security measures, making password management both convenient and secure.
```

`src/content/projects/play_right.md`:
```md
---
title: Play Right
lang: ts
order: 9
repo: automician/playright
tags: [Node.js, Playwright, TypeScript]
---
Play the right test- and user-oriented way with Playwright ;)

It is also a port of Selenide, Selene, NSelene, SelenideJS from selenium webdriver world.
```

`src/content/projects/selenide.md`:
```md
---
title: SelenideJS
lang: ts
order: 10
repo: KnowledgeExpert/selenidejs
tags: [Node.js, Selinium, TypeScript]
---
Wrapper for Selenium WebDriver, which provides testing user-oriented API for writing stable and readable UI tests in JavaScript/TypeScript.
```

`src/content/projects/openai_chat.md`:
```md
---
title: Openai Chat
lang: ts
order: 11
repo: alex-popov-tech/t3_chatgpt
live: https://t3-chatgpt.oleksandrp.com/
tags: [Neon, Next.js, Node.js, OpenAI, PostgreSQL, Prisma, React, TanStack, TypeScript, Vercel, t3.gg, tRPC]
hero:
  type: image
  src: ./openai_chat.png
---
ChatGPT clone using the T3 Stack, which includes Next.js, TypeScript, Tailwind CSS, and tRPC.

The repo provides a structured foundation for creating a modern web application, integrating technologies like Prisma for database management and NextAuth.js for authentication.
```

`src/content/projects/go_pay_taxes.md`:
```md
---
title: Go pay taxes!
lang: ts
order: 12
repo: alex-popov-tech/go_pay_taxes_web
live: https://alex-popov-tech.github.io/go_pay_taxes_web/
tags: [React, TailwindCSS, Github, TypeScript, Vite]
hero:
  type: image
  src: ./go_pay_taxes.png
---
Web application designed to assist Ukrainian developers in calculating and managing their taxes.

It provides a simple interface to input income data, either manually or by uploading bank statements from monobank or privatbank.

Built with modern web technologies like React and Vite, it aims to make tax management straightforward for IT professionals in Ukraine.
```

`src/content/projects/rock_paper_scissors.md`:
```md
---
title: Rock Paper Scissors
lang: ts
order: 13
repo: alex-popov-tech/rock_paper_scissors_nest_js
tags: [Neon, NestJS, Node.js, PostgreSQL, Prisma, TailwindCSS, TypeScript]
---
Web application designed to play the classic game of rock-paper-scissors, built with a strong emphasis on clean architecture principles.

The project includes a modular structure, focusing on separation of concerns and easy maintainability.
```

- [ ] **Step 4: Work entries**

`src/content/work/informa.md`:
```md
---
title: "[ROLE]"
role: "[ROLE]"
from: "[YYYY]"
to: "[YYYY]"
order: 2
tags: ["[THE STACK YOU USED THERE]"]
---
[ONE LINE ON WHAT YOU OWNED THERE, IN YOUR OWN WORDS]

[A SECOND LINE: THE THING YOU SHIPPED, OR THE PROBLEM YOU SOLVED]
```

`src/content/work/epam.md`:
```md
---
title: "[ROLE]"
role: "[ROLE]"
from: "[YYYY]"
to: "[YYYY]"
order: 3
tags: ["[THE STACK YOU USED THERE]"]
---
[ONE LINE ON WHAT YOU OWNED THERE, IN YOUR OWN WORDS]

[A SECOND LINE: THE THING YOU SHIPPED, OR THE PROBLEM YOU SOLVED]
```

`src/content/work/keenethics.md`:
```md
---
title: "[ROLE]"
role: "[ROLE]"
from: "[YYYY]"
to: "[YYYY]"
order: 4
tags: ["[THE STACK YOU USED THERE]"]
shipped:
  - title: Mayak
    repo: keenethics/mayak
    live: https://www.mayak.co.ua/
    tags: [GitHub, JavaScript, Neon, Next.js, Node.js, PostgreSQL, Prisma, React, TailwindCSS, TanStack, Vercel]
    description: Web application for searching psychological services in Ukraine. The project is built using Next.js and PostreSQL wtih Prisma ORM to ensure scalability and maintainability. The project includes Docker support for easy deployment and environment consistency, along with detailed documentation for setup and configuration.
---
[ONE LINE ON WHAT YOU OWNED THERE, IN YOUR OWN WORDS]

[A SECOND LINE: THE THING YOU SHIPPED, OR THE PROBLEM YOU SOLVED]
```

- [ ] **Step 5: Build and check every page exists**

```bash
npm run check
npm run build
ls dist/projects dist/projects/from_scratch dist/work dist/elsewhere
```
Expected `dist/projects/from_scratch`: `bittorrent.html dns.html git.html grep.html http.html interpreter.html redis.html`. Expected `dist/projects`: the 15 flat pages plus the `from_scratch` directory. `dist/work`: `epam.html informa.html keenethics.html lokalise.html`. `dist/elsewhere`: `advent_of_code.html`.

Run `npm run test:e2e` (expected: everything still passes; the tree test's depth-0 names are unchanged) and open the preview to eyeball the tree: `from_scratch` shows a count of 7, then 13 flat files, `elsewhere` folded with count 1, README last.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "content: migrate every project from v1, add work placeholders and change_case.nvim"
```

---

### Task 7: Code excerpts and the typing cycler

**Files:**
- Create: `src/lib/typing.ts`, `src/lib/typing.test.ts`, `src/components/Cycler.astro`, `src/components/Showcase.astro`, `src/scripts/cycler.ts`, `e2e/cycler.spec.ts`, twelve excerpt files under `src/excerpts/` (listed in Step 4)
- Modify: `src/site.ts` (add `showcase`), `src/readme.ts` (insert the showcase line), `src/components/Readme.astro` (render it), `src/pages/projects/[...slug].astro` (excerpts before hero), `src/layouts/Nvim.astro` (load the script), `src/styles/global.css` (caret, source line), seven `from_scratch` entries (add `excerpts`)

**Interfaces:**
- Consumes: `loadExcerpt`, `highlightLines`, `excerptLabel`, `Line.astro`.
- Produces:
  - `nextDelay(atLineStart: boolean, rand?: () => number, cps?: number): number` (ms), `lineStarts(lengths: number[]): Set<number>`, `padTo<T>(arr: T[], n: number, fill: T): T[]`, constants `CPS = 40`, `HOLD_MS = 4000`, `LINE_PAUSE_MS = 150`.
  - `Cycler.astro` props `{ snippets: { excerpt: Excerpt; project?: { name: string; href: string } }[]; fenced?: boolean }`. Renders `<code-cycler>` whose live rows are `.ln` lines inside `[data-live]`, a header line with `a[data-src]` (and `a[data-project]` when given), an optional `[data-fence]` line, and one `<template data-snippet>` per snippet.
  - `showcase` in `src/site.ts`: `{ name: string; project: string; file: string }[]`.

- [ ] **Step 1: Failing typing tests**

`src/lib/typing.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { nextDelay, lineStarts, padTo, CPS, LINE_PAUSE_MS } from './typing';

describe('nextDelay', () => {
  it('jitters between 60% and 140% of the base interval', () => {
    const base = 1000 / CPS;
    expect(nextDelay(false, () => 0)).toBe(Math.round(base * 0.6));
    expect(nextDelay(false, () => 1)).toBe(Math.round(base * 1.4));
  });
  it('pauses before the first character of a line', () => {
    expect(nextDelay(true, () => 0) - nextDelay(false, () => 0)).toBe(LINE_PAUSE_MS);
  });
  it('honours a custom speed', () => {
    expect(nextDelay(false, () => 0.5, 100)).toBe(10);
  });
});

describe('lineStarts', () => {
  it('returns the character index where each non-empty line begins', () => {
    expect([...lineStarts([3, 0, 2])]).toEqual([0, 3]);
    expect([...lineStarts([])]).toEqual([]);
  });
});

describe('padTo', () => {
  it('pads with the fill value and never truncates below n', () => {
    expect(padTo(['a'], 3, '')).toEqual(['a', '', '']);
    expect(padTo(['a', 'b', 'c', 'd'], 3, '')).toEqual(['a', 'b', 'c', 'd']);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- typing`
Expected: FAIL, module `./typing` not found.

- [ ] **Step 3: Implement typing.ts**

`src/lib/typing.ts`:
```ts
export const CPS = 40;
export const HOLD_MS = 4000;
export const LINE_PAUSE_MS = 150;

/** Delay before revealing the next character. Jittered; longer when the character starts a line. */
export function nextDelay(atLineStart: boolean, rand: () => number = Math.random, cps: number = CPS): number {
  const base = 1000 / cps;
  const jitter = base * (0.6 + 0.8 * rand());
  return Math.round(jitter + (atLineStart ? LINE_PAUSE_MS : 0));
}

/** Character indexes (over the concatenated lines) at which a non-empty line begins. */
export function lineStarts(lengths: number[]): Set<number> {
  const starts = new Set<number>();
  let acc = 0;
  for (const len of lengths) {
    if (len > 0) starts.add(acc);
    acc += len;
  }
  return starts;
}

/** Pad `arr` with `fill` up to length `n`; longer arrays are returned as they are. */
export function padTo<T>(arr: T[], n: number, fill: T): T[] {
  return arr.length >= n ? arr : [...arr, ...Array<T>(n - arr.length).fill(fill)];
}
```

Run: `npm test` → expected: all pass.

- [ ] **Step 4: Excerpt files**

Each file's first line is the permalink comment; the rest is copied verbatim from the pinned commit (tabs preserved in Go). Create these under `src/excerpts/`:

`redis-go/bulkstring.go`:
```go
// https://github.com/alex-popov-tech/redis-go/blob/df77b784abd992c8fa52e2ae9c27c0c3b119f74a/app/internal/resp/bulkstring.go#L16-L38
func ParseBulkString(r Reader) (BulkString, error) {
	contentLength, firstNonNumberByte, err := readNumber(r)
	if err != nil {
		return "", err
	}
	if firstNonNumberByte != '\r' {
		return "", fmt.Errorf("expected '\\r', got %q", firstNonNumberByte)
	}
	// nums finished, skip next byte which should be '\r'
	b, err := r.ReadByte()
	if err != nil {
		return "", err
	}
	if b != '\n' {
		return "", fmt.Errorf("expected '\\n', got %q", b)
	}

	// read content
	buf := make([]byte, contentLength)
	_, err = io.ReadFull(r, buf)
	if err != nil {
		return "", err
	}
```

`git-go/blob.go`:
```go
// https://github.com/alex-popov-tech/git-go/blob/95225fd5ec43bf054dd0d4803d46246fe371c3a0/internal/objects/blob.go#L23-L43
// parses blob object file
func ParseBlob(object []byte) (*Blob, error) {
	hash := utils.Hash(object)
	t, rest, found := bytes.Cut(object, []byte(" "))
	if !found {
		return nil, fmt.Errorf("malformed blob object - missing whitespace after type")
	}
	if string(t) != "blob" {
		return nil, fmt.Errorf("malformed blob object - expected type 'blob' but was %s", string(t))
	}
	sizeBytes, contentBytes, found := bytes.Cut(rest, []byte{byte(0)})
	if !found {
		return nil, fmt.Errorf("malformed blob object %s", object)
	}
	size, err := strconv.Atoi(string(sizeBytes))
	if err != nil {
		return nil, fmt.Errorf("malformed blob object: %v", err)
	}

	return &Blob{Hash: hash, Size: size, Content: contentBytes[:size]}, nil
}
```

`git-go/hashobject.go`:
```go
// https://github.com/alex-popov-tech/git-go/blob/95225fd5ec43bf054dd0d4803d46246fe371c3a0/internal/commands/hashobject.go#L20-L35
func hashobject(args []string) error {
	write := args[0] == "-w"
	var filePath string
	if write {
		filePath = args[1]
	} else {
		filePath = args[0]
	}

	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("can't read file %s: %v", filePath, err)
	}
	header := fmt.Sprintf("blob %d\x00", len(data))
	objectFileContent := append([]byte(header), data...)
	hash := utils.Hash(objectFileContent)
```

`bittorrent-go/handshake.go`:
```go
// https://github.com/alex-popov-tech/bittorrent-go/blob/e6fc298dc0512727e3509f7f6ccffb66e9612f1e/internal/network/handshake.go#L16-L35
func (p Peer) Handshake(infoHash []byte, extensionSupported bool) (net.Conn, []byte, error) {
	conn, err := net.DialTimeout("tcp", p.address, DialTimeout)
	if err != nil {
		return nil, nil, fmt.Errorf("can't connect to peer %s: %w", p.address, err)
	}

	handshakeMessage := make([]byte, 68)
	//	length of the protocol string (BitTorrent protocol) which is 19 (1 byte)
	handshakeMessage[0] = 19
	//	the string BitTorrent protocol (19 bytes)
	copy(handshakeMessage[1:20], []byte("BitTorrent protocol"))
	//	eight reserved bytes, which are all set to zero (8 bytes)
	//	or 20th bit flagged
	if extensionSupported {
		copy(handshakeMessage[20:28], []byte{0, 0, 0, 0, 0, 0b00010000, 0, 0})
	}
	//	sha1 infohash (20 bytes) (NOT the hexadecimal representation, which is 40 bytes long)
	copy(handshakeMessage[28:48], infoHash)
	//	peer id (20 bytes) (generate 20 random byte values)
	copy(handshakeMessage[48:68], PeerId[:])
```

`bittorrent-go/bencode.go`:
```go
// https://github.com/alex-popov-tech/bittorrent-go/blob/e6fc298dc0512727e3509f7f6ccffb66e9612f1e/internal/bencode/bencode.go#L126-L146
func Marshall(value interface{}) (string, error) {
	switch it := value.(type) {
	case string:
		return fmt.Sprintf("%d:%s", len(it), it), nil
	case int:
		return fmt.Sprintf("i%de", value), nil
	case byte: // uint8
		return fmt.Sprintf("i%de", it), nil
	case uint32:
		return fmt.Sprintf("i%de", it), nil
	case []interface{}:
		res := "l"
		for _, v := range it {
			val, err := Marshall(v)
			if err != nil {
				return "", err
			}
			res += val
		}
		res += "e"
		return res, nil
```

`dns-go/question.go`:
```go
// https://github.com/alex-popov-tech/dns-go/blob/cb9ea17c5475bbf3044211f4fe1279c5503b4007/internal/message/question.go#L31-L56
func parseQuestionName(pointer int, data []byte) (string, int) {
	labels := []string{}
	for {
		first := data[pointer]
		pointer++
		// if null byte - end
		if first == 0 {
			break
		}
		// if redirect - read labels from there
		if (first & 0b11000000) == 0b11000000 {
			second := data[pointer]
			pointer++
			redirectAddress := binary.BigEndian.Uint16([]byte{first & 0b00111111, second})
			question, _ := parseQuestionName(int(redirectAddress), data)
			labels = append(labels, question)
			break
		}
		// else read from here
		label := data[pointer : pointer+int(first)]
		pointer = pointer + int(first)
		labels = append(labels, string(label))
	}

	return strings.Join(labels, "."), pointer
}
```

`dns-go/header.go`:
```go
// https://github.com/alex-popov-tech/dns-go/blob/cb9ea17c5475bbf3044211f4fe1279c5503b4007/internal/message/header.go#L52-L66
func (h *Header) SetFlags(qr, opcode, aa, tc, rd, ra, z, rcode uint16) {
	h.Flags = qr<<15 | opcode<<11 | aa<<10 | tc<<9 | rd<<8 | ra<<7 | z<<4 | rcode
}

func (h Header) Opcode() uint16 {
	return (h.Flags >> 11) & 0xF
}

func (h Header) Rd() uint16 {
	return (h.Flags >> 8) & 0x1
}

func (h Header) Rcode() uint16 {
	return h.Flags & 0xF
}
```

`go_http/headers.go`:
```go
// https://github.com/alex-popov-tech/go_http/blob/0ff1b1244e7932c2af791160ee1a9fad81ac2e7a/internal/headers/headers.go#L12-L33
func ParseHeaders(lines []string) (Headers, error) {
	res := make(map[string]string)
	for _, line := range lines {
		name, value, err := parseHeader(line)
		if err != nil {
			return res, fmt.Errorf("cannot parse header '%s': %w", line, err)
		}

		// 1. field name is case insensitive
		// so we just make all lowercase for simplicity
		lowerCasedName := strings.ToLower(name)

		// 2. if there are repetitive field names - their values are joined with ' ,'
		if _, hasValue := res[lowerCasedName]; hasValue {
			res[lowerCasedName] = fmt.Sprintf("%s,%s", res[lowerCasedName], value)
		} else {
			res[lowerCasedName] = value
		}
	}

	return res, nil
}
```

`grep-go/backreference.go`:
```go
// https://github.com/alex-popov-tech/grep-go/blob/616576d21d5810932ef1d912bb39e9d63be4af0a/internal/token/backreference.go#L14-L33
func (t Backreference) Match(input []rune, i int, matched []*TokenMatchResult) []*TokenMatchResult {
	var match *TokenMatchResult
	for _, m := range matched {
		if m.GroupNumber == int(t) {
			match = m
		}
	}
	if match == nil {
		return nil
	}

	expected := input[match.Start:match.End]
	if i+len(expected) > len(input) {
		return nil
	}
	if slices.Equal(expected, input[i:i+len(expected)]) {
		return []*TokenMatchResult{{Start: i, End: i + len(expected)}}
	}
	return nil
}
```

`go-interpreter/repl.go`:
```go
// https://github.com/alex-popov-tech/go-interpreter/blob/ebd71b3cd7beafe574659539d5382ade1e2e2891/cmd/repl.go#L16-L38
func Repl() {
	in := os.Stdin
	out := os.Stdout
	scanner := bufio.NewScanner(in)

	scope := object.NewGlobalScope()
	fmt.Println("Hello bro! This is the Monkey programming language!")
	fmt.Println("Feel free to type in commands:")
	for {
		fmt.Fprint(out, PROMPT)
		scanned := scanner.Scan()
		if !scanned {
			return
		}

		line := scanner.Text()
		if line == "q" || line == "quit" {
			fmt.Printf("Bye bye!")
			os.Exit(0)
		}
		l := lexer.New(line)
		p := parser.New(l)
		program := p.ParseProgram()
```

`store.nvim/sort.lua`:
```lua
-- https://github.com/alex-popov-tech/store.nvim/blob/c52e4fff19f3c59589328ffd352d7502fa8b580d/lua/store/sort.lua#L3-L27
M.sorts = {
  most_stars = {
    label = "Most Stars",
    key = "s",
    key_col = 5,
    fn = function(a, b, _)
      return (a.stars.curr or 0) > (b.stars.curr or 0)
    end,
  },
  rising_stars_monthly = {
    label = "Rising Stars (monthly)",
    key = "m",
    key_col = 14,
    fn = function(a, b, _)
      return (a.stars.monthly or 0) > (b.stars.monthly or 0)
    end,
  },
  rising_stars_weekly = {
    label = "Rising Stars (weekly)",
    key = "w",
    key_col = 14,
    fn = function(a, b, _)
      return (a.stars.weekly or 0) > (b.stars.weekly or 0)
    end,
  },
```

`better-dtek/transform.ts`:
```ts
// https://github.com/alex-popov-tech/better-dtek/blob/7e0aacc5306939116ada7fa79416b7f32a186cf7/src/lib/server/dtek/transform.ts#L39-L56
export function transformBuildingStatus(raw: DtekBuildingStatus): BuildingStatus {
	const result: BuildingStatus = {};

	// Extract schedule group (e.g., "GPV1.2")
	const group = extractScheduleGroup(raw.sub_type_reason);
	if (group) result.group = group;

	// Set outage if API reports active blackout with dates
	if (raw.type && raw.start_date && raw.end_date) {
		result.outage = {
			type: getOutageType(raw.sub_type),
			from: raw.start_date,
			to: raw.end_date,
		};
	}

	return result;
}
```

Add `excerpts:` to the seven `from_scratch` entries' frontmatter:

| file | excerpts |
| --- | --- |
| `redis.md` | `[redis-go/unmarshal.go, redis-go/bulkstring.go]` (replace the single-item list from Task 2) |
| `git.md` | `[git-go/blob.go, git-go/hashobject.go]` |
| `bittorrent.md` | `[bittorrent-go/handshake.go, bittorrent-go/bencode.go]` |
| `dns.md` | `[dns-go/question.go, dns-go/header.go]` |
| `http.md` | `[go_http/headers.go]` |
| `grep.md` | `[grep-go/backreference.go]` |
| `interpreter.md` | `[go-interpreter/repl.go]` |

`store.md` and `better_dtek.md` keep their hero and get no `excerpts`; their excerpt files feed the README showcase only.

- [ ] **Step 5: Showcase list and README line**

Append to `src/site.ts`:
```ts
/** README code showcase: cycles through these excerpts, in order. */
export const showcase = [
  { name: 'redis.go', project: '/projects/from_scratch/redis', file: 'redis-go/unmarshal.go' },
  { name: 'git.go', project: '/projects/from_scratch/git', file: 'git-go/blob.go' },
  { name: 'bittorrent.go', project: '/projects/from_scratch/bittorrent', file: 'bittorrent-go/handshake.go' },
  { name: 'dns.go', project: '/projects/from_scratch/dns', file: 'dns-go/question.go' },
  { name: 'store.lua', project: '/projects/store', file: 'store.nvim/sort.lua' },
  { name: 'better_dtek.ts', project: '/projects/better_dtek', file: 'better-dtek/transform.ts' },
];
```

In `src/readme.ts`, insert `{ kind: 'showcase' },` and a following `{ kind: 'blank' },` right after the blank that follows the "Before that, TypeScript…" paragraph (so the order is: paragraph, blank, showcase, blank, `## Start here`).

- [ ] **Step 6: Cycler and Showcase components**

`src/components/Cycler.astro`:
````astro
---
import Line from './Line.astro';
import { excerptLabel, type Excerpt } from '../lib/excerpts';
import { highlightLines } from '../lib/highlight';
import { padTo } from '../lib/typing';

interface Snippet { excerpt: Excerpt; project?: { name: string; href: string } }
interface Props { snippets: Snippet[]; fenced?: boolean }
const { snippets, fenced = false } = Astro.props;
if (snippets.length === 0) throw new Error('Cycler needs at least one snippet');

const rendered = await Promise.all(
  snippets.map(async (s) => ({ ...s, lines: await highlightLines(s.excerpt.code, s.excerpt.lang) })),
);
const max = Math.max(...rendered.map((r) => r.lines.length));
const first = rendered[0];
const rows = padTo(first.lines, max, '');
const fence = '```';
---
<code-cycler data-count={rendered.length}>
  {fenced && <Line cls="punct"><span data-fence>{fence + first.excerpt.lang}</span></Line>}
  <Line cls="src">
    {first.project && (
      <>
        <a data-project href={first.project.href}>{first.project.name}</a>
        <span class="punct"> › </span>
      </>
    )}
    <a data-src href={first.excerpt.permalink} target="_blank" rel="noopener">{excerptLabel(first.excerpt)}</a>
  </Line>
  <Line />
  <div class="code" data-live>
    {rows.map((html) => (
      <div class="ln"><span class="nr"></span><div class="tx" set:html={html}></div></div>
    ))}
  </div>
  {fenced && <Line cls="punct">{fence}</Line>}
  {rendered.map((r) => (
    <template
      data-snippet
      data-lang={r.excerpt.lang}
      data-label={excerptLabel(r.excerpt)}
      data-href={r.excerpt.permalink}
      data-project-name={r.project?.name}
      data-project-href={r.project?.href}
    >
      {r.lines.map((html) => <div set:html={html}></div>)}
    </template>
  ))}
</code-cycler>
````

`src/components/Showcase.astro`:
```astro
---
import Cycler from './Cycler.astro';
import { showcase } from '../site';
import { loadExcerpt } from '../lib/excerpt-files';
const snippets = showcase.map((s) => ({ excerpt: loadExcerpt(s.file), project: { name: s.name, href: s.project } }));
---
<Cycler snippets={snippets} fenced />
```

In `src/components/Readme.astro`, import `Showcase` and change the `showcase` branch to `return <Showcase />;`.

In `src/pages/projects/[...slug].astro`, import `Cycler` and `loadExcerpt`, and replace the Pane slot content with:
```astro
    {d.excerpts.length > 0 ? (
      <Cycler snippets={d.excerpts.map((f) => ({ excerpt: loadExcerpt(f) }))} />
    ) : (
      d.hero && <Hero hero={d.hero} alt={d.title} />
    )}
```
Do the same in `src/pages/elsewhere/[...slug].astro`.

- [ ] **Step 7: The custom element**

`src/scripts/cycler.ts`:
```ts
import { HOLD_MS, lineStarts, nextDelay } from '../lib/typing';

interface Snippet {
  lang: string;
  label: string;
  href: string;
  projectName?: string;
  projectHref?: string;
  lines: string[];
}

interface TextRef {
  node: Text;
  full: string;
}

class CodeCycler extends HTMLElement {
  private snippets: Snippet[] = [];
  private index = 0;
  private timer: number | undefined;
  private paused = false;
  private visible = true;
  private refs: TextRef[] = [];
  private starts = new Set<number>();
  private total = 0;
  private n = 0;
  private caret = document.createElement('span');
  private io: IntersectionObserver | undefined;
  private onVis = () => this.setPaused(document.visibilityState === 'hidden' || !this.visible);

  connectedCallback() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.snippets = [...this.querySelectorAll<HTMLTemplateElement>('template[data-snippet]')].map((t) => ({
      lang: t.dataset.lang ?? '',
      label: t.dataset.label ?? '',
      href: t.dataset.href ?? '#',
      projectName: t.dataset.projectName,
      projectHref: t.dataset.projectHref,
      lines: [...t.content.children].map((c) => c.innerHTML),
    }));
    if (this.snippets.length === 0) return;
    this.caret.className = 'caret';
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      this.onVis();
    });
    this.io.observe(this);
    document.addEventListener('visibilitychange', this.onVis);
    this.load(0);
    this.n = 0;
    this.show(0);
    this.tick();
  }

  disconnectedCallback() {
    clearTimeout(this.timer);
    this.io?.disconnect();
    document.removeEventListener('visibilitychange', this.onVis);
  }

  private rows(): HTMLElement[] {
    return [...this.querySelectorAll<HTMLElement>('[data-live] .ln .tx')];
  }

  /** Put snippet `i` into the live rows (full text) and collect its text nodes. */
  private load(i: number) {
    this.index = i;
    const s = this.snippets[i];
    const rows = this.rows();
    rows.forEach((tx, k) => {
      tx.innerHTML = s.lines[k] ?? '';
    });
    const fence = this.querySelector('[data-fence]');
    if (fence) fence.textContent = '```' + s.lang;
    const src = this.querySelector<HTMLAnchorElement>('[data-src]');
    if (src) {
      src.textContent = s.label;
      src.href = s.href;
    }
    const proj = this.querySelector<HTMLAnchorElement>('[data-project]');
    if (proj && s.projectName && s.projectHref) {
      proj.textContent = s.projectName;
      proj.href = s.projectHref;
    }
    this.refs = [];
    const lengths: number[] = [];
    for (const tx of rows) {
      let len = 0;
      const walker = document.createTreeWalker(tx, NodeFilter.SHOW_TEXT);
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const t = node as Text;
        this.refs.push({ node: t, full: t.data });
        len += t.data.length;
      }
      lengths.push(len);
    }
    this.starts = lineStarts(lengths);
    this.total = lengths.reduce((a, b) => a + b, 0);
  }

  /** Reveal the first `n` characters across all text nodes and park the caret after the last one. */
  private show(n: number) {
    let left = n;
    let last: Text | null = null;
    for (const r of this.refs) {
      const take = Math.max(0, Math.min(r.full.length, left));
      r.node.data = r.full.slice(0, take);
      if (take > 0) last = r.node;
      left -= r.full.length;
    }
    this.caret.remove();
    if (last) last.after(this.caret);
    else this.rows()[0]?.prepend(this.caret);
  }

  private tick = () => {
    if (this.paused) return;
    if (this.n >= this.total) {
      this.timer = window.setTimeout(this.next, HOLD_MS);
      return;
    }
    this.n += 1;
    this.show(this.n);
    this.timer = window.setTimeout(this.tick, nextDelay(this.starts.has(this.n)));
  };

  private next = () => {
    this.load((this.index + 1) % this.snippets.length);
    this.n = 0;
    this.show(0);
    this.tick();
  };

  private setPaused(p: boolean) {
    if (p === this.paused) return;
    this.paused = p;
    if (p) clearTimeout(this.timer);
    else this.tick();
  }
}

if (!customElements.get('code-cycler')) customElements.define('code-cycler', CodeCycler);
```

In `src/layouts/Nvim.astro`, add before `</body>`:
```astro
    <script>
      import '../scripts/cycler';
    </script>
```

Append to `src/styles/global.css`:
```css
/* ---- code cycler ---- */
.ln .tx.src a[data-src] { color: var(--teal); }
.ln .tx.src a[data-project] { color: var(--blue); }
.caret {
  display: inline-block;
  width: 1ch;
  height: calc(var(--lh) - 4px);
  vertical-align: text-bottom;
  background: var(--accent);
  animation: blink 1s steps(2, start) infinite;
}
@keyframes blink { to { visibility: hidden; } }
@media (prefers-reduced-motion: reduce) { .caret { animation: none; } }
```

- [ ] **Step 8: End to end**

`e2e/cycler.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test('the README showcase types code and moves to the next snippet', async ({ page }) => {
  await page.goto('/');
  const cycler = page.locator('code-cycler');
  const src = cycler.locator('a[data-src]');
  const first = await src.textContent();
  expect(first).toContain('redis-go/app/internal/resp/unmarshal.go:7-25');
  await expect(cycler.locator('.caret')).toBeAttached();
  await expect.poll(async () => (await cycler.locator('[data-live]').innerText()).length, { timeout: 15_000 }).toBeGreaterThan(80);
  await expect(src).not.toHaveText(first!, { timeout: 60_000 });
  await expect(cycler.locator('a[data-project]')).toHaveText('git.go');
});

test('reduced motion shows the first snippet complete and still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const live = page.locator('code-cycler [data-live]');
  await expect(live).toContainText('func Parse(r Reader)');
  await expect(live).toContainText('unexpected input');
  await expect(page.locator('code-cycler .caret')).toHaveCount(0);
});

test('a from-scratch project page cycles its own excerpts', async ({ page }) => {
  await page.goto('/projects/from_scratch/dns');
  await expect(page.locator('code-cycler a[data-src]')).toHaveText('dns-go/internal/message/question.go:31-56');
  await expect(page.locator('code-cycler template[data-snippet]')).toHaveCount(2);
  await expect(page.locator('#buffer .tx.media')).toHaveCount(0);
});
```

Update `e2e/pages.spec.ts`: the redis test asserted a `.tx.media img`; redis now shows excerpts, so change that assertion to `await expect(page.locator('code-cycler')).toBeVisible();` and add a hero assertion on `/projects/store` instead:
```ts
test('a project without excerpts shows its screenshot', async ({ page }) => {
  await page.goto('/projects/store');
  await expect(page.locator('#buffer .tx.media img')).toBeVisible();
});
```

- [ ] **Step 9: Run everything**

```bash
npm test
npm run check
npm run test:e2e
```
Expected: unit tests pass; e2e passes on both projects (the cycler test takes about 20 seconds). Open the preview and watch the README type the redis `Parse` function with a blinking block caret, hold, then switch to `git.go` with the fence line reading ```` ```go ````.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: real code excerpts typed out by a cycling custom element"
```

---

### Task 8: Keyboard island, command line, `:q` shell, help overlay

**Files:**
- Create: `src/scripts/nvim.ts`, `src/components/Shell.astro`, `src/components/HelpOverlay.astro`, `e2e/keys.spec.ts`
- Modify: `src/layouts/Nvim.astro` (render Shell and HelpOverlay, load the script), `src/styles/global.css` (shell, help, tree cursor)

**Interfaces:**
- Consumes: `gutter` from `src/lib/numbers.ts`; the DOM contract from Task 4 (`#tree .row[data-row]`, `data-folder`, `.children[data-children]`, `.row.sel`, `main#buffer .ln`, `#cmdline[data-hint]`, `nav#sidebar[popover]`).
- Produces: `body[data-pane]` = `tree | buffer`; `body[data-mode="shell"]` while the shell is open; `#shell`, `#help` elements; tree cursor class `tcur`.

- [ ] **Step 1: Shell and help markup**

`src/components/Shell.astro`:
```astro
<section id="shell" hidden aria-label="Terminal">
  <div class="term">
    <div data-shell-log></div>
    <form data-shell-form autocomplete="off">
      <label>
        <span class="prompt">~/oleksandr $ </span>
        <input data-shell-input type="text" spellcheck="false" autocapitalize="off" aria-label="shell command" />
      </label>
    </form>
    <div class="hint">type nvim to come back</div>
  </div>
</section>
```

`src/components/HelpOverlay.astro`:
```astro
<dialog id="help" aria-label="Keys">
  <div class="help-title">keys</div>
  <table>
    <tr><td>j / k</td><td>move the cursor line, or the tree cursor</td></tr>
    <tr><td>h</td><td>focus the tree; in the tree, fold or go to the parent</td></tr>
    <tr><td>l / Enter</td><td>in the tree, unfold or open the file</td></tr>
    <tr><td>gg / G</td><td>first / last line</td></tr>
    <tr><td>:q</td><td>quit to the shell</td></tr>
    <tr><td>:help  ?</td><td>this table</td></tr>
    <tr><td>q / Esc</td><td>close this</td></tr>
  </table>
</dialog>
```

Append to `src/styles/global.css`:
```css
/* ---- shell mode and help ---- */
#shell { height: 100dvh; padding: var(--lh) 2ch; color: var(--fg); background: var(--bg); cursor: text; }
#shell .term { max-width: 90ch; }
#shell label { display: flex; }
#shell .prompt { color: var(--green); white-space: pre; }
#shell input { font: inherit; color: var(--fg); background: transparent; border: 0; outline: 0; padding: 0; flex: 1; }
#shell [data-shell-log] div { color: var(--muted); white-space: pre-wrap; }
#shell .hint { color: var(--faint); margin-top: var(--lh); }
#help { font: inherit; color: var(--fg); background: var(--bar); border: 1px solid var(--faint); padding: var(--lh) 2ch; max-width: 70ch; }
#help::backdrop { background: rgb(0 0 0 / 0.5); }
#help .help-title { color: var(--accent); margin-bottom: var(--lh); }
#help table { border-collapse: collapse; }
#help td { padding: 0 2ch 0 0; vertical-align: top; }
#help td:first-child { color: var(--blue); white-space: nowrap; }
```

- [ ] **Step 2: The island**

`src/scripts/nvim.ts`:
```ts
import { gutter } from '../lib/numbers';

type Pane = 'tree' | 'buffer';

const state = { pane: 'buffer' as Pane, tree: 0, buf: 0, pendingG: false };
let msgTimer: number | undefined;

const $ = <T extends Element>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

/* ---------- panes ---------- */

function treeRows(): HTMLElement[] {
  return $$<HTMLElement>('#tree [data-row]').filter((r) => !r.closest('.children[hidden]'));
}

function bufLines(): HTMLElement[] {
  return $$<HTMLElement>('#buffer .ln');
}

function setBuf(i: number) {
  const lines = bufLines();
  if (lines.length === 0) return;
  state.buf = Math.min(Math.max(0, i), lines.length - 1);
  const labels = gutter(state.buf + 1, lines.length);
  lines.forEach((ln, k) => {
    ln.classList.toggle('cur', k === state.buf);
    const nr = ln.querySelector('.nr');
    if (nr) nr.textContent = labels[k];
  });
  lines[state.buf].scrollIntoView({ block: 'nearest' });
}

function setTree(i: number) {
  const rows = treeRows();
  if (rows.length === 0) return;
  state.tree = Math.min(Math.max(0, i), rows.length - 1);
  $$('#tree .tcur').forEach((r) => r.classList.remove('tcur'));
  rows[state.tree].classList.add('tcur');
  rows[state.tree].scrollIntoView({ block: 'nearest' });
}

function setPane(p: Pane) {
  state.pane = p;
  document.body.dataset.pane = p;
  if (p === 'tree') setTree(state.tree);
}

/* ---------- tree ---------- */

function toggleFold(row: HTMLElement, fold?: boolean) {
  const path = row.dataset.folder;
  if (!path) return;
  const kids = $<HTMLElement>(`#tree [data-children="${path}"]`);
  if (!kids) return;
  const willFold = fold ?? !kids.hidden;
  kids.hidden = willFold;
  row.toggleAttribute('data-folded', willFold);
  const chev = row.querySelector('.chev');
  if (chev) chev.textContent = willFold ? '>' : 'v';
}

function openRow(row: HTMLElement) {
  if (row.dataset.folder) {
    toggleFold(row);
    return;
  }
  row.querySelector<HTMLAnchorElement>('a')?.click();
}

function parentRow(row: HTMLElement): HTMLElement | null {
  const kids = row.closest<HTMLElement>('.children');
  if (!kids) return null;
  return $<HTMLElement>(`#tree [data-folder="${kids.dataset.children}"]`);
}

function markCurrentFile() {
  const here = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');
  $$('#tree .row.sel').forEach((r) => r.classList.remove('sel'));
  const row = $$<HTMLElement>('#tree .row.file').find((r) => r.querySelector('a')?.getAttribute('href') === here);
  if (!row) {
    state.tree = 0;
    return;
  }
  row.classList.add('sel');
  let kids = row.closest<HTMLElement>('.children');
  while (kids) {
    const folder = $<HTMLElement>(`#tree [data-folder="${kids.dataset.children}"]`);
    if (folder) toggleFold(folder, false);
    kids = folder?.closest<HTMLElement>('.children') ?? null;
  }
  state.tree = Math.max(0, treeRows().indexOf(row));
}

/* ---------- command line ---------- */

function cmdline(): HTMLElement {
  return $<HTMLElement>('#cmdline')!;
}

function resetCmdline() {
  const el = cmdline();
  el.classList.remove('err');
  el.textContent = el.dataset.hint ?? '';
}

function message(text: string, err = false) {
  const el = cmdline();
  el.classList.toggle('err', err);
  el.textContent = text;
  clearTimeout(msgTimer);
  msgTimer = window.setTimeout(resetCmdline, 2500);
}

function openCmdline() {
  const el = cmdline();
  clearTimeout(msgTimer);
  el.classList.remove('err');
  el.textContent = ':';
  const input = document.createElement('input');
  input.type = 'text';
  input.setAttribute('aria-label', 'command');
  el.append(input);
  input.focus();
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || (e.key === 'Backspace' && input.value === '')) {
      e.preventDefault();
      resetCmdline();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = input.value.trim();
      resetCmdline();
      runCommand(cmd);
    }
  });
}

function runCommand(cmd: string) {
  if (cmd === '') return;
  if (['q', 'q!', 'qa', 'qa!', 'wq', 'x'].includes(cmd)) return enterShell();
  if (cmd === 'h' || cmd === 'help') return openHelp();
  message(`E492: Not an editor command: ${cmd}`, true);
}

/* ---------- help ---------- */

function openHelp() {
  const help = $<HTMLDialogElement>('#help');
  if (help && !help.open) help.showModal();
}

/* ---------- shell ---------- */

function enterShell() {
  const shell = $<HTMLElement>('#shell');
  const app = $<HTMLElement>('#app');
  if (!shell || !app) return;
  app.hidden = true;
  shell.hidden = false;
  document.body.dataset.mode = 'shell';
  $<HTMLInputElement>('[data-shell-input]')?.focus();
}

function leaveShell() {
  const shell = $<HTMLElement>('#shell');
  const app = $<HTMLElement>('#app');
  if (!shell || !app) return;
  shell.hidden = true;
  app.hidden = false;
  delete document.body.dataset.mode;
  const input = $<HTMLInputElement>('[data-shell-input]');
  if (input) input.value = '';
  const log = $<HTMLElement>('[data-shell-log]');
  if (log) log.innerHTML = '';
}

function bindShell() {
  const shell = $<HTMLElement>('#shell');
  if (!shell || shell.dataset.bound) return;
  shell.dataset.bound = '';
  shell.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('input')) return;
    leaveShell();
  });
  $<HTMLFormElement>('[data-shell-form]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $<HTMLInputElement>('[data-shell-input]')!;
    const v = input.value.trim();
    if (['nvim', 'vim', 'vi', 'nvim .'].includes(v)) return leaveShell();
    const log = $<HTMLElement>('[data-shell-log]')!;
    const echo = document.createElement('div');
    echo.textContent = `~/oleksandr $ ${v}`;
    log.append(echo);
    if (v !== '') {
      const err = document.createElement('div');
      err.textContent = `zsh: command not found: ${v.split(' ')[0]}`;
      log.append(err);
    }
    input.value = '';
  });
}

/* ---------- drawer (phone) ---------- */

function closeDrawer() {
  const sidebar = $<HTMLElement & { hidePopover?: () => void }>('#sidebar');
  try {
    if (sidebar?.matches(':popover-open')) sidebar.hidePopover?.();
  } catch {
    /* popover unsupported: nothing to close */
  }
}

/* ---------- keys ---------- */

function onKey(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const target = e.target as HTMLElement;
  if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
  if (document.body.dataset.mode === 'shell') return;
  const help = $<HTMLDialogElement>('#help');
  if (help?.open) {
    if (e.key === 'q' || e.key === 'Escape') help.close();
    return;
  }
  const k = e.key;
  if (k === ':') {
    e.preventDefault();
    openCmdline();
    return;
  }
  if (k === '?') {
    e.preventDefault();
    openHelp();
    return;
  }
  if (k === 'g') {
    if (state.pendingG) {
      state.pendingG = false;
      e.preventDefault();
      state.pane === 'tree' ? setTree(0) : setBuf(0);
    } else {
      state.pendingG = true;
    }
    return;
  }
  state.pendingG = false;
  if (k === 'G') {
    e.preventDefault();
    state.pane === 'tree' ? setTree(Number.MAX_SAFE_INTEGER) : setBuf(Number.MAX_SAFE_INTEGER);
    return;
  }
  if (state.pane === 'tree') {
    const row = treeRows()[state.tree];
    switch (k) {
      case 'j': e.preventDefault(); setTree(state.tree + 1); break;
      case 'k': e.preventDefault(); setTree(state.tree - 1); break;
      case 'l':
        e.preventDefault();
        if (row?.dataset.folder) toggleFold(row, false);
        else if (row) openRow(row);
        break;
      case 'Enter': e.preventDefault(); if (row) openRow(row); break;
      case 'h': {
        e.preventDefault();
        if (row?.dataset.folder && !row.hasAttribute('data-folded')) {
          toggleFold(row, true);
        } else {
          const p = row && parentRow(row);
          if (p) setTree(treeRows().indexOf(p));
        }
        break;
      }
      case 'Escape': setPane('buffer'); break;
    }
  } else {
    switch (k) {
      case 'j': e.preventDefault(); setBuf(state.buf + 1); break;
      case 'k': e.preventDefault(); setBuf(state.buf - 1); break;
      case 'h': e.preventDefault(); setPane('tree'); break;
    }
  }
}

/* ---------- wiring ---------- */

function bindSidebar() {
  const sidebar = $<HTMLElement>('#sidebar');
  if (!sidebar || sidebar.dataset.bound) return;
  sidebar.dataset.bound = '';
  sidebar.addEventListener('click', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('.row');
    if (!row) return;
    if (row.dataset.folder) {
      toggleFold(row);
      return;
    }
    if (!(e.target as HTMLElement).closest('a')) row.querySelector<HTMLAnchorElement>('a')?.click();
  });
  sidebar.addEventListener('toggle', (e) => {
    if ((e as ToggleEvent).newState === 'open') $<HTMLElement>('#tree .row.sel')?.scrollIntoView({ block: 'center' });
  });
}

function initPage() {
  bindSidebar();
  bindShell();
  markCurrentFile();
  state.buf = 0;
  setBuf(0);
  setPane('buffer');
  closeDrawer();
}

declare global {
  interface Window { __nvimBound?: boolean }
}

if (!window.__nvimBound) {
  window.__nvimBound = true;
  document.addEventListener('keydown', onKey);
  document.addEventListener('astro:page-load', initPage);
  if (document.readyState !== 'loading') initPage();
  else document.addEventListener('DOMContentLoaded', initPage, { once: true });
}
```

In `src/layouts/Nvim.astro`: import `Shell` and `HelpOverlay`, render `<Shell />` and `<HelpOverlay />` as siblings right after `</div>` closing `#app`, and add `import '../scripts/nvim';` to the existing `<script>` block (after the cycler import).

- [ ] **Step 3: End to end**

`e2e/keys.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test.skip(({ isMobile }) => isMobile, 'the keyboard layer is desktop only');

test('j/k move the cursor and relative numbers follow', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('j');
  await page.keyboard.press('j');
  await page.keyboard.press('j');
  const lines = page.locator('#buffer .ln');
  await expect(lines.nth(3)).toHaveClass(/cur/);
  await expect(lines.nth(3).locator('.nr')).toHaveText('4');
  await expect(lines.nth(0).locator('.nr')).toHaveText('3');
  await expect(lines.nth(2).locator('.nr')).toHaveText('1');
  await expect(lines.nth(4).locator('.nr')).toHaveText('1');
  await page.keyboard.press('k');
  await expect(lines.nth(2)).toHaveClass(/cur/);
  await expect(lines.nth(2).locator('.nr')).toHaveText('3');
  await page.keyboard.press('G');
  await expect(lines.last()).toHaveClass(/cur/);
  await page.keyboard.type('gg');
  await expect(lines.first()).toHaveClass(/cur/);
});

test('h focuses the tree; k, l, j, Enter unfold elsewhere and open a file', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('h');
  await expect(page.locator('body')).toHaveAttribute('data-pane', 'tree');
  await expect(page.locator('#tree .row.tcur .name')).toHaveText('README.md');
  await page.keyboard.press('k');
  await expect(page.locator('#tree .row.tcur .name')).toHaveText('elsewhere');
  await page.keyboard.press('l');
  await expect(page.locator('#tree [data-children="elsewhere"]')).toBeVisible();
  await page.keyboard.press('j');
  await expect(page.locator('#tree .row.tcur .name')).toHaveText('advent_of_code.go');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/elsewhere\/advent_of_code$/);
  await expect(page.locator('#tree .row.sel .name')).toHaveText('advent_of_code.go');
  await expect(page.locator('body')).toHaveAttribute('data-pane', 'buffer');
  await expect(page.locator('#buffer .ln').first()).toHaveClass(/cur/);
});

test('h on an open folder folds it, h on a file goes to its folder', async ({ page }) => {
  await page.goto('/projects/from_scratch/redis');
  await page.keyboard.press('h');
  await expect(page.locator('#tree .row.tcur .name')).toHaveText('redis.go');
  await page.keyboard.press('h');
  await expect(page.locator('#tree .row.tcur .name')).toHaveText('from_scratch');
  await page.keyboard.press('h');
  await expect(page.locator('#tree [data-children="projects/from_scratch"]')).toBeHidden();
  await page.keyboard.press('l');
  await expect(page.locator('#tree [data-children="projects/from_scratch"]')).toBeVisible();
});

test(':q drops to a shell and nvim returns to the same page', async ({ page }) => {
  await page.goto('/projects/from_scratch/redis');
  await page.keyboard.press(':');
  await page.keyboard.type('q');
  await page.keyboard.press('Enter');
  await expect(page.locator('#shell')).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
  await page.keyboard.type('ls');
  await page.keyboard.press('Enter');
  await expect(page.locator('#shell')).toContainText('zsh: command not found: ls');
  await page.keyboard.type('nvim');
  await page.keyboard.press('Enter');
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('#buffer .ln').first()).toContainText('Redis');
});

test('unknown commands show E492, ? opens help', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press(':');
  await page.keyboard.type('wat');
  await page.keyboard.press('Enter');
  await expect(page.locator('#cmdline')).toHaveText('E492: Not an editor command: wat');
  await expect(page.locator('#cmdline')).toHaveText('hjkl to move · Enter to open · :q to quit', { timeout: 5000 });
  await page.keyboard.press('?');
  await expect(page.locator('#help')).toBeVisible();
  await page.keyboard.press('q');
  await expect(page.locator('#help')).toBeHidden();
});
```

- [ ] **Step 4: Run and verify**

```bash
npm run check
npm run test:e2e -- keys      # expected: 5 passed on desktop, 5 skipped on phone
npm run test:e2e              # expected: everything green
```
In the preview, press `h`, move with `j`/`k`, open with `Enter`, type `:q`, come back with `nvim`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: vim keys for tree and buffer, command line, :q shell, help overlay"
```

---

### Task 9: Phone layout

**Files:**
- Modify: `src/styles/global.css` (mobile block)
- Create: `e2e/phone.spec.ts`

**Interfaces:**
- Consumes: `#drawer-open` (Winbar), `nav#sidebar[popover]`, `.phone-only`, `.drawer-status`, `.long`/`.short` spans (Statusline, Winbar, CvButton), `.tx.title .links`, `.tx .path`.

- [ ] **Step 1: Mobile styles**

Append to `src/styles/global.css`:
```css
/* ---- phone: one window at a time, the tree is a drawer ---- */
@media (max-width: 899px) {
  :root { --fs: 13px; --lh: 20px; --gutter: 3ch; }
  #app { grid-template-columns: minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) var(--lh); }
  #main { grid-column: 1; }
  #statusline { grid-column: 1; }
  #cmdline { display: none; }
  #sidebar[popover] { display: none; }
  #sidebar[popover]:popover-open {
    display: flex;
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100dvh;
    border: 0;
    z-index: 10;
  }
  .phone-only { display: inline-flex; }
  .drawer-status { display: flex; }
  .drawer-status .mode { background: var(--accent); color: var(--bg); padding: 0 1ch; font-weight: 700; }
  .winbar .crumb .long, #statusline .path .long, .cta .long { display: none; }
  .winbar .crumb .short, #statusline .path .short, .cta .short { display: inline; }
  #statusline .branch, #statusline .arrow { display: none; }
  .ln .tx { padding-right: 1ch; }
  .ln .tx.title .links { flex-basis: 100%; margin-left: 0; }
  .ln .tx .path { display: none; }
  .ln .tx.sub { padding-left: 2ch; }
}
```

- [ ] **Step 2: Phone tests**

`e2e/phone.spec.ts`:
```ts
import { test, expect } from '@playwright/test';

test.skip(({ isMobile }) => !isMobile, 'phone layout only');

test('the tree is a drawer opened from the winbar', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#sidebar')).toBeHidden();
  await expect(page.locator('#drawer-open')).toHaveText('≡');
  await page.locator('#drawer-open').click();
  await expect(page.locator('#sidebar')).toBeVisible();
  await expect(page.locator('.drawer-status')).toContainText('files');
  await page.locator('#tree a', { hasText: 'redis.go' }).click();
  await expect(page).toHaveURL(/from_scratch\/redis$/);
  await expect(page.locator('#sidebar')).toBeHidden();
  await expect(page.locator('#drawer-open')).toHaveText('<');
  await expect(page.locator('#main .winbar .crumb .short')).toHaveText('from_scratch');
});

test('the page never scrolls sideways', async ({ page }) => {
  for (const url of ['/', '/projects/from_scratch/dns', '/projects/openai_chat']) {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, url).toBeLessThanOrEqual(0);
  }
});

test('bracket links sit under the title and the statusline path is short', async ({ page }) => {
  await page.goto('/projects/acapulko');
  const title = page.locator('#buffer .ln').first();
  const titleBox = await title.locator('span').first().boundingBox();
  const linksBox = await title.locator('.links').boundingBox();
  expect(linksBox!.y).toBeGreaterThan(titleBox!.y + titleBox!.height - 1);
  await expect(page.locator('#statusline .path .short')).toHaveText('.../projects/acapulko.go');
});
```

- [ ] **Step 3: Run**

```bash
npm run test:e2e -- phone     # expected: 3 passed on phone, 3 skipped on desktop
npm run test:e2e              # expected: all green
```
Open the preview with the browser's device toolbar at 390 wide: README fills the screen, `≡` opens the full-screen tree, tapping a file closes it, the code block on a project page scrolls sideways inside the pane.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: phone layout with the tree as a full-screen drawer"
```

---

### Task 10: SEO, static assets, deploy preparation, docs

**Files:**
- Create: `public/favicon.svg`, `public/robots.txt`, `public/_headers`, `public/_redirects`, `public/og.png`, `README.md`
- Modify: `src/layouts/Nvim.astro` (Open Graph and Twitter tags)

**Interfaces:**
- Consumes: `SITE` from `src/site.ts`.
- Produces: a `dist/` that Cloudflare Pages can serve as-is, and the phase 2 checklist in `README.md`.

- [ ] **Step 1: Static files**

`public/favicon.svg` (a block cursor):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#1e1e2e"/><rect x="5" y="3" width="6" height="10" fill="#f9e2af"/></svg>
```

`public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://oleksandrp.com/sitemap-index.xml
```

`public/_headers`:
```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable
/videos/*
  Cache-Control: public, max-age=604800
/cv/*
  Cache-Control: public, max-age=86400
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

`public/_redirects`:
```
# www to apex. Requires www.oleksandrp.com to be attached as a second custom domain (README, phase 2).
https://www.oleksandrp.com/* https://oleksandrp.com/:splat 301
```

- [ ] **Step 2: Open Graph tags**

In `src/layouts/Nvim.astro` `<head>`, after the canonical link:
```astro
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content={SITE.name} />
    <meta property="og:title" content={fullTitle} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={new URL(current, Astro.site)} />
    <meta property="og:image" content={new URL('/og.png', Astro.site)} />
    <meta name="twitter:card" content="summary_large_image" />
```

- [ ] **Step 3: The OG image**

Build, preview, and screenshot the landing page at 1200×630 with the Chrome already on this machine:
```bash
npm run build
npm run preview -- --port 4321 &
sleep 2
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1200,630 --screenshot=public/og.png http://localhost:4321/
kill %1
ls -la public/og.png    # expected: a PNG around 100-200 KB
```
Open `public/og.png` and check it shows the tree and README (the cycler is caught mid-typing, which is fine).

- [ ] **Step 4: Repository README**

`README.md`:
````md
# oleksandrp.com

Oleksandr Popov's portfolio, rendered as a Neovim workspace. Astro, static, deployed on Cloudflare Pages.

## Run

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # dist/
npm run preview
npm run check      # astro check
npm test           # vitest
npm run test:e2e   # playwright (builds and previews on its own)
```

Node 24 (`.nvmrc`). Playwright needs `npx playwright install chromium` once.

## Add a project

1. Create `src/content/projects/<slug>.md`, or `src/content/projects/from_scratch/<slug>.md` for a from-scratch build. The folder is the tree folder; `<slug>` plus the extension for `lang` is the file name shown.
2. Frontmatter: `title`, `lang` (`go|lua|ts|js|sh|md`), `order` (sort within the folder), optional `repo` (`owner/name`), optional `live` URL, `tags`, optional `hero` (`type: image` with `src: ./<slug>.png` beside the file, or `type: video` with a `/videos/…` path), optional `excerpts`.
3. Body: the description, paragraphs separated by blank lines.

## Add a code excerpt

1. Copy the lines verbatim into `src/excerpts/<repo>/<name>.<ext>`.
2. Make the first line a comment holding the GitHub permalink with a line range, e.g. `// https://github.com/alex-popov-tech/redis-go/blob/<sha>/app/internal/resp/unmarshal.go#L7-L25`. The header of the block is built from it.
3. List the file under `excerpts:` in the project's frontmatter, or add it to `showcase` in `src/site.ts` for the README.

Excerpts win over `hero` on a project page.

## Add a job

`src/content/work/<slug>.md` with `title`, `role`, `from`, `to`, `order`, `tags`, optional `shipped` (list of `{ title, repo?, live?, tags, description }`). Body: what you owned there.

## Add a CV

Drop `public/cv/<name>.pdf` and map it in `src/cv.json`: `{ "<name>.pdf": "<label>" }`. One file makes the button a direct download; several make it a menu and add a `cv/` folder to the tree. No files, no button.

## Theme

`src/styles/theme.css` holds the palette (Gruvbox is there, commented out). The Shiki theme is set in `astro.config.mjs` and `src/lib/highlight.ts`.

## Deploy (phase 2)

Cloudflare Pages, Git integration. The zone `oleksandrp.com` already lives on Cloudflare.

1. `gh repo create alex-popov-tech/portfolio_v2 --public --source . --push`
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo. Build command `npm run build`, output directory `dist`, Node version `24` (environment variable `NODE_VERSION=24`).
3. After the first deploy, Custom domains → add `oleksandrp.com`, then add `www.oleksandrp.com`. Cloudflare creates the DNS records itself.
4. Check: `https://oleksandrp.com/projects/from_scratch/redis` loads with no redirect, `https://www.oleksandrp.com/` redirects to the apex, `/nope` shows the nvim 404.

Every push to `main` deploys. Pull requests get preview URLs. Changes are live on the edge within a minute; only the first DNS record can take longer.
````

- [ ] **Step 5: Final verification**

```bash
npm run check
npm test
npm run build
npm run test:e2e
ls dist/_headers dist/_redirects dist/robots.txt dist/og.png dist/favicon.svg dist/sitemap-index.xml dist/404.html
grep -o 'og:image" content="[^"]*"' dist/index.html    # expected: https://oleksandrp.com/og.png
```
Expected: all commands succeed, every listed file exists.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: og image, favicon, robots, cloudflare headers and redirects, README"
```

---

### Task 11 (optional, last): talk_to_me.lua

Blocked until `/Users/alex/me/pet/talk-to-me.nvim` is pushed to GitHub. Its README currently names the plugin `stt-whisper.nvim` and the Lua module `stt_whisper`; use whatever the published repository is called.

**Files:**
- Create: `src/content/projects/talk_to_me.md`

- [ ] **Step 1: Confirm the repo exists**

```bash
gh repo view alex-popov-tech/talk-to-me.nvim --json url    # or the published name
```

- [ ] **Step 2: Add the entry**

`src/content/projects/talk_to_me.md` (the description is the first paragraph of the plugin's README):
```md
---
title: talk-to-me.nvim
lang: lua
order: 8
repo: alex-popov-tech/talk-to-me.nvim
tags: [Lua, Neovim, whisper.cpp, ffmpeg]
---
Local-first speech-to-text dictation for Neovim powered by whisper.cpp. The plugin records audio with ffmpeg, transcribes it offline, and inserts the text into your buffer.
```
Bump `order` of `lastpass.md` and everything after it by one so the tree keeps its sequence.

- [ ] **Step 3: Verify and commit**

```bash
npm run build && npm run test:e2e
git add -A
git commit -m "content: add talk-to-me.nvim"
```
