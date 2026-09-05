# Portfolio v2 — design

Date: 2026-09-06
Status: approved in conversation, ready for an implementation plan

## What it is

Oleksandr Popov's portfolio, presented as a Neovim workspace: a file tree of
work and projects on the left, a buffer on the right, `README.md` as the
landing view. One theme (Catppuccin Mocha). The design source is `design/`
(mockups, not pixel specs). The site is static, built with Astro, deployed
to Cloudflare Pages at `https://oleksandrp.com`.

Phase 1 delivers a complete local build with everything the deploy needs
already in the repo. Phase 2 is the deploy itself, done with the user.

## Decisions already made

| Topic | Decision |
| --- | --- |
| Framework | Astro (latest, currently 7.x), static output, npm |
| Highlighting | Shiki at build time, theme `catppuccin-mocha` |
| Hosting | Cloudflare Pages via Git integration, DNS already on Cloudflare |
| Domain | `oleksandrp.com` apex |
| First cut | Everything renders, including `[BRACKET]` placeholders for work entries |
| Tree shape | `work/`, `projects/from_scratch/`, other projects flat under `projects/`, `elsewhere/` with Advent of Code only, `cv/` when PDFs exist, `README.md` |
| Removed from mock | `live_sites`, `people_use_it`, `languages.go`, the Startup screen |
| talk_to_me.lua | Local repo at `../talk-to-me.nvim`, not on GitHub. Added as the final optional step, after everything else |
| CV | Several PDFs later (styles and titles). Button becomes a menu and a `cv/` tree folder lists them. Hidden while none exist |
| `:q` | Fake shell prompt, `nvim` or a click returns |
| Line numbers | Relative, driven by a cursor line the user moves with `j`/`k` |

## Content model

The sidebar tree is the content directory. Adding a project is one markdown
file plus optional excerpt files and one image.

```
src/content/projects/from_scratch/redis.md   -> tree: projects/from_scratch/redis.go
src/content/projects/store.md                -> tree: projects/store.lua
src/content/work/lokalise.md                 -> tree: work/lokalise.md
src/content/elsewhere/advent_of_code.md      -> tree: elsewhere/advent_of_code.go
src/excerpts/redis-go/unmarshal.go           -> real source, copied verbatim
public/cv/*.pdf                              -> tree: cv/<name>.pdf
```

Collections use Astro's content layer with the `glob` loader. The entry id
carries the subdirectory, which is how folders are derived. Nothing about
the tree is hard-coded except folder order and which folders start folded.

### Project frontmatter

```yaml
title: A Redis-compatible server, from scratch, in Go   # pane title
lang: go              # go | lua | ts | js | sh | md — icon and extension in the tree
order: 1              # sort within its folder, lower first
repo: alex-popov-tech/redis-go        # optional, renders [github]
live: https://acapulko.oleksandrp.com # optional, renders [live]
tags: [Go, RESP, TCP, Streams, Transactions, Replication, CodeCrafters]
hero:                 # optional, renders a screenshot or video at the bottom
  type: image         # image | video
  src: ./redis.png    # relative to the md file, or /videos/x.mp4 for video
excerpts:             # optional, renders the code cycler at the bottom
  - file: redis-go/unmarshal.go              # under src/excerpts
    source: app/internal/resp/unmarshal.go   # path in the repo, shown as the block header
    lines: 7-22                              # shown in the header, links to the permalink
```

The markdown body is the description, one or more paragraphs.

Bottom block precedence: excerpts if present, else hero if present, else
nothing. This is the "only part that varies" from the mock.

### Work frontmatter

```yaml
title: "[ROLE]"
role: "[ROLE]"
from: "[YYYY]"
to: "[YYYY]"          # or "now"
lang: md
order: 1
tags: ["[THE STACK YOU USED THERE]"]
shipped:              # optional list of things built there
  - title: Mayak
    repo: keenethics/mayak
    live: https://www.mayak.co.ua/
    tags: [Next.js, React, PostgreSQL, Prisma, Docker, Vercel]
    description: A directory of psychological services in Ukraine ...
```

Body: what you owned there, as paragraphs. Placeholders ship as written.

### Excerpts

Real code files under `src/excerpts/<repo>/<name>.<ext>`, copied verbatim
from the project at a known commit. The first line is a comment with the
GitHub permalink so the origin is never lost. They are read at build time
with `import.meta.glob(..., { query: '?raw' })` and highlighted with
Shiki's `codeToHtml`. Because they are real files, an editor highlights and
formats them normally.

The README showcase is a list in `src/site.ts`:

