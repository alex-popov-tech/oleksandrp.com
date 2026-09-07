# from_scratch margin streams

Each of the seven `projects/from_scratch/*` pages gets an animated text stream pinned in the
right margin of the file view: falling token columns for git and the interpreter, a scrolling
grep session for grep, and a client/server exchange for http, redis, dns and bittorrent.

Ported from the design handoff in `from_scratch.zip` (`streams.js` plus
`From Scratch Rain.dc.html`). The handoff's logic, lane layout, timing and colour intent are
kept; its shell, its hex palette and its placeholder copy are not.

## Why this and not a diagram

The site already has an animated-ASCII system: `src/lib/diagrams/`, opted into with
`diagram: <id>`, drawn as buffer lines that get line numbers like any other content. A margin
stream is a different thing in three ways that make it a sibling rather than a fifth diagram:

- it is **not content** — it sits over the pane, is not part of the buffer, and must never be
  numbered;
- it is **not a fixed grid** — its height is whatever the pane allows, known only in the browser;
- it has **no static form** — a frozen frame of falling hex is noise, not a picture, so unlike a
  diagram there is nothing worth rendering on the server.

## Decisions

| Question | Decision |
|---|---|
| Anchor | Absolutely positioned in `#main`, beside `<Train />`. It stays parked in the margin while the buffer scrolls under it. |
| Height | Fills the pane: as many rows as fit, remeasured on resize. |
| Server frame | None. Client-only; `prefers-reduced-motion` gets nothing at all. |
| Narrow panes | Hidden below a measured threshold; the train runs instead. |
| Code sharing | Reuse `Cell`/`Role`/`runs`/`rowHtml` from `lib/diagram.ts`; fork the host element. |
| Overlap | The strip paints on the pane's own `--bg`, the way `.train span` does. |
| Copy | Protocol-valid and true to what each project implements. |

## Architecture

```
src/lib/diagram.ts                 Bg gains 'match'   <- the only edit to shipped code
src/lib/streams/rain.ts            falling lanes; git + interpreter vocabularies
src/lib/streams/grep.ts            scrolling sessions; real grep-go sessions
src/lib/streams/dialog.ts          client/server exchange; http, redis, dns, bittorrent
src/lib/streams/index.ts           STREAM_IDS / STREAMS registry
src/components/MarginStream.astro  the host element
src/scripts/stream.ts              <margin-stream>
src/styles/global.css              a `---- margin streams ----` block
src/content.config.ts              stream: z.enum(STREAM_IDS).optional()
```

`MarginStream` is rendered by `Nvim.astro` inside `#main`, next to `<Train />` — **not** through
the page slot. That matters: `Nvim.astro` pipes the slot through `numberLines`, so anything
rendered as content acquires a line number. It also means the strip inherits the
`position: relative; overflow: hidden` that already clips the train to the pane.

Seven frontmatter lines opt in. The id is validated against `STREAM_IDS` by the content schema,
so a typo fails the build — the same guarantee `diagram` has.

### The Stream interface

```ts
import type { Cell } from '../diagram';

export interface Stream {
  /** the strip is exactly this many columns wide */
  cols: number;
  /** the grid for this second, at whatever height the pane allows */
  render(t: number, rows: number): Cell[][];
}
```

Two differences from `Diagram`: `rows` is a parameter rather than a property, and there is no
`Frame`/`flags` wrapper — a stream has no state to publish to CSS.

A transparent cell is `{ ch: ' ', color: 'fg', op: 0 }`. `runs()` already coalesces runs that
share colour, opacity and background, so a mostly-empty row ships as one span and `rowHtml` is
reused untouched.

Every renderer is pure: `render(t, rows)` is a function of its arguments only, exactly as the
diagrams are, which is what makes the tests below possible.

### The host element

`scripts/stream.ts` defines `<margin-stream>`:

1. Under `prefers-reduced-motion`, return immediately and stay empty. There is no server frame
   to preserve.
2. Measure one column with the hidden-probe trick `train.ts` already uses (`columnWidth`), and
   measure `#main`.
3. **Fit test:** show only when `paneCh >= gutter + 80 + 2 + cols`. 80 is `WRAP_COLUMNS`, the
   width prose is hard-wrapped to; 2 is the gap. Below the threshold, render nothing.
