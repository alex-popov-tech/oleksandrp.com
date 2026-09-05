import pathlib, html as H

CW, LH = 9, 22
COLS, ROWS = 158, 37
SIDE_W = 38
DIV = 38
MC = 40

CATPPUCCIN = dict(
    name="catppuccin", bg="#1e1e2e", bar="#181825", sel="#313244", cursor="#2a2b3c",
    fg="#cdd6f4", muted="#a6adc8", dim="#6c7086", faint="#45475a", guide="#45475a",
    accent="#f9e2af", blue="#89b4fa", mauve="#cba6f7", green="#a6e3a1",
    peach="#fab387", teal="#94e2d5",
)
GRUVBOX = dict(
    name="gruvbox", bg="#282828", bar="#1d2021", sel="#3c3836", cursor="#32302f",
    fg="#ebdbb2", muted="#bdae93", dim="#928374", faint="#504945", guide="#504945",
    accent="#fabd2f", blue="#83a598", mauve="#d3869b", green="#b8bb26",
    peach="#fe8019", teal="#8ec07c",
)


class Screen:
    def __init__(self, t):
        self.t = t
        self.ch = [[" "] * COLS for _ in range(ROWS)]
        self.fg = [[t["fg"]] * COLS for _ in range(ROWS)]
        self.bg = [[None] * COLS for _ in range(ROWS)]
        self.svgs = []

    def put(self, r, c, text, fg=None, bg=None):
        fg = fg or self.t["fg"]
        for i, x in enumerate(text):
            cc = c + i
            if 0 <= r < ROWS and 0 <= cc < COLS:
                self.ch[r][cc] = x; self.fg[r][cc] = fg; self.bg[r][cc] = bg

    def right(self, r, text, fg=None, bg=None, edge=COLS - 2):
        self.put(r, edge - len(text), text, fg, bg)

    def fill(self, r, c, w, bg):
        for i in range(w):
            cc = c + i
            if 0 <= r < ROWS and 0 <= cc < COLS:
                self.bg[r][cc] = bg

    def icon(self, r, c, svg):
        self.svgs.append((r, c, svg, 4))

    def arrow(self, r, c, fill, bg):
        self.svgs.append((r, c, f'<svg viewBox="0 0 9 22" width="9" height="22" style="display: block;">'
                                f'<rect width="9" height="22" fill="{bg}"></rect>'
                                f'<path d="M0 0 L9 11 L0 22 Z" fill="{fill}"></path></svg>', 0))

    def render(self):
        out = []
        for r in range(ROWS):
            parts = []
            start, run, cfg, cbg = 0, "", None, None
            for c in range(COLS + 1):
                f = self.fg[r][c] if c < COLS else "\0"
                b = self.bg[r][c] if c < COLS else "\0"
                if f != cfg or b != cbg:
                    if run and (run.strip() or cbg):
                        parts.append(self._span(start, run, cfg, cbg))
                    start, run, cfg, cbg = c, "", f, b
                if c < COLS:
                    run += self.ch[r][c]
            if parts:
                out.append(f'<div class="ln" style="top: {r * LH}px;">{"".join(parts)}</div>')
        for r, c, svg, dy in self.svgs:
            out.append(f'<div style="position: absolute; left: {c * CW}px; top: {r * LH + dy}px;">{svg}</div>')
        return "".join(out)

    @staticmethod
    def _span(col, text, fg, bg):
        body = H.escape(text).replace(" ", "&#160;")
        style = (f"position: absolute; left: {col * CW}px; top: 0; "
                 f"width: {len(text) * CW}px; color: {fg}"
                 + (f"; background: {bg}" if bg else ""))
        return f'<span style="{style}">{body}</span>'


def svg(body):
    return f'<svg viewBox="0 0 24 24" width="14" height="14" style="display: block;">{body}</svg>'


def stroke(path, color, w=1.7):
    return svg(f'<g fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" '
               f'stroke-linejoin="round">{path}</g>')


