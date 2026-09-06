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

Excerpts win over `hero` on a project page. `src/excerpts/` is excluded from `tsconfig.json` — the files are verbatim fragments, not project source.

## Add a job

`src/content/work/<slug>.md` with `title`, `role`, `from`, `to`, `order`, `tags`, optional `shipped` (list of `{ title, repo?, live?, tags, description }`). Body: what you owned there.

## Add a CV

Drop `public/cv/<name>.pdf` and map it in `src/cv.json`: `{ "<name>.pdf": "<label>" }`. One file makes the button a direct download; several make it a menu and add a `cv/` folder to the tree. No files, no button.

## Icons

The file-tree and statusline icons are real Nerd Font glyphs, not drawings. `src/fonts/symbols-nerd-font-subset.woff2` is Symbols Nerd Font Mono v3.5.1 (MIT, Ryan L McIntyre / ryanoasis/nerd-fonts) subset to the twelve codepoints this site uses, and Vite inlines it into the CSS as a data URI. `src/components/Icon.astro` maps a name to a glyph; `.nf-*` rules in `global.css` colour them.

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
  --unicodes=U+E0B0,U+E5FE,U+E5FF,U+E60C,U+E620,U+E628,U+E65E,U+E67D,U+EA7B,U+F418,U+F489,U+F48A \
  --flavor=woff2 --layout-features='' --no-hinting --desubroutinize --name-IDs='' \
  --output-file=src/fonts/symbols-nerd-font-subset.woff2
```

Current glyphs: `custom-folder` U+E5FF, `custom-folder_open` U+E5FE, `cod-file` U+EA7B, `oct-git_branch` U+F418, `seti-go2` U+E65E, `seti-lua` U+E620, `seti-typescript` U+E628, `seti-javascript` U+E60C, `oct-terminal` U+F489, `oct-markdown` U+F48A, `seti-pdf` U+E67D, `pl-left_hard_divider` U+E0B0.

## Theme

`src/styles/theme.css` holds the palette (Gruvbox is there, commented out). The Shiki theme is set in `astro.config.mjs` and `src/lib/highlight.ts`.

## Deploy (phase 2)

Cloudflare Pages, Git integration. The zone `oleksandrp.com` already lives on Cloudflare.

1. `gh repo create alex-popov-tech/portfolio_v2 --public --source . --push`
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo. Build command `npm run build`, output directory `dist`, Node version `24` (environment variable `NODE_VERSION=24`).
3. After the first deploy, Custom domains → add `oleksandrp.com`, then add `www.oleksandrp.com`. Cloudflare creates the DNS records itself.
4. Check: `https://oleksandrp.com/projects/from_scratch/redis` loads with no redirect, `https://www.oleksandrp.com/` redirects to the apex, `/nope` shows the nvim 404.

Every push to `main` deploys. Pull requests get preview URLs. Changes are live on the edge within a minute; only the first DNS record can take longer.