4. **Rows:** `floor((paneHeight - 3 * lh) / lh)`. The top offset of three rows clears the winbar
   and the title line, so the flush-right `[github]` link is never in the strip's band.
5. Build that many row `<div>`s, and rebuild on `ResizeObserver`.
6. Animate at 20fps while `document.visibilityState !== 'hidden'`. No `IntersectionObserver`:
   pinned to the pane, the strip is always on screen.
7. Write each row with `rowHtml`, skipping rows whose HTML is unchanged — as `diagram.ts` does.
8. Carry `.page-effect` **only while actually drawing**, and drop it when hidden by the fit test
   or by reduced motion. `train.ts` polls for `.page-effect` on an interval rather than reading
   it once, so the train correctly takes over on a narrow pane with no change to `train.ts`.

The threshold is wide by construction, and worth stating in numbers. At the desktop `--fs: 15px`
one column is about 9px, and the gutter is 4ch, so the fit test asks for `86 + cols` columns of
`#main`: 104 for git and the interpreter, 114 for grep, 112 for the dialog trio, and 116 for
http — roughly 940px to 1045px of pane, on top of the sidebar. So a 1280px window shows the
narrow strips and hides http's; a 1512px window shows all seven. That is the intended behaviour
rather than a limitation to design around: the strip only appears where there is genuinely a
margin for it to live in, and the train covers everywhere else.

CSS:

```css
.stream {
  position: absolute;
  top: calc(3 * var(--lh));
  right: 2ch;
  width: calc(var(--cols) * 1ch);
  white-space: pre;
  background: var(--bg);
  pointer-events: none;
  user-select: none;
  z-index: 3;            /* under the train's 4 */
}
```

The background is the pane's own colour, so the handoff's "no panel, no border" still holds
visually, and the top/bottom fade resolves against the right ground. It also settles the overlap
question: measured across the eleven excerpts on these pages, only 11 lines in total exceed 78
columns, and those live in a horizontally scrolling `.code` box — so where a long line does reach
the strip, the strip reads as being in front of it, and scrolling the block pulls the tail back
out. This is the same trick and the same reasoning as `.train span`.

### Colours

Role tokens, never the handoff's Tokyo Night hex, so the strips retheme with the site. The map is
the one `rio.ts` already established — the handoff's `mute` and `dim` sit one step lighter than
this site's names of those words:

| handoff | fg | mute | dim | amber | blue | green | red | purple | cyan | orange |
|---|---|---|---|---|---|---|---|---|---|---|
| role | `fg` | `dim` | `faint` | `accent` | `blue` | `green` | `red` | `mauve` | `teal` | `peach` |

`Bg` gains `'match'` for grep's highlight, built from tokens the way `.bg-flash` already is
rather than as the handoff's literal `#2a3d2a`:

```css
.stream .bg-match { background: color-mix(in srgb, var(--green) 18%, var(--sel)); }
```

## The engines

Three pure functions, ported from `streams.js`. Shared helpers: the deterministic sine hash
`rnd(a,b,c)`, `pick`, and `edge(r, rows) = min(1, (r+1)/fade, (rows-r)/fade)`, which multiplies
every cell's opacity so the strip fades out at the top and bottom. Defaults: `speed 1`,
`density 1`, `opacity 0.9`, `fadeRows 5`.

**rain(vocab, cols, rows, lanes, seed, K, floor)** — `lanes` are `[x, speed, laneWidth]`. Each
lane runs a column of tokens falling at its own speed; the head cell is at full opacity and, for
unhighlighted tokens, brightened to `fg`; behind it a trail of `K` tokens fades to `floor`.
Highlighted tokens hold at least 0.7 opacity. A token too long for its lane is re-picked, up to
eight times, then skipped. git runs two phase-offset streams per lane so its columns read as
near-continuous.

**grep(cols, rows, seed)** — scrolls a flat list of session lines upward at `1.1 * density`
lines per second, newest at the bottom. A `❯ grep …` command line is drawn with a green prompt;
each output line gets a dim `n:` prefix, and the session's own regex is applied to it — matched
spans are green on `bg: 'match'`, matching lines are `fg`, non-matching lines are `faint`.