FOLDER_P = '<path d="M3.5 6.5a1.5 1.5 0 0 1 1.5-1.5h3.6l1.8 2h8.1a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z"></path>'
FOLDER_OPEN_P = '<path d="M3.5 18.5v-11A1.5 1.5 0 0 1 5 6h3.6l1.8 2h6.1A1.5 1.5 0 0 1 18 9.5v1"></path><path d="M3.5 18.5l2.6-7h15l-2.6 7z"></path>'
FILE_P = '<path d="M14 3H7a1.6 1.6 0 0 0-1.6 1.6v14.8A1.6 1.6 0 0 0 7 21h10a1.6 1.6 0 0 0 1.6-1.6V7.6z"></path><polyline points="14,3 14,8 19,8"></polyline>'
BRANCH_P = '<circle cx="7" cy="5.5" r="2.2"></circle><circle cx="7" cy="18.5" r="2.2"></circle><circle cx="17" cy="9.5" r="2.2"></circle><path d="M17 11.7v1.1a3 3 0 0 1-3 3H7"></path><path d="M7 7.7v8.6"></path>'

GO_BLUE = "#00ADD8"
GOPHER = svg(
    f'<ellipse cx="12" cy="14" rx="6.6" ry="7.4" fill="{GO_BLUE}"></ellipse>'
    f'<path d="M6.6 6.4q1.4-2.4 3 0" stroke="{GO_BLUE}" stroke-width="2.2" fill="none" stroke-linecap="round"></path>'
    f'<path d="M14.4 6.4q1.6-2.4 3 0" stroke="{GO_BLUE}" stroke-width="2.2" fill="none" stroke-linecap="round"></path>'
    '<circle cx="9.3" cy="11.4" r="2.7" fill="#ffffff"></circle>'
    '<circle cx="14.7" cy="11.4" r="2.7" fill="#ffffff"></circle>'
    '<circle cx="10.1" cy="11.6" r="1.2" fill="#1b1b1b"></circle>'
    '<circle cx="15.5" cy="11.6" r="1.2" fill="#1b1b1b"></circle>'
    '<ellipse cx="12" cy="16.2" rx="1.7" ry="1.2" fill="#ffffff"></ellipse>')
TS_BLUE, JS_YELLOW = "#3178C6", "#F7DF1E"
MD_P = '<rect x="2.6" y="6" width="18.8" height="12" rx="2"></rect><polyline points="6,15 6,9 9,12.5 12,9 12,15"></polyline><polyline points="15.4,9 15.4,14 "></polyline><polyline points="13.6,12.4 15.4,14.6 17.2,12.4"></polyline>'


def icon_for(kind, t):
    if kind == "folder":
        return stroke(FOLDER_P, t["accent"])
    if kind == "folder-open":
        return stroke(FOLDER_OPEN_P, t["accent"])
    if kind == "go":
        return GOPHER
    if kind == "lua":
        return svg(f'<circle cx="10.5" cy="13.5" r="7" fill="{t["blue"]}"></circle>'
                   f'<circle cx="18" cy="6.5" r="2.6" fill="{t["blue"]}"></circle>'
                   f'<circle cx="7.6" cy="10.6" r="2.1" fill="{t["bg"]}"></circle>')
    if kind == "ts":
        return svg(f'<rect x="4" y="4" width="16" height="16" rx="3" fill="{TS_BLUE}"></rect>')
    if kind == "js":
        return svg(f'<rect x="4" y="4" width="16" height="16" rx="3" fill="{JS_YELLOW}"></rect>')
    if kind == "sh":
        return stroke('<rect x="3.2" y="5.2" width="17.6" height="13.6" rx="2.4"></rect>'
                      '<polyline points="7.2,10 9.8,12.4 7.2,14.8"></polyline>'
                      '<line x1="12.4" y1="15" x2="16.6" y2="15"></line>', t["green"], 1.6)
    if kind == "readme":
        return stroke(MD_P, t["accent"], 1.6)
    return stroke(MD_P, t["dim"], 1.6)