```ts
export const showcase = [
  { project: 'projects/from_scratch/redis', excerpt: 'redis-go/unmarshal.go' },
  ...
]
```

Six entries, one each from redis-go, git-go, bittorrent-go, dns-go,
store.nvim and better-dtek. The plan picks concrete functions.

### The README

The README is the one bespoke page, a component rather than a collection
entry. It shows markdown *source* (the `#`, `##`, `- [text](path)` are
visible) with real links. Content is the copy from `design/gen_v4.py`,
with the `languages.go` line removed and the code showcase inserted as a
fenced block after the summary paragraphs.

### CV

`public/cv/*.pdf` plus `src/content/cv.json` mapping filename to label,
for example `{ "golang.pdf": "Golang developer", "qa.pdf": "QA automation" }`.
With zero files the button and folder do not render. With one, the button
links straight to it. With more, the button opens a small menu listing
labels; the `cv/` folder in the tree lists the same files, each a direct
download link.

## Layout and rendering

One layout, `Nvim.astro`:

- **winbar**: root folder icon + `~/oleksandr` over the sidebar; breadcrumb
  over the buffer; the CV button at the right.
- **sidebar**: the tree. Fixed width in `ch` units (about 38ch on desktop),
  scrolls independently. Rows: chevron, guide lines, icon, name, and a
  count on folders. The current file's row is highlighted.
- **buffer**: fluid width, scrolls independently. Has a gutter of line
  numbers and a cursor line.
- **statusline**: mode block, current path, branch `main`, and at the right
  a key hint (`hjkl · :q`) and `utf-8`.

Typography: JetBrains Mono, self-hosted via `@fontsource-variable/jetbrains-mono`,
ligatures off. Colors are CSS custom properties in `src/styles/theme.css`
copied from the `CATPPUCCIN` dict in `design/gen_v4.py`. Gruvbox is kept
as a second block of variables, commented out, so retheming stays one
edit plus the Shiki theme name in `astro.config`.

### Lines

Every direct child of the buffer is one logical line: a heading, a
paragraph, the tags row, a code line, a blank spacer. Long lines wrap
visually but keep one number, as vim does with `wrap` on. This is what
makes the gutter work at any width. Code lines never wrap; the code block
scrolls sideways.

Relative numbers: the cursor line shows its absolute number in the accent
color with a highlighted background; every other line shows its distance
from the cursor. The server renders the state for cursor at line 1. The
keyboard island re-renders numbers on `j`/`k`.

### Pane template

```
<title>                                   [github]  [live]
<blank>
<description paragraphs>
<blank>
<tags, separated by three spaces>
<blank>
<bottom block: excerpt cycler | hero | nothing>
```

Work entries use the same template: `role` and dates as the title row,
the body as description, `tags` as the tags row, and the `shipped` list as
the bottom block (each item: title, bracket links, description, tags).

### Routes

- `/` README
- `/projects/from_scratch/redis`, `/projects/store`, `/work/lokalise`,
  `/elsewhere/advent_of_code`. Extensionless. Astro `build.format: 'file'`
  and `trailingSlash: 'never'`, so Cloudflare serves `redis.html` at
  `/projects/from_scratch/redis` with no redirect.
- `/404` styled as an nvim error line (`E484: Can't open file <path>`).
- `/sitemap-index.xml` via `@astrojs/sitemap`, `robots.txt`, one static OG
  image, a favicon (SVG, a filled accent-color block cursor).

Navigation uses Astro's `ClientRouter` (view transitions). The sidebar has
`transition:persist` so fold state, scroll position and the tree cursor
survive a page change. Links work with JavaScript disabled.

## Code showcase

A custom element `<code-cycler>` holding one `<template>` per snippet, each
containing Shiki's pre-rendered HTML plus a header (`repo/path:lines`,
linking to the permalink and, on the README, to the project page).

Behavior:

1. Show snippet N's header. Reveal the code by walking its text nodes in
   order and exposing characters at roughly 40 per second with small
   random jitter. A block cursor sits after the last revealed character.
2. When the snippet is complete, hold for about 4 seconds, then move to
   N+1 and start again. Loops forever.
3. The element reserves the height of the longest snippet so the page does
   not shift. Lines that are not yet reached keep their height.
4. Pause when the tab is hidden (`visibilitychange`) or the element is out
   of the viewport (`IntersectionObserver`).
5. With `prefers-reduced-motion: reduce`, or before the script runs, the
   first snippet is shown complete and static. No cycling.

Line numbers inside the block are relative to the buffer cursor like any
other line; the block's lines count as lines of the buffer, sized to the
reserved height.

## Keyboard layer

One island, `src/scripts/nvim.ts`, loaded on every page. No framework.