**dialog(script, cols, rows, seed)** — scrolls a script upward at the same rate. Entries are
`['c' | 's', text, 'm'?]`: client lines sit left behind `▶ `, server lines are right-aligned
ahead of ` ◀`, and the marker glyphs are drawn at 0.6 of the line's opacity so they read as
punctuation. Errors are red — anything starting `-`, `4xx`, `5xx`, `NXDOMAIN`, or `choke`. A `'m'`
entry is metadata (a header, a TTL, a keep-alive) and is drawn in `dim` regardless of side.

`▶ ◀ ▓ ░ ❯ · → …` are all already in the `glyphs.test.ts` whitelist.

## The content

The rule, and it is stricter than the handoff's: **every payload is valid for its protocol and
true to what that project actually implements.** These lines are not copied out of the repos —
the repos are implementations, not transcripts — they are written against the protocols the
repos speak, checked against each project's real feature list. No invented commands, no
malformed framing, no capabilities the project does not have.

Two places this means correcting the handoff:

- **`cmmit` becomes `commit`.** The handoff truncates it only to fit a five-wide lane. Widening
  git's strip to 18 columns (three six-wide lanes) lets it say the real object type; a misspelled
  git object type is exactly the detail that costs credibility.
- **Monkey has no `while`.** The handoff's interpreter vocabulary includes it. Monkey's real
  keywords are `let fn if else return true false`; `return` also needs a six-wide lane, or it
  silently never appears.

### git — rain, 18 cols, lanes 6/6/6, K 22, floor 0.35, six phase-offset streams

Object types and refs in `accent`, held bright: `blob` `tree` `commit` `tag` `HEAD`. The machinery
in `blue`: `zlib` `sha1` `PACK` `want` `NAK` `delta` `pkt`. Everything else is pairs of hex bytes
in `dim`, the object store as it is on disk. Every word is real: git-go writes the loose object
format (`blob <len>\0`, zlib, SHA-1) and clones over Smart HTTP, which is where `pkt`, `want`,
`NAK`, `PACK` and ref-`delta` come from.

### interpreter — rain, 18 cols, lanes 6/6/6, K 10, floor 0.15

The Monkey lexer's real output. Keywords in `mauve`: `let` `fn` `if` `else` `return` `true`
`false`. Identifiers and builtins in `fg`: `x` `y` `add` `foo` `result`, and `len` `first` `last`
`rest` `push` `puts`. Integers in `accent`. Operators in `teal`: `+ - * / ! = == != < > ( ) { }
[ ] , ;`. Token-type constants in `faint`, spelled as the book spells them: `IDENT` `INT` `LET`
`EOF` `BANG` `PLUS` `MINUS` `ASSIGN` `LPAREN` `LBRACE` `STRING` `COMMA` `EQ` `LT` `GT`.

### grep — grep engine, 28 cols

Five sessions, each a real ERE pattern that grep-go supports, over lines chosen so the matches
are worth seeing. The two headline features lead:

```
❯ grep -nE '(\w+) \1'          backreferences
❯ grep -nE '^a{2,4}$'          {n,m} ranges
❯ grep -nE '^[^0-9]+$'         negated class + anchors
❯ grep -nE '(cat|dog)s?'       alternation, groups, optional
❯ grep -nE '\w+@\w+\.\w+'      character classes
```

Each carries five or six input lines with a genuine mix of matching and non-matching. The
highlight is computed by running the pattern against the line, not hand-marked, so what lights up
is what the pattern actually matches.

### http — dialog, 30 cols

go_http parses the request line and header block byte by byte off raw TCP, validates field names
against the RFC 9110 tchar set, reads bodies strictly against `Content-Length`, and supports
chunked transfer encoding with trailers, streamed files and reverse proxying. The script walks
that: a plain keep-alive `GET`; a chunked proxied response carrying the real
`X-Content-SHA256` / `X-Content-Length` trailers the Boot.dev course specifies; a streamed file;
a request with a space in a header field name, which the tchar check rejects with `400`; a `404`;
and a `500`.

### redis — dialog, 26 cols