# (row, level, kind, name, colorkey, count, chevron)
TREE = [
    (2,  0, "folder-open", "work", "accent", None, "v"),
    (3,  1, "md", "lokalise.md", "fg", None, ""),
    (4,  1, "md", "informa.md", "fg", None, ""),
    (5,  1, "md", "epam.md", "fg", None, ""),
    (6,  1, "md", "keenethics.md", "fg", None, ""),
    (8,  0, "folder-open", "projects", "accent", None, "v"),
    (9,  1, "folder-open", "from_scratch", "muted", "6", "v"),
    (10, 2, "go", "redis.go", "fg", None, ""),
    (11, 2, "go", "git.go", "fg", None, ""),
    (12, 2, "go", "bittorrent.go", "fg", None, ""),
    (13, 2, "go", "dns.go", "fg", None, ""),
    (14, 2, "go", "http.go", "fg", None, ""),
    (15, 2, "go", "grep.go", "fg", None, ""),
    (16, 1, "folder-open", "people_use_it", "muted", "8", "v"),
    (17, 2, "lua", "store.lua", "fg", None, ""),
    (18, 2, "lua", "change_case.lua", "fg", None, ""),
    (19, 2, "lua", "talk_to_me.lua", "fg", None, ""),
    (20, 2, "ts", "selenide.ts", "fg", None, ""),
    (21, 2, "ts", "play_right.ts", "fg", None, ""),
    (22, 2, "ts", "lastpass.ts", "fg", None, ""),
    (23, 2, "js", "claude_rio.js", "fg", None, ""),
    (24, 2, "sh", "dotfiles.sh", "fg", None, ""),
    (25, 1, "folder-open", "live_sites", "muted", "3", "v"),
    (26, 2, "go", "acapulko.go", "fg", None, ""),
    (27, 2, "ts", "better_dtek.ts", "fg", None, ""),
    (28, 2, "go", "dreampicai.go", "fg", None, ""),
    (30, 0, "folder", "elsewhere", "accent", "4", ">"),
    (32, 0, "readme", "README.md", "fg", None, ""),
]


def build(t, selected, crumb, path, body):
    s = Screen(t)

    # ---- winbar: sidebar root, buffer path, and the one call to action ----
    s.fill(0, 0, SIDE_W, t["bar"])
    s.icon(0, 1, stroke(FOLDER_P, t["accent"]))
    s.put(0, 3, "~/oleksandr", t["dim"], t["bar"])
    s.put(0, MC, crumb, t["dim"])
    cta = " Download CV pdf "
    s.put(0, COLS - len(cta) - 1, cta, t["bg"], t["accent"])

    # ---- sidebar area and the pipe divider ----
    for r in range(1, 36):
        s.fill(r, 0, SIDE_W, t["bar"])
        s.put(r, DIV, "|", t["muted"])
    s.put(0, DIV, "|", t["muted"])

    # ---- tree, with guide lines ----
    for r, level, kind, name, key, count, chev in TREE:
        hit = name == selected
        rowbg = t["sel"] if hit else t["bar"]
        if hit:
            s.fill(r, 0, SIDE_W, t["sel"])
        if level == 0:
            cx, ix = 0, 2
        elif level == 1:
            s.put(r, 2, "|-", t["guide"], rowbg)
            cx, ix = 5, 7 if chev else 5
        else:
            s.put(r, 2, "|", t["guide"], rowbg)
            s.put(r, 5, "|-", t["guide"], rowbg)
            cx, ix = 8, 8
        if chev:
            s.put(r, cx, chev, t["dim"], rowbg)
        s.icon(r, ix, icon_for(kind, t))
        s.put(r, ix + 2, name, t["blue"] if hit else t[key], rowbg)
        if count:
            s.put(r, SIDE_W - 3, count, t["dim"], rowbg)

    body(s, t)

    # ---- one statusline, edge to edge ----
    s.fill(36, 0, COLS, t["bar"])
    s.put(36, 0, " NORMAL ", t["bg"], t["accent"])
    s.arrow(36, 8, t["accent"], t["bar"])
    s.icon(36, 10, stroke(FILE_P, t["blue"]))
    s.put(36, 12, path, t["fg"], t["bar"])
    bx = 14 + len(path)
    s.icon(36, bx, stroke(BRANCH_P, t["mauve"]))
    s.put(36, bx + 2, "main", t["muted"], t["bar"])
    s.put(36, COLS - 7, "utf-8", t["dim"], t["bar"])
    return s


