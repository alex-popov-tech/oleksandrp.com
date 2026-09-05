"""Phone screens. A tree plus a split cannot coexist at 390px, so this does
what a narrow terminal actually does: one window at a time, with the tree as
a drawer you summon and dismiss."""
import pathlib, html as H
from gen_v4 import (CATPPUCCIN, GRUVBOX, svg, stroke, icon_for,
                    FOLDER_P, FILE_P, BRANCH_P)

CW, LH = 7.8, 19
COLS, ROWS = 48, 44
W, HGT = 390, 844
THEME = CATPPUCCIN


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

    def right(self, r, text, fg=None, bg=None, edge=COLS):
        self.put(r, edge - len(text), text, fg, bg)

    def fill(self, r, c, w, bg):
        for i in range(w):
            cc = c + i
            if 0 <= r < ROWS and 0 <= cc < COLS:
                self.bg[r][cc] = bg

    def icon(self, r, c, s, size=13):
        self.svgs.append((r, c, s, 3, size))

    def arrow(self, r, c, fill, bg):
        self.svgs.append((r, c, f'<svg viewBox="0 0 8 19" width="8" height="19" style="display: block;">'
                                f'<rect width="8" height="19" fill="{bg}"></rect>'
                                f'<path d="M0 0 L8 9.5 L0 19 Z" fill="{fill}"></path></svg>', 0, None))

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
        for r, c, s, dy, size in self.svgs:
            box = f' width: {size}px; height: {size}px;' if size else ""
            out.append(f'<div style="position: absolute; left: {c * CW:.1f}px; '
                       f'top: {r * LH + dy}px;{box}">{s}</div>')
        return "".join(out)

    @staticmethod
    def _span(col, text, fg, bg):
        body = H.escape(text).replace(" ", "&#160;")
        style = (f"position: absolute; left: {col * CW:.1f}px; top: 0; "
                 f"width: {len(text) * CW:.1f}px; color: {fg}"
                 + (f"; background: {bg}" if bg else ""))
        return f'<span style="{style}">{body}</span>'


def ic(path, color, w=1.9):
    return (f'<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="{color}" '
            f'stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" '
            f'style="display: block;">{path}</svg>')

MENU_P = '<line x1="4" y1="7" x2="20" y2="7"></line><line x1="4" y1="12" x2="20" y2="12"></line><line x1="4" y1="17" x2="20" y2="17"></line>'
BACK_P = '<polyline points="14.5,5 7.5,12 14.5,19"></polyline>'
CLOSE_P = '<line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line>'


def header(s, t, left_icon, label, cta=True):
    s.fill(0, 0, COLS, t["bar"])
    s.icon(0, 1, ic(left_icon, t["muted"]))
    s.put(0, 3, label, t["dim"], t["bar"])
    if cta:
        text = " Download CV "
        s.right(0, text, t["bg"], t["accent"])


def statusline(s, t, path, right="utf-8"):
    r = ROWS - 1
    s.fill(r, 0, COLS, t["bar"])
    s.put(r, 0, " NORMAL ", t["bg"], t["accent"])
    s.arrow(r, 8, t["accent"], t["bar"])
    s.put(r, 10, path, t["fg"], t["bar"])
    if right and 10 + len(path) + 2 + len(right) <= COLS:
        s.right(r, right, t["dim"], t["bar"])


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
    .scr {{ position: relative; width: {COLS * CW:.1f}px; height: {ROWS * LH}px; font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; font-variant-ligatures: none; }}
    .ln {{ position: absolute; left: 0; right: 0; height: {LH}px; line-height: {LH}px; }}
    .ln span {{ display: inline-block; height: {LH}px; overflow: hidden; }}
  </style>
</helmet>
<div style="width: {W}px; height: {HGT}px; background: {t["bg"]}; color: {t["fg"]}; display: flex; flex-direction: row; align-items: center; justify-content: center; overflow: hidden;">
  <div class="scr">{inner}</div>
