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

## What is tested, and what is not

The unit tests carry the weight: pure functions for the file tree, line numbering, prose
wrapping, excerpt parsing, sprite mirroring, wheel-frame direction and the flow diagram's
state machine. They are fast, stable, and cover the things eyeballing cannot settle — whether
the wheel cycle runs the same direction both ways is not a question a screenshot answers.

The e2e suite is deliberately four tests. Everything visual or behavioural is checked by hand,
which is what actually catches bugs here; every animation bug this project has had was found
by looking at it, never by an assertion. So `e2e/guards.spec.ts` covers only failures that are
*silent*: an overlay quietly eating clicks, `prefers-reduced-motion` being ignored, a
fixed-width block widening the page at a viewport nobody owns, and routing config that breaks
on an Astro upgrade without changing how any page looks.

Do not add e2e tests that assert how something is implemented or how it looks. They churn on
every visual change and have never caught anything.

## Add a project

1. Create `src/content/projects/<slug>.md`, or `src/content/projects/from_scratch/<slug>.md` for a from-scratch build. The folder is the tree folder; `<slug>` plus the extension for `lang` is the file name shown.
2. Frontmatter: `title`, `lang` (`go|lua|ts|js|sh|md`), `order` (sort within the folder), optional `repo` (`owner/name`), optional `live` URL, `tags`, `excerpts`, optional `diagram`. A `hero` (`type: image` with `src: ./<slug>.png` beside the file, or `type: video` with a `/videos/…` path) is still supported by the schema but nothing uses one: every project shows code instead, because a product screenshot is the one thing on the page that is not a terminal.
3. Body: the description, paragraphs separated by blank lines.

## Add a diagram

A project can carry an animated ASCII diagram above its code, opted into with `diagram: <id>`
in its frontmatter. Each one is a pure `render(t)` over a fixed character grid in
`src/lib/diagrams/`, registered in `src/lib/diagrams/index.ts`; that registry is also what the
content schema validates the id against, so a typo fails the build.

`Diagram.astro` draws frame 0 during the build — the picture is real without JavaScript — and
`scripts/diagram.ts` takes over, loading only the renderer that page needs. It animates at
20fps, but only while the block is on screen and the tab is in front, and not at all under
`prefers-reduced-motion`. A frame may return `flags`, which become `data-*` attributes on the
host: that is how acapulko's SVG bulb knows to light up. Diagrams are `.page-effect`, and the
train stays in the shed on any page that has one.

**One glyph, one cell.** A character JetBrains Mono does not carry falls back to another face
at a different advance width and shears the row it sits on — braille (`⠋`) measures 10.26px
against the 9px cell, `⎿` measures 15px. `glyphs.test.ts` holds a whitelist of glyphs measured
in a browser at exactly one cell and fails on anything new, so the check happens before the
diagram ships rather than after someone spots a crooked border.

## Add a margin stream

A project can carry an animated text stream in the right margin of its file view, opted into
with `stream: <id>` in its frontmatter. The seven `from_scratch` projects each have one. Like a
diagram it is a pure `render(t, rows)` over a character grid, in `src/lib/streams/`, registered
in `src/lib/streams/index.ts`; the content schema validates the id against that list, so a typo
fails the build.

Three engines cover all seven: `rain.ts` drops words down fixed lanes — git the object store it
reads and writes, the interpreter what the Monkey lexer emits — three six-column lanes with a
gutter between them, 20 columns wide. `grep.ts` scrolls real `grep -nE` sessions with the
matches lit, 28 columns. `dialog.ts` scrolls a client/server exchange, 30 columns for http and
26 for redis, dns and bittorrent.

A stream is **not** content, and that is the whole difference from a diagram:

- The layout renders it into `#main` beside the train, never through the buffer slot, so it
  never picks up a line number and it inherits the pane's clipping.
- It takes `rows` as an argument and fills whatever pane it is given, so there is no fixed grid
  and **no server-rendered first frame**. Under `prefers-reduced-motion` the page simply has no
  strip: a frozen frame of falling hex is noise, not a picture, so there is nothing worth
  keeping.