# ------------------------------------------------------------ README buffer
README = [
    ("h1", "# Oleksandr Popov"),
    ("", ""),
    ("p", "A neovimmer and a web dev who likes to re-invent the wheel."),
    ("", ""),
    ("p", "Currently writing Go for things that already exist: Redis, DNS, Git,"),
    ("p", "BitTorrent and HTTP, each built from the wire up, with no library"),
    ("p", "doing the interesting part."),
    ("", ""),
    ("p", "Before that, TypeScript on the web and inside test frameworks. Lua in"),
    ("p", "between, for Neovim plugins and a config I keep tweaking."),
    ("", ""),
    ("h2", "## Start here"),
    ("", ""),
    ("li", "- [redis.go](projects/from_scratch/redis.go)"),
    ("sub", "  a Redis server that redis-cli cannot tell apart"),
    ("li", "- [git.go](projects/from_scratch/git.go)"),
    ("sub", "  the object store by hand, then clone over Smart HTTP"),
    ("li", "- [store.lua](projects/people_use_it/store.lua)"),
    ("sub", "  a plugin browser for Neovim, with live README preview"),
    ("li", "- [acapulko.go](projects/live_sites/acapulko.go)"),
    ("sub", "  an outage tracker on a Raspberry Pi, still running"),
    ("", ""),
    ("h2", "## Languages"),
    ("", ""),
    ("p", "Go, TypeScript, Lua, Gleam, JavaScript and Shell."),
    ("p", "One idiomatic snippet each, over in languages.go."),
    ("", ""),
    ("h2", "## Find me"),
    ("", ""),
    ("li", "- [github.com/alex-popov-tech](https://github.com/alex-popov-tech)"),
    ("li", "- [oleksandrp.com](https://oleksandrp.com)"),
    ("li", "- [EMAIL]"),
]


def readme_body(s, t):
    r = 2
    for i, (kind, text) in enumerate(README):
        lineno = i + 1
        cur = lineno == 1
        if cur:
            s.fill(r, MC, COLS - MC, t["cursor"])
            s.put(r, MC, f"{lineno:<3}", t["accent"], t["cursor"])
        else:
            s.put(r, MC, f"{abs(lineno - 1):>2} ", t["faint"])
        rowbg = t["cursor"] if cur else None
        c = MC + 4
        if kind == "h1":
            s.put(r, c, "# ", t["dim"], rowbg)
            s.put(r, c + 2, text[2:], t["peach"], rowbg)
        elif kind == "h2":
            s.put(r, c, "## ", t["dim"], rowbg)
            s.put(r, c + 3, text[3:], t["teal"], rowbg)
        elif kind == "li":
            s.put(r, c, "- ", t["dim"], rowbg)
            rest = text[2:]
            if rest.startswith("["):
                close = rest.index("]")
                s.put(r, c + 2, "[", t["dim"], rowbg)
                s.put(r, c + 3, rest[1:close], t["blue"], rowbg)
                s.put(r, c + 2 + close, "]", t["dim"], rowbg)
                s.put(r, c + 3 + close, rest[close + 1:], t["green"], rowbg)
            else:
                s.put(r, c + 2, rest, t["muted"], rowbg)
        elif kind == "sub":
            s.put(r, c, text, t["dim"], rowbg)
        elif kind == "p":
            s.put(r, c, text, t["muted"], rowbg)
        r += 1


