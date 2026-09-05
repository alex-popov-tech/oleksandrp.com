# Portfolio v2 — design source

The portfolio mocked up as a Neovim workspace: a file tree of work and
projects on the left, a scrollable buffer on the right, `README.md` at the
repo root as the landing view.

## What matters here

| file | what it is |
| --- | --- |
| `gen_v4.py` | the generator. Edit this, not the artboards. |
| `canvas.json` | canvas layout: which artboard sits where, plus the notes |
| `gen_mobile.py` | the phone generator. Imports the theme and icons from `gen_v4.py`. |
| `Main.dc.html` | README, what opens first |
| `Open.dc.html` | anything open, the one template for projects and jobs alike |
| `Phone*.dc.html` | the same two screens at 390px, plus the tree as a drawer |
| `oleksandr-popov-portfolio.html` | the whole canvas, built. Open in a browser to view and export. |

## Rebuild

```sh
python3 gen_v4.py       # desktop
python3 gen_mobile.py   # phone
```

Then reassemble the canvas with the design skill's helper:

```sh
node "<skill dir>/seed-canvas.mjs" \
  --template "<skill dir>/payload.template.html" \
  --out oleksandr-popov-portfolio.html \
  --title "Oleksandr Popov Portfolio" \
  --artboard Main.dc.html --artboard Open.dc.html \
  --artboard PhoneReadme.dc.html --artboard PhoneTree.dc.html --artboard PhoneOpen.dc.html \
  --artboard Startup.dc.html --artboard Recruiter.dc.html \
  --canvas canvas.json
```

## The one template

Everything you click opens the same way: breadcrumb, title with `[github]`
and `[live]` in brackets, description, tags, then a bottom block that is the
only part that varies.

- a from-scratch project gets a source excerpt (`redis_body`)
- a live site gets a screenshot or short recording (`acapulko_body`)
- anything else gets nothing and the pane just ends
- a job uses the same shape: role and dates as the title, what you owned as
  the description, the stack as tags, what you shipped at the bottom
  (`work_body`)

All three bottom blocks live in the generator. Only the first is rendered;
swap one into `SPECS` to see another.

## Theme

One theme, Catppuccin Mocha. `THEME = CATPPUCCIN` at the top of the
generator, `GRUVBOX` is defined beside it. Switching is one word.

## Reference page

- `Startup` — a Neovim start screen with the name in ASCII and a key menu.
  Superseded by the README as the landing, but there if a door is ever wanted.
- `Recruiter` — not shipping as a page, but its work history, language list
  and project write-ups are the CV copy already, just set for screen. Build
  the PDF from it.

## Still to fill in

Everything in `[BRACKETS]`: job years, roles, stacks, the email. No dates or
employers were invented. The site also assumes a CV PDF at
`/oleksandr-popov-cv.pdf`, which does not exist yet.

## Phone

390 by 844. A tree beside a buffer does not fit, so the phone does what a
narrow terminal does: one window at a time. The grid drops from 158 columns
to 48 and the type from 15px to 13px, still a real terminal width. Same tree,
icons, guide lines and statusline.

The tree stops being furniture and becomes a drawer: summoned from the icon
at the top left, full screen while open, dismissed when you tap a file. On an
opened buffer that icon becomes a back chevron, and the statusline path is
shortened since the full one no longer fits.