- `scripts/stream.ts` measures the pane and shows the strip only where there is room for the
  gutter, the full 80-column prose column, a 2-column gap, the strip's own 2-column inset from
  the pane edge, and its own column count, all at once. It also stands down below a 900px
  viewport outright, without even measuring — the same floor `scripts/train.ts` uses for the
  train, since the phone/drawer layout changes the gutter and font size enough that the column
  math alone would let a strip pass at widths the train never runs at. Below either threshold it
  draws nothing, and because it carries `.page-effect` only while it is actually drawing, the
  train takes the page back.

**Write the copy against the protocol, not from the repo.** These projects are implementations,
not transcripts, so there are no sample sessions to copy — the lines are written by hand, and
they have to be right: true RESP array counts and bulk-string lengths, real DNS records, the
real 16 KiB BitTorrent block size, ERE that grep-go actually supports. The tests in
`src/lib/streams/*.test.ts` check what can be checked mechanically; the rest is on you.

**One glyph, one cell**, exactly as for diagrams — `glyphs.test.ts` covers the streams too.

## Add a code excerpt

1. Copy the lines verbatim into `src/excerpts/<repo>/<name>.<ext>`.
2. Make the first line a comment holding the GitHub permalink with a line range, e.g. `// https://github.com/alex-popov-tech/redis-go/blob/<sha>/app/internal/resp/unmarshal.go#L7-L25`. The header of the block is built from it.
3. List the file under `excerpts:` in the project's frontmatter.

Excerpts win over `hero` on a project page. `src/excerpts/` is excluded from `tsconfig.json` — the files are verbatim fragments, not project source.

## Add a job

`src/content/work/<slug>.md` with `title`, `role`, `from`, `to`, `order`, `tags`, optional `shipped` (list of `{ title, repo?, live?, tags, description }`). Body: what you owned there.

## Add a CV

Drop `public/cv/<name>.pdf` and map it in `src/cv.json`: `{ "<name>.pdf": "<label>" }`. One file makes the button a direct download; several make it a menu and add a `cv/` folder to the tree. No files, no button.

## Icons

The file-tree and statusline icons are real Nerd Font glyphs, not drawings. `src/fonts/symbols-nerd-font-subset.woff2` is Symbols Nerd Font Mono v3.5.1 (MIT, Ryan L McIntyre / ryanoasis/nerd-fonts) subset to the ten codepoints this site uses, and Vite inlines it into the CSS as a data URI. `src/components/Icon.astro` maps a name to a glyph; `.nf-*` rules in `global.css` colour them.

The codepoints are Private Use Area, so they render only with this font — the `@font-face` family is called `NerdIcons` so a Nerd Font installed on the visitor's machine can never be picked up instead, and `font-display: block` shows nothing rather than tofu while it loads.

To add an icon, find its codepoint by glyph name and regenerate the subset:

```sh
# needs fonttools + brotli, and SymbolsNerdFontMono-Regular.ttf from
# https://github.com/ryanoasis/nerd-fonts/releases (NerdFontsSymbolsOnly)
python3 -c "
from fontTools.ttLib import TTFont
cmap = TTFont('SymbolsNerdFontMono-Regular.ttf').getBestCmap()
print([(hex(cp), n) for cp, n in cmap.items() if 'rust' in n])"

pyftsubset SymbolsNerdFontMono-Regular.ttf \
  --unicodes=U+E5FE,U+E5FF,U+E60C,U+E620,U+E628,U+E65E,U+E67D,U+F418,U+F489,U+F48A \
  --flavor=woff2 --layout-features='' --no-hinting --desubroutinize --name-IDs='' \
  --output-file=src/fonts/symbols-nerd-font-subset.woff2
```

### Box drawing and blocks