def head(s, t, title, gh, live):
    s.put(2, MC, title, t["fg"])
    tags = []
    if gh:
        tags.append("[github]")
    if live:
        tags.append("[live]")
    if tags:
        s.right(2, "  ".join(tags), t["blue"])


def redis_body(s, t):
    head(s, t, "A Redis-compatible server, from scratch, in Go", True, False)
    for i, line in enumerate([
        "Speaks the real RESP wire protocol over TCP, so redis-cli cannot tell it apart.",
        "A goroutine per connection over a thread-safe keyspace. Strings with expiry,",
        "streams, MULTI/EXEC transactions, optimistic locking with WATCH, and",
        "leader-follower replication with command propagation and WAIT.",
    ]):
        s.put(4 + i, MC, line, t["muted"])
    s.put(10, MC, "Go   RESP   TCP   Streams   Transactions   Replication   CodeCrafters", t["dim"])
    s.put(12, MC, "app/internal/resp/unmarshal.go", t["teal"])
    CODE = [
        (7,  [("func ", "mauve"), ("Parse", "blue"), ("(r Reader) (RESPValue, ", "fg"), ("error", "mauve"), (") {", "fg")]),
        (8,  [("    b, err := r.", "fg"), ("ReadByte", "blue"), ("()", "fg")]),
        (9,  [("    ", "fg"), ("if", "mauve"), (" err != ", "fg"), ("nil", "mauve"), (" {", "fg")]),
        (10, [("        ", "fg"), ("return", "mauve"), (" ", "fg"), ("nil", "mauve"), (", err", "fg")]),
        (11, [("    }", "fg")]),
        (12, [("    ", "fg"), ("switch", "mauve"), (" b {", "fg")]),
        (13, [("    ", "fg"), ("case", "mauve"), (" ", "fg"), ("'*'", "green"), (":", "fg")]),
        (14, [("        ", "fg"), ("return", "mauve"), (" ", "fg"), ("ParseArray", "blue"), ("(r)", "fg")]),
        (15, [("    ", "fg"), ("case", "mauve"), (" ", "fg"), ("'$'", "green"), (":", "fg")]),
        (16, [("        ", "fg"), ("return", "mauve"), (" ", "fg"), ("ParseBulkString", "blue"), ("(r)", "fg")]),
        (17, [("    ", "fg"), ("case", "mauve"), (" ", "fg"), ("':'", "green"), (":", "fg")]),
        (18, [("        ", "fg"), ("return", "mauve"), (" ", "fg"), ("ParseInteger", "blue"), ("(r)", "fg")]),
        (19, [("    ", "fg"), ("case", "mauve"), (" ", "fg"), ("'+'", "green"), (":", "fg")]),
        (20, [("        ", "fg"), ("return", "mauve"), (" ", "fg"), ("ParseSimpleString", "blue"), ("(r)", "fg")]),
        (21, [("    }", "fg")]),
        (22, [("    ", "fg"), ("return", "mauve"), (" ", "fg"), ("nil", "mauve"), (", fmt.", "fg"), ("Errorf", "blue"),
              ('("unexpected input %q"', "green"), (", b)", "fg")]),
    ]
    CURSOR, r = 13, 14
    for lineno, segs in CODE:
        cur = lineno == CURSOR
        if cur:
            s.fill(r, MC, COLS - MC, t["cursor"])
            s.put(r, MC, f"{lineno:<3}", t["accent"], t["cursor"])
        else:
            s.put(r, MC, f"{abs(lineno - CURSOR):>2} ", t["faint"])
        c = MC + 4
        for text, key in segs:
            s.put(r, c, text, t[key], t["cursor"] if cur else None)
            c += len(text)
        r += 1