Real RESP. The convention, applied without exception: a client line shows the true array header
`*N` for the command it sends, and a server line shows the reply with its real type byte —
`+OK`, `+PONG`, `+QUEUED`, `$<len> <value>` with `<len>` the actual byte length, `:<n>` for
integers, `$-1` for a null bulk string, `-ERR …` / `-WRONGTYPE` / `-EXECABORT` for errors, `*N`
for arrays. The exchange covers what redis-go implements: `SET`/`GET`, expiry via `SET … PX` and
the `$-1` that follows it, `INCR`, streams (`XADD` and the `<ms>-<seq>` id it returns),
transactions (`MULTI` → `+QUEUED` → `EXEC` returning an array), `WATCH`, an unknown command, a
type error, and replication (`WAIT`, and `REPLCONF GETACK *` answered with `REPLCONF ACK <n>`).

### dns — dialog, 26 cols

dns-go parses and serialises raw packets across header, question and answer sections, handles
name compression and bit-packed flags, and forwards recursively to an upstream resolver. The
script shows queries as `? <name> <TYPE>` and answers as `= <rdata>`, with metadata lines for the
parts that are the actual work: a real header flag line (`hdr QR=1 AA=0 RD=1 RA=1`), a
compression pointer resolved (`ptr 0xC00C → offset 12` — 0xC00C being the canonical pointer to
the question name at offset 12), the upstream it forwards to, and a TTL. Types are `A`, `AAAA`,
`CNAME`; `NXDOMAIN` carries its real `RCODE=3`.

### bittorrent — dialog, 26 cols

bittorrent-go hand-rolls bencode, parses `.torrent` files to an info-hash, announces to HTTP
trackers, then speaks the peer wire protocol. The script runs a real session: the tracker
announce and its peer count; the 68-byte handshake, whose pstrlen byte is `0x13` — **19 decimal**,
followed by the 19-character string `BitTorrent protocol` (the handoff's `13:BitTorrent` confuses
the hex byte for a decimal length); the peer id; a bitfield; `interested` → `unchoke`; `request`
messages with a real index/begin/length triple at the 16384-byte block size, answered with
`piece`; SHA-1 verification of the completed piece; `have`; a `choke`; a `keep-alive`; and the
`ut_metadata` extension exchange that magnet links use (BEP 9/10).

## Testing

Following the policy the README already states — unit tests for what eyeballing cannot settle,
and **no new e2e tests**. `e2e/guards.spec.ts` stays at four tests; the README is explicit that
visual and behavioural checks are done by hand and that e2e assertions about appearance have
never caught anything here.

Per engine, in `src/lib/streams/*.test.ts`:

- **Pure.** The same `(t, rows)` always gives the same grid.
- **Roles only.** Every cell's colour is one the stylesheet defines.
- **Shape.** The grid is exactly `cols` wide and `rows` tall, checked at several heights
  including small ones, so a short pane cannot produce a ragged grid.
- **rain:** no token is ever drawn past its lane's width, and a highlighted token never drops
  below 0.7 opacity before the edge fade.
- **grep:** the highlighted spans on a line are exactly the spans that session's regex matches —
  the test runs the regex itself rather than trusting a hand-marked expectation.
- **dialog:** server lines are right-aligned and client lines are left-aligned; every error line
  is red; no line is wider than the strip. That last one is a real guard, since the copy is
  hand-written to fit and a later edit could silently overflow.
- **Fade.** `edge()` reaches full opacity in the middle and falls off at both ends.

`glyphs.test.ts` gains a `describe.each(STREAM_IDS)` block, sampling each stream across time at
a couple of heights, so a glyph that is not one cell wide in JetBrains Mono fails before it ships.

Then hands-on in a real browser, desktop and phone: all seven pages, the resize threshold in both
directions, the train taking over below it, and reduced motion leaving the pages clean.

## Docs

README gains an "Add a margin stream" section beside "Add a diagram", covering the frontmatter
field, where the renderers live, the fit rule, and why there is no server frame.

## Out of scope

- No stream on any page outside `projects/from_scratch/`.
- No user-facing controls. The handoff's `speed`/`density`/`opacity`/`fadeRows` become constants
  in the code, tuned once.
- No change to the four existing diagrams, to `scripts/diagram.ts`, or to the README session.