`src/fonts/jetbrains-mono-symbols-subset.woff2` is JetBrains Mono Variable v2.304 (OFL, see
`src/fonts/JetBrainsMono-OFL.txt`) subset to U+2190-21FF, U+2300-232F, U+2500-25FF and
U+2700-27BF — the arrows, box drawing, blocks, geometric shapes, modifier keys and marks that the diagrams and the tree guides
are drawn with. It is declared as a face of `JetBrains Mono Variable` over those ranges.

This is not decoration, it is what keeps the character grid square. `@fontsource` cuts its
files to their declared unicode-ranges and none of them cover these glyphs, so every browser
was silently falling back to a system font for them: Menlo at 9.031px in Chromium, SF Mono at
9.273px in WebKit, against JetBrains Mono's 9px cell. A 78-column diagram row came out 21px
too wide in Safari and the box borders visibly stepped. In the real font these glyphs are
600/1000 em, exactly like every letter, so the rows now measure to the pixel in both engines.

Note what the font does *not* have: `★`, `⇡`, `⇣` and braille are all absent, so they fall
back and shear their row. Use `✶` and `↑` `↓`. `src/lib/diagrams/glyphs.test.ts` whitelists
what is safe and fails on anything new.

```sh
pyftsubset 'JetBrainsMono[wght].ttf' \
  --unicodes='U+2190-21FF,U+2300-232F,U+2500-25FF,U+2700-27BF' \
  --layout-features='' --no-hinting --desubroutinize --flavor=woff2 \
  --output-file=src/fonts/jetbrains-mono-symbols-subset.woff2
```

Current glyphs: `custom-folder` U+E5FF, `custom-folder_open` U+E5FE, `oct-git_branch` U+F418, `seti-go2` U+E65E, `seti-lua` U+E620, `seti-typescript` U+E628, `seti-javascript` U+E60C, `oct-terminal` U+F489, `oct-markdown` U+F48A, `seti-pdf` U+E67D. The statusline's powerline divider is a CSS `clip-path` triangle rather than a glyph, so it matches the mode block exactly.

## The README session

The landing page is `README.sh`, a zsh session that types itself out: each command is a
section of the bio. `src/readme.ts` holds the content, `src/lib/session.ts` the playback —
a pure `renderSession(t)`, so the build renders the finished transcript (complete without
JavaScript, and to a crawler) and `scripts/session.ts` clears it and replays it.

It plays once per page load: the flag is module state, so it survives a view transition —
coming back to the README from another page does not retype it — but a refresh replays it.
`sessionStorage` was wrong for this; it survives reloads too, so one full watch left the page
dead for the rest of that tab. It does not play at all under `prefers-reduced-motion`.
Clicking the pane replays it on demand. While it plays the pane is a `.page-effect`, which
keeps the train away; when it settles the class comes off and the train runs again.

Rows reflow by default and a phone needs that, so only the rows whose columns mean something
— the language table, the keyboard — are marked `pre`. It is a terminal buffer, so there is
no line-number gutter, the way nvim shows one.

The keyboard is the real GALLIUM layer of `~/me/zmk/zmk-skean/config/skean.keymap`. Only the
eight keys the fingers rest on are amber: the design handoff also lit up `G` and `P`, which
are the index stretch and contradicted its own caption. The `⌃ ⌘ ⌥` sit on the border each
combo spans — every one in the keymap pairs a top-row key with the home key beneath it
(`C`+`S` for control, mirrored to `Y`+`H`), so the glyph goes in that column, between them.

Command lines are coloured the way a shell with syntax highlighting does it, including the
part where the command only turns green once it is a whole word — the line is re-highlighted
on every frame while it is still being typed.

### Recounting the languages