def acapulko_body(s, t):
    head(s, t, "A power-outage tracker for one address in Ukraine", True, True)
    for i, line in enumerate([
        "Built to survive the war-driven blackouts. Combines live grid sensor data from",
        "Home Assistant with emergency outage announcements from the DTEK utility API.",
        "",
        "Pushes Telegram alerts when power flips or DTEK announces an outage, and serves",
        "a live dashboard over Server-Sent Events. Runs on a Raspberry Pi 5, packaged",
        "both as a standalone binary and as a Home Assistant add-on.",
    ]):
        if line:
            s.put(4 + i, MC, line, t["muted"])
    s.put(12, MC, "Go   Home Assistant   Telegram   Raspberry Pi   Docker   SSE", t["dim"])
    s.put(14, MC, "[SCREENSHOT OR SHORT SCREEN RECORDING OF THE DASHBOARD]", t["faint"])
    s.put(27, MC, "see also", t["teal"])
    s.put(28, MC + 2, "better_dtek.ts", t["blue"])
    s.put(28, MC + 19, "outage schedules for the whole country, in SvelteKit", t["dim"])


def work_body(s, t):
    head(s, t, "[ROLE]", False, False)
    s.put(2, MC + 44, "[YYYY] - [YYYY]", t["dim"])
    s.put(4, MC, "[ONE LINE ON WHAT YOU OWNED THERE, IN YOUR OWN WORDS]", t["muted"])
    s.put(5, MC, "[A SECOND LINE: THE THING YOU SHIPPED, OR THE PROBLEM YOU SOLVED]", t["muted"])
    s.put(7, MC, "[THE STACK YOU USED THERE]", t["dim"])
    s.put(10, MC, "shipped", t["teal"])
    s.put(12, MC, "Mayak", t["fg"])
    s.right(12, "[github]  [live]", t["blue"])
    s.put(13, MC, "A directory of psychological services in Ukraine, built on Next.js and", t["muted"])
    s.put(14, MC, "PostgreSQL with Prisma, packaged with Docker for repeatable deploys.", t["muted"])
    s.put(16, MC, "Next.js   React   PostgreSQL   Prisma   Docker   Vercel", t["dim"])


def page(t, inner):
    return f'''<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap">
  <style>
    body {{ margin: 0; background: {t["bg"]}; }}
    a {{ color: {t["blue"]}; text-decoration: none; }}
    a:hover {{ color: {t["accent"]}; text-decoration: underline; }}
    .scr {{ position: relative; width: {COLS * CW}px; height: {ROWS * LH}px; font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 15px; font-variant-ligatures: none; }}
    .ln {{ position: absolute; left: 0; right: 0; height: {LH}px; line-height: {LH}px; }}
    .ln span {{ display: inline-block; height: {LH}px; overflow: hidden; }}
  </style>
</helmet>
<div style="width: 1440px; height: 900px; background: {t["bg"]}; color: {t["fg"]}; display: flex; flex-direction: row; align-items: center; justify-content: center; overflow: hidden;">
  <div class="scr">{inner}</div>
</div>
</x-dc>
</body>
</html>
'''


# One template covers anything you open, project or job. Only the bottom
# block changes: a source excerpt, a screenshot, or nothing at all.
# acapulko_body and work_body are that same template with the other two
# bottom blocks; swap one into SPECS to render it instead.

THEME = CATPPUCCIN   # swap for GRUVBOX to retheme everything

_SPECS = [
    ("README.md", "README.md", "~/oleksandr/README.md", readme_body, "Main"),
    ("redis.go", "projects > from_scratch > redis.go",
     "~/oleksandr/projects/from_scratch/redis.go", redis_body, "Open"),
]

if __name__ == "__main__":
    for sel, crumb, path, body, name in _SPECS:
        scr = build(THEME, sel, crumb, path, body)
        pathlib.Path(f"{name}.dc.html").write_text(page(THEME, scr.render()))
        print("wrote", name + ".dc.html")