</div>
</x-dc>
</body>
</html>
'''


def gutter(s, t, r, lineno, cursor):
    cur = lineno == cursor
    if cur:
        s.fill(r, 0, COLS, t["cursor"])
        s.put(r, 0, f"{lineno:<3}", t["accent"], t["cursor"])
    else:
        s.put(r, 0, f"{abs(lineno - cursor):>2} ", t["faint"])
    return t["cursor"] if cur else None


# ----------------------------------------------------------- 1. README
README = [
    ("h1", "# Oleksandr Popov"), ("", ""),
    ("p", "A neovimmer and a web dev who likes to"),
    ("p", "re-invent the wheel."), ("", ""),
    ("p", "Currently writing Go for things that"),
    ("p", "already exist: Redis, DNS, Git, BitTorrent"),
    ("p", "and HTTP, each built from the wire up."), ("", ""),
    ("h2", "## Start here"), ("", ""),
    ("li", "- [redis.go](projects/from_scratch)"),
    ("sub", "  a Redis server redis-cli cannot"),
    ("sub", "  tell apart"),
    ("li", "- [store.lua](projects/people_use_it)"),
    ("sub", "  a plugin browser for Neovim"),
    ("li", "- [acapulko.go](projects/live_sites)"),
    ("sub", "  an outage tracker on a Pi"), ("", ""),
    ("h2", "## Languages"), ("", ""),
    ("p", "Go, TypeScript, Lua, Gleam, JavaScript"),
    ("p", "and Shell."), ("", ""),
    ("h2", "## Find me"), ("", ""),
    ("li", "- [github.com/alex-popov-tech]"),
    ("li", "- [oleksandrp.com]"),
    ("li", "- [EMAIL]"),
]


def readme_screen(t):
    s = Screen(t)
    header(s, t, MENU_P, "~/oleksandr")
    r = 2
    for i, (kind, text) in enumerate(README):
        rowbg = gutter(s, t, r, i + 1, 1)
        c = 4
        if kind == "h1":
            s.put(r, c, "# ", t["dim"], rowbg); s.put(r, c + 2, text[2:], t["peach"], rowbg)
        elif kind == "h2":
            s.put(r, c, "## ", t["dim"], rowbg); s.put(r, c + 3, text[3:], t["teal"], rowbg)
        elif kind == "li":
            s.put(r, c, "- ", t["dim"], rowbg)
            rest = text[2:]
            close = rest.index("]")
            s.put(r, c + 2, "[", t["dim"], rowbg)
            s.put(r, c + 3, rest[1:close], t["blue"], rowbg)
            s.put(r, c + 2 + close, "]", t["dim"], rowbg)
            s.put(r, c + 3 + close, rest[close + 1:], t["green"], rowbg)
        elif kind == "sub":
            s.put(r, c, text, t["dim"], rowbg)
        elif kind == "p":
            s.put(r, c, text, t["muted"], rowbg)
        r += 1
    statusline(s, t, "~/oleksandr/README.md")
    return s


# ----------------------------------------------------------- 2. tree drawer
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


def tree_screen(t, selected="README.md"):
    s = Screen(t)
    header(s, t, CLOSE_P, "~/oleksandr", cta=False)
    s.right(0, " tap to open ", t["dim"], t["bar"])
    for r in range(1, ROWS - 1):
        s.fill(r, 0, COLS, t["bar"])
    for r, level, kind, name, key, count, chev in TREE:
        hit = name == selected
        rowbg = t["sel"] if hit else t["bar"]
        if hit:
            s.fill(r, 0, COLS, t["sel"])
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
            s.put(r, COLS - 3, count, t["dim"], rowbg)
    statusline(s, t, "explorer", right="22 files")
    return s


# ----------------------------------------------------------- 3. a project open
def open_screen(t):
    s = Screen(t)
    header(s, t, BACK_P, "from_scratch")
    s.put(2, 0, "A Redis-compatible server, from", t["fg"])
    s.put(3, 0, "scratch, in Go", t["fg"])
    s.right(2, "[github]", t["blue"])
    for i, line in enumerate([
        "Speaks the real RESP wire protocol over",
        "TCP, so redis-cli cannot tell it apart.",
        "A goroutine per connection over a",
        "thread-safe keyspace.",
        "",
        "Strings with expiry, streams, MULTI/EXEC",
        "transactions, optimistic locking with",
        "WATCH, and leader-follower replication.",
    ]):
        if line:
            s.put(5 + i, 0, line, t["muted"])
    s.put(15, 0, "Go   RESP   TCP   Streams   Replication", t["dim"])
    s.put(17, 0, "app/internal/resp/unmarshal.go", t["teal"])
    CODE = [
        (7,  [("func ", "mauve"), ("Parse", "blue"), ("(r Reader)", "fg")]),
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
    ]
    r = 19
    for lineno, segs in CODE:
        rowbg = gutter(s, t, r, lineno, 13)
        c = 4
        for text, key in segs:
            s.put(r, c, text, t[key], rowbg)
            c += len(text)
        r += 1
    statusline(s, t, ".../from_scratch/redis.go", right=None)
    return s


if __name__ == "__main__":
    for name, fn in (("PhoneReadme", readme_screen),
                     ("PhoneTree", tree_screen),
                     ("PhoneOpen", open_screen)):
        pathlib.Path(f"{name}.dc.html").write_text(page(THEME, fn(THEME).render()))
        print("wrote", name + ".dc.html")