`src/languages.ts` is a snapshot. The sources are not in this repo, so the build cannot count
them — regenerate it by hand with [tokei](https://github.com/XAMPPRocky/tokei) over local
clones of every project this site lists, plus `~/.dotfiles` and all four store.nvim modules.
Count each project separately: a vendored directory in one of them will quietly inflate the
whole table otherwise.

```sh
tokei --output json --hidden \
  --exclude node_modules --exclude vendor --exclude dist --exclude build \
  --exclude .svelte-kit --exclude .vercel --exclude .wrangler --exclude .next \
  --exclude .worktree --exclude .worktrees --exclude .claude --exclude .codecrafters \
  --exclude output --exclude generated_images --exclude package-lock.json \
  --exclude '*_templ.go' <project>
```

`--hidden` matters for `~/.dotfiles`; without it tokei skips the whole repository. The
excludes worth keeping are the git worktrees (`.worktree`, a second copy of the same source)
and templ's generated Go. Sum `code + comments + blanks` per language, fold TSX into
TypeScript, and drop anything that is not a programming language.

## The train

Every minute or two the little train from `sl -l` crosses the buffer, alternating direction
each run. It is an absolutely positioned `<pre>` inside `#main` with `pointer-events: none`,
so it can never swallow a click and is clipped at the pane edges; it picks a random row on
the text grid and steps one column at a time, indexing the wheel pattern by column the way
`sl` does — derive it from distance travelled instead and the drivers spin backwards.

The eastbound run uses `TRAIN_FRAMES_FLIPPED`, the same consist mirrored by `mirrorRow`:
each row reversed with `/ \ ( ) [ ] { } < >` swapped for their mirror images. Without it the
engine would drive in reverse, funnel-last. Mirroring also flips the apparent rotation, so
`frameFor` reverses the eastbound basis to cancel that out — miss it and the drivers spin
backwards in exactly one direction of travel.

Each row carries a plate hugging its ink, filled with `--bg`. That plate is invisible only
because the train stays inside `#main`, which is uniformly `--bg`: it simply overwrites the
text, the way `sl` overwrites a terminal. Two other approaches failed and are worth not
repeating — a `--bg` fill that also crossed the sidebar read as a lighter block against
`--bar`, and dimming with `backdrop-filter` read as a black box (and needs `.train` to carry
no `transform`, or a transformed ancestor becomes a backdrop root and it dims nothing at all).
The train also starts below the cursor line, which is painted `--cursor` and would show a
faint band through the plate.

The next departure is stored in `localStorage` under `sl:next-departure` and polled every ten
seconds rather than armed as one long timer, so browsing between pages does not restart the
wait and a slot falling due while the tab is hidden still departs on the next tick. Add
`?sl=loop` to any URL to run it back to back without waiting.

It stays in the shed under `prefers-reduced-motion` and on screens narrower than the
63-column sprite.

The art in `src/lib/train.ts` is from [`sl`](https://github.com/mtoyoda/sl), the program you
get when you typo `ls`:

> Copyright 1993,1998,2014 Toyoda Masashi (mtoyoda@acm.org)
>
> Everyone is permitted to do anything on this program including copying, modifying, and
> improving, unless you try to pretend that you wrote it. i.e., the above copyright notice
> has to appear in all copies.

It was extracted from `sl.h` by script rather than retyped, so the joins are byte-exact.
Do not hand-edit it.

## Theme

`src/styles/theme.css` holds the palette (Gruvbox is there, commented out). The Shiki theme is set in `astro.config.mjs` and `src/lib/highlight.ts`.

## Deploy (phase 2)

Cloudflare Pages, Git integration. The zone `oleksandrp.com` already lives on Cloudflare.

1. `gh repo create alex-popov-tech/portfolio_v2 --public --source . --push`
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo. Build command `npm run build`, output directory `dist`, Node version `24` (environment variable `NODE_VERSION=24`).
3. After the first deploy, Custom domains → add `oleksandrp.com`, then add `www.oleksandrp.com`. Cloudflare creates the DNS records itself.
4. Check: `https://oleksandrp.com/projects/from_scratch/redis` loads with no redirect, `https://www.oleksandrp.com/` redirects to the apex, `/nope` shows the nvim 404.

Every push to `main` deploys. Pull requests get preview URLs. Changes are live on the edge within a minute; only the first DNS record can take longer.