Focus model: exactly one active pane, tree or buffer. On load the buffer
is active with the cursor at line 1; the tree cursor starts on the current
file.

| Key | Tree | Buffer |
| --- | --- | --- |
| `j` / `k` | move tree cursor | move cursor line, update relative numbers, scroll into view |
| `h` | fold the folder, or jump to the parent folder | focus the tree |
| `l` | unfold a folder, or open a file | nothing |
| `Enter` | open a file (focus moves to the buffer) | nothing |
| `gg` / `G` | first / last row | first / last line |
| `:` | open the command line in the statusline | same |
| `Escape` | close the command line | same |
| `?` | show the key hint in the statusline for a few seconds | same |

Command line: `:q` and `:q!` switch to shell mode. `:help` and `:h` show
the key table as an overlay. Anything else shows `E492: Not an editor
command: <text>` in the statusline for a moment.

Shell mode: the whole page is replaced by a terminal view with
`~/oleksandr $ ` and a blinking block cursor, and a dim hint
`type nvim to come back`. Typing `nvim` + Enter, or any click or tap,
returns to the page that was open. Nothing is persisted.

No Ctrl-based bindings anywhere, browsers own them. Keys are ignored when a
form control or the command line has focus, except the command line's own
handling. Mouse and touch keep working as normal links.

## Phone

Breakpoint at 900px. Below it:

- The sidebar is not shown inline. It is a full-screen drawer using the
  HTML `popover` attribute, opened from the winbar's left icon. On the
  README that icon is a hamburger, on any other page it is a back chevron
  labeled with the parent folder; both open the drawer, scrolled to the
  current file. Tapping a file closes it.
- Drawer winbar reads `~/oleksandr` with a `tap to open` hint at the right;
  its statusline reads `explorer` and the file count.
- The bracket links move to their own line under the title.
- Tags wrap onto several lines.
- Code blocks scroll sideways and never wrap.
- The statusline path is shortened to `.../<folder>/<file>`.
- The CV button label shortens to `Download CV`.
- Font size drops from 15px to 13px.

Between 900px and 1200px the sidebar narrows to about 30ch. Above that it
is 38ch. The buffer is always fluid.

## Deploy preparation (phase 1) and deploy (phase 2)

Phase 1 puts everything in the repo:

- `astro.config.mjs` with `site: 'https://oleksandrp.com'`, static output,
  `build.format: 'file'`, `trailingSlash: 'never'`, sitemap, Shiki theme.
- `public/_headers` with long cache for `/_astro/*`, fonts and `/cv/*`.
- `public/_redirects` empty placeholder with a comment.
- `.github/workflows/ci.yml` running `npm ci`, `npm run check`, `npm run
  build`, unit tests and end to end tests on every push and pull request.
- `.nvmrc` pinned to the current Node (24).
- `README.md` at the repo root: how to add a project, an excerpt, a CV,
  how to run and build, and the Cloudflare setup steps.

Phase 2, with the user:

1. Create the GitHub repository with `gh repo create`, push `main`.
2. In the Cloudflare dashboard, Workers & Pages, create a Pages project
   from that repository: build command `npm run build`, output `dist`,
   Node version from `.nvmrc`.
3. Add `oleksandrp.com` as a custom domain. Cloudflare writes the DNS
   record itself since the zone is already there.
4. Verify: apex resolves, `www` redirects to apex, `/projects/from_scratch/redis`
   loads without a redirect, the CV menu is hidden, 404 works.

Re-deploy model: every push to `main` builds and publishes; pull requests
get preview URLs. Propagation is immediate on Cloudflare's edge; only the
first DNS record takes minutes.

## Testing

- **Vitest** for pure functions: building the tree from collection entries
  (folder derivation, ordering, counts, fold defaults, display names from
  `lang`), relative number computation, the typing scheduler (given a
  snippet and a time, which characters are revealed), CV menu shape from
  the manifest.
- **Playwright** against `astro preview`: landing renders the README with
  cursor on line 1; `j` three times shows `3` as the cursor number and the
  numbers above read `1 2 3`; `h` then `j` `Enter` opens the next tree
  item; `:q` shows the shell prompt and `nvim` Enter restores; at 390px
  the drawer opens from the icon and closes on tap; a code block does not
  widen the page.
- `astro check` for types and `npm run build` must pass in CI.

## Out of scope for this spec

- talk_to_me.lua (postponed to the last step, needs the repo published).
- nvim-mcp, snap.nvim, selenoid-manager, toundra: candidates for later,
  each is one content file.
- Building the CV PDFs from the Recruiter page.
- A light theme or a theme switcher.
- Analytics.
