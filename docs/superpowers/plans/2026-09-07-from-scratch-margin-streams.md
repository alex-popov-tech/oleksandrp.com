# from_scratch Margin Streams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give each of the seven `projects/from_scratch/*` pages an animated text stream pinned in the right margin of the file view — falling token columns for git and the interpreter, a scrolling grep session for grep, and a client/server exchange for http, redis, dns and bittorrent.

**Architecture:** Three pure engines under `src/lib/streams/`, each a `render(t, rows) => Cell[][]` over the character-grid types the diagram system already defines. They are hosted by a `<margin-stream>` custom element rendered into `#main` beside the train — never through the buffer slot, so `numberLines` never sees it. There is no server-rendered frame: the strip's height is whatever the pane allows, which only the browser knows.

**Tech Stack:** Astro 7 (static, `build.format: 'file'`), TypeScript, vitest. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-07-from-scratch-margin-streams-design.md`

## Global Constraints

- **Colours are role tokens, never hex.** The `Role` union in `src/lib/diagram.ts` is the only vocabulary. Map from the handoff: fg→`fg`, mute→`dim`, dim→`faint`, amber→`accent`, blue→`blue`, green→`green`, red→`red`, purple→`mauve`, cyan→`teal`, orange→`peach`.
- **Every renderer is pure.** `render(t, rows)` is a function of its arguments only — no module-level mutable state, no `Date.now()`, no `Math.random()`. Randomness comes from the deterministic sine hash `rnd(a, b, c)`.
- **One glyph, one cell.** Only ASCII plus glyphs already in the `SAFE` set in `src/lib/diagrams/glyphs.test.ts`. The streams use `▶ ◀ ▓ ░ ❯ · → …`, all of which are already whitelisted. Adding any other non-ASCII glyph is out of scope for this plan.
- **Payloads must be protocol-valid and true to the project.** Every RESP array header states the true element count; every `$n` states the true byte length; every DNS answer is a real record for that name; every peer-wire message uses real field values. Invent the lines — the repos are implementations, not transcripts — but invent them correctly, and only use capabilities the project actually has. Tests enforce this where it can be enforced mechanically.
- **Tuning constants, not options.** The handoff's `speed`/`density`/`opacity`/`fadeRows` sliders become the constants `DENSITY = 1`, `MAX_OP = 0.9`, `FADE_ROWS = 5`. No user-facing controls.
- **No new e2e tests.** `e2e/guards.spec.ts` stays at four tests. The README is explicit that visual and behavioural checks here are done by hand.
- **Formatting.** Two-space indent, single quotes, semicolons, trailing commas — match the surrounding files.

## File Structure

**Created:**

| File | Responsibility |
|---|---|
| `src/lib/streams/engine.ts` | The `Stream` interface, tuning constants, and the helpers all three engines share: `rnd`, `pick`, `hex`, `edge`, `blankGrid`. |
| `src/lib/streams/rain.ts` | The falling-lane engine, the git and Monkey vocabularies, and the `git` / `interpreter` streams. |
| `src/lib/streams/grep.ts` | The scrolling-session engine, `matchMask`, the five grep-go sessions, and the `grep` stream. |
| `src/lib/streams/dialog.ts` | The client/server engine, `isError`, the four protocol scripts, and the `http` / `redis` / `dns` / `bittorrent` streams. |
| `src/lib/streams/index.ts` | `STREAM_IDS`, `StreamId`, `STREAMS` — the registry the content schema validates against. |
| `src/lib/measure.ts` | `columnWidth(node)`, the hidden-probe column measurement, extracted from `train.ts` so both users share it. |
| `src/components/MarginStream.astro` | The host element's markup. Two lines; all behaviour is in the script. |
| `src/scripts/stream.ts` | `<margin-stream>`: measure, fit test, build rows, animate, toggle `.page-effect`. |
| `src/lib/streams/*.test.ts` | One test file per engine. |

**Modified:**

| File | Change |
|---|---|
| `src/lib/diagram.ts` | `Bg` gains `'match'`. |
| `src/styles/global.css` | A `---- margin streams ----` block. |
| `src/scripts/train.ts` | Import `columnWidth` from `lib/measure` instead of defining it. |
| `src/content.config.ts` | `stream: z.enum(STREAM_IDS).optional()`. |
| `src/layouts/Nvim.astro` | Optional `stream` prop, rendered beside `<Train />`. |
| `src/pages/projects/[...slug].astro` | Pass `stream={d.stream}`. |
| `src/content/projects/from_scratch/*.md` | Seven frontmatter lines. |
| `src/lib/diagrams/glyphs.test.ts` | A `describe.each` block over the streams. |
| `README.md` | An "Add a margin stream" section. |

### Deviation from the spec, and why

The spec says the `Bg` change is the only edit to shipped code. This plan adds one more: `columnWidth` is extracted from `src/scripts/train.ts` into `src/lib/measure.ts` so the stream does not carry a second copy of it. The function moves verbatim, so the train's behaviour is unchanged.

---

### Task 1: Shared engine helpers

**Files:**
- Modify: `src/lib/diagram.ts:16` (the `Bg` type)
- Create: `src/lib/streams/engine.ts`
- Test: `src/lib/streams/engine.test.ts`
- Modify: `src/styles/global.css` (append a new section)

**Interfaces:**
- Consumes: `Cell`, `Role`, `Bg` from `src/lib/diagram.ts`.
- Produces:
  - `interface Stream { cols: number; render(t: number, rows: number): Cell[][] }`
  - `const DENSITY = 1`, `MAX_OP = 0.9`, `FADE_ROWS = 5`
  - `rnd(a: number, b: number, c: number): number` — in `[0, 1)`
  - `pick<T>(arr: readonly T[], a: number, b: number, c: number): T`
  - `hex(a: number, b: number, c: number): string` — two lowercase hex digits
  - `edge(r: number, rows: number): number`
  - `blankGrid(cols: number, rows: number): Cell[][]`
  - `isBlank(cell: Cell): boolean`

- [ ] **Step 1: Write the failing test**

Create `src/lib/streams/engine.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { blankGrid, edge, hex, isBlank, pick, rnd, FADE_ROWS } from './engine';

describe('rnd', () => {
  it('is deterministic', () => {
    expect(rnd(1, 2, 3)).toBe(rnd(1, 2, 3));
    expect(rnd(1, 2, 3)).not.toBe(rnd(1, 2, 4));
  });

  it('stays in [0, 1)', () => {
    for (let a = 0; a < 20; a++) {
      for (let b = 0; b < 20; b++) {
        const v = rnd(a, b, a + b);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    }
  });
});

describe('pick', () => {
  it('always returns a member of the list', () => {
    const list = ['a', 'b', 'c'] as const;
    for (let i = 0; i < 50; i++) expect(list).toContain(pick(list, i, 1, 2));
  });
});

describe('hex', () => {
  it('is always two lowercase hex digits', () => {
    for (let i = 0; i < 200; i++) expect(hex(i, 1, 2)).toMatch(/^[0-9a-f]{2}$/);
  });
});

describe('edge', () => {
  it('is full in the middle and fades at both ends', () => {
    const rows = 30;
    expect(edge(15, rows)).toBe(1);
    expect(edge(0, rows)).toBeLessThan(1);
    expect(edge(rows - 1, rows)).toBeLessThan(1);
    // it climbs on the way in and falls on the way out
    expect(edge(0, rows)).toBeLessThan(edge(1, rows));
    expect(edge(rows - 1, rows)).toBeLessThan(edge(rows - 2, rows));
  });

  it('never returns zero, so nothing is drawn perfectly invisible', () => {
    for (let rows = 6; rows < 40; rows++) {
      for (let r = 0; r < rows; r++) expect(edge(r, rows)).toBeGreaterThan(0);
    }
  });

  it('is full for every row of a strip shorter than two fades', () => {
    // a short pane must not fade to nothing everywhere
    expect(edge(2, 5)).toBeGreaterThan(0);
    expect(FADE_ROWS).toBe(5);
  });
});

describe('blankGrid', () => {
  it('is rows tall and cols wide, and every cell reads as blank', () => {
    const g = blankGrid(7, 4);
    expect(g).toHaveLength(4);
    for (const row of g) {
      expect(row).toHaveLength(7);
      for (const cell of row) expect(isBlank(cell)).toBe(true);
    }
  });

  it('gives every cell its own object, so writing one never writes another', () => {
    const g = blankGrid(3, 2);
    g[0][0].ch = 'x';
    expect(g[0][1].ch).toBe(' ');
    expect(g[1][0].ch).toBe(' ');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/streams/engine.test.ts`
Expected: FAIL — `Failed to resolve import "./engine"`.

- [ ] **Step 3: Add `'match'` to the `Bg` type**

In `src/lib/diagram.ts`, replace the `Bg` declaration and its comment:

```ts
/** Row and span highlights: store.nvim's selection and install flash, and grep's matches. */
export type Bg = 'sel' | 'flash' | 'match';
```

- [ ] **Step 4: Write the engine helpers**

Create `src/lib/streams/engine.ts`:

```ts
/**
 * Shared machinery for the margin streams — the animated text strips that sit in the right
 * margin of the from_scratch file views.
 *
 * A stream is a pure `render(t, rows)` over a character grid, like a diagram, with one
 * difference that shapes everything here: its height is not fixed. The strip fills whatever
 * pane it is given, so `rows` arrives at render time and there is no server-drawn first
 * frame to keep in step. See docs/superpowers/specs/2026-09-07-from-scratch-margin-streams-design.md.
 *
 * Colours are role tokens rather than the hex the design handoff names, so a stream themes
 * with the rest of the site and survives a palette swap.
 */
import type { Cell } from '../diagram';

export interface Stream {
  /** the strip is exactly this many columns wide */
  cols: number;
  /** the grid for this second, at whatever height the pane allows */
  render(t: number, rows: number): Cell[][];
}

/** Lines per second, and how fast rain falls. The handoff's slider, fixed at its default. */
export const DENSITY = 1;
/** The brightest any cell gets. The strip is background, so it never reaches full white. */
export const MAX_OP = 0.9;
/** How many rows the top and bottom fades take. */
export const FADE_ROWS = 5;

/**
 * Deterministic pseudo-random from three coordinates. A sine hash rather than a seeded PRNG
 * because it has no state: `render(t, rows)` stays a pure function of its arguments, which is
 * what makes every test below possible.
 */
export function rnd(a: number, b: number, c: number): number {
  const x = Math.sin(a * 12.9898 + b * 78.233 + c * 37.719) * 43758.5453;
  return x - Math.floor(x);
}

export function pick<T>(arr: readonly T[], a: number, b: number, c: number): T {
  return arr[Math.floor(rnd(a, b, c) * arr.length)];
}

/** One byte of the object store, as git would print it. */
export function hex(a: number, b: number, c: number): string {
  return Math.floor(rnd(a, b, c) * 256)
    .toString(16)
    .padStart(2, '0');
}

/**
 * The opacity multiplier for a row: the strip fades out over its top and bottom rows so it
 * has no hard edge against the pane. Never reaches zero, so a row is never drawn invisibly.
 */
export function edge(r: number, rows: number): number {
  return Math.min(1, (r + 1) / FADE_ROWS, (rows - r) / FADE_ROWS);
}

/** A cell that shows nothing. `runs()` folds a row of these into a single span. */
export const blankCell = (): Cell => ({ ch: ' ', color: 'fg', op: 0 });

export const isBlank = (cell: Cell): boolean => cell.op === 0;

export function blankGrid(cols: number, rows: number): Cell[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, blankCell));
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx vitest run src/lib/streams/engine.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 6: Add the match highlight to the stylesheet**

Append to `src/styles/global.css`, after the `---- README.sh session ----` block:

```css
/* ---- margin streams ---- */
/* grep's highlight, the selection colour pulled towards green — the same construction as
   the diagram's install flash, so a palette swap carries it. */
.stream .bg-match { background: color-mix(in srgb, var(--green) 18%, var(--sel)); }
```

- [ ] **Step 7: Verify the whole suite still passes**

Run: `npm test`
Expected: PASS. The `Bg` widening is additive, so the diagram tests are unaffected.

- [ ] **Step 8: Commit**

```bash
git add src/lib/diagram.ts src/lib/streams/engine.ts src/lib/streams/engine.test.ts src/styles/global.css
git commit -m "feat: shared machinery for the margin streams"
```

---

### Task 2: The rain engine — git and the interpreter

Falling columns of tokens. git drops its object store and the Smart HTTP verbs it clones over; the interpreter drops what the Monkey lexer actually emits.

**Files:**
- Create: `src/lib/streams/rain.ts`
- Test: `src/lib/streams/rain.test.ts`

**Interfaces:**
- Consumes: `Stream`, `blankGrid`, `edge`, `hex`, `pick`, `rnd`, `DENSITY`, `MAX_OP`, `FADE_ROWS` from `./engine`; `Cell`, `Role` from `../diagram`.
- Produces:
  - `interface Token { text: string; color: Role; hot?: boolean }`
  - `type Vocab = (stream: number, cycle: number, k: number) => Token`
  - `type Lane = readonly [x: number, speed: number, width: number]`
  - `const LANE = 6`, `const COLS = 18`, `const MIN_HOT_OP = 0.7`
  - `rain(t, cols, rows, vocab, lanes, seed, trail, floor): Cell[][]`
  - `GIT_OBJECTS`, `GIT_WIRE`, `MONKEY_KEYWORDS`, `MONKEY_IDENTS`, `MONKEY_OPS`, `MONKEY_TOKENS`
  - `gitVocab: Vocab`, `monkeyVocab: Vocab`
  - `git: Stream`, `interpreter: Stream`

- [ ] **Step 1: Write the failing test**

Create `src/lib/streams/rain.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Role } from '../diagram';
import { FADE_ROWS, MAX_OP, type Stream } from './engine';
import {
  GIT_OBJECTS, GIT_WIRE, LANE, MIN_HOT_OP,
  MONKEY_IDENTS, MONKEY_KEYWORDS, MONKEY_OPS, MONKEY_TOKENS,
  git, interpreter, rain, type Vocab,
} from './rain';

const ROLES: Role[] = ['fg', 'muted', 'dim', 'faint', 'accent', 'blue', 'green', 'peach', 'teal', 'orange', 'red', 'mauve'];
const RAIN: [string, Stream][] = [['git', git], ['interpreter', interpreter]];

describe.each(RAIN)('%s', (_name, stream) => {
  it('is pure: the same t and height always give the same frame', () => {
    expect(stream.render(4.25, 20)).toEqual(stream.render(4.25, 20));
    expect(stream.render(31.5, 9)).toEqual(stream.render(31.5, 9));
  });

  it('fills the grid it is asked for, at any height', () => {
    for (const rows of [6, 12, 18, 40]) {
      const g = stream.render(3, rows);
      expect(g).toHaveLength(rows);
      for (const row of g) expect(row).toHaveLength(stream.cols);
    }
  });

  it('only uses colour roles the stylesheet knows', () => {
    for (let t = 0; t < 40; t += 0.5) {
      for (const row of stream.render(t, 20)) for (const cell of row) expect(ROLES).toContain(cell.color);
    }
  });

  it('never draws brighter than the strip maximum', () => {
    for (let t = 0; t < 40; t += 0.5) {
      for (const row of stream.render(t, 20)) {
        for (const cell of row) {
          expect(cell.op).toBeGreaterThanOrEqual(0);
          expect(cell.op).toBeLessThanOrEqual(MAX_OP + 1e-9);
        }
      }
    }
  });
});

describe('rain', () => {
  it('holds a highlighted word above MIN_HOT_OP away from the fades', () => {
    const rows = 30;
    const hot: Vocab = () => ({ text: 'commit', color: 'accent', hot: true });
    const g = rain(3, 18, rows, hot, [[0, 1, LANE]], 1, 22, 0.15);
    for (let r = FADE_ROWS; r < rows - FADE_ROWS; r++) {
      for (const cell of g[r]) {
        if (cell.op > 0) expect(cell.op).toBeGreaterThanOrEqual(MIN_HOT_OP * MAX_OP - 1e-9);
      }
    }
  });

  it('lets an ordinary word fade down the trail', () => {
    const rows = 30;
    const cold: Vocab = () => ({ text: 'abcdef', color: 'fg' });
    const g = rain(3, 18, rows, cold, [[0, 1, LANE]], 1, 22, 0.15);
    const ops = g.flat().map((c) => c.op).filter((op) => op > 0);
    expect(Math.min(...ops)).toBeLessThan(MIN_HOT_OP * MAX_OP);
  });

  it('drops a word too long for its lane rather than spilling into the next', () => {
    const tooLong: Vocab = () => ({ text: 'RETURNING', color: 'fg' });
    const g = rain(3, 18, 20, tooLong, [[0, 1, LANE]], 1, 10, 0.15);
    for (const row of g) for (const cell of row) expect(cell.op).toBe(0);
  });
});

describe('the vocabularies', () => {
  it('every word fits a lane', () => {
    const words = [
      ...GIT_OBJECTS, ...GIT_WIRE,
      ...MONKEY_KEYWORDS, ...MONKEY_IDENTS, ...MONKEY_OPS, ...MONKEY_TOKENS,
    ];
    for (const w of words) expect(w.length).toBeLessThanOrEqual(LANE);
  });

  it('spells git object types in full', () => {
    // the design handoff truncated this to fit a five-wide lane; the lane is six wide here
    expect(GIT_OBJECTS).toContain('commit');
    expect(GIT_OBJECTS).not.toContain('cmmit');
  });

  it('uses Monkey keywords only — the language has no `while`', () => {
    expect([...MONKEY_KEYWORDS].sort()).toEqual(['else', 'false', 'fn', 'if', 'let', 'return', 'true']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/streams/rain.test.ts`
Expected: FAIL — `Failed to resolve import "./rain"`.

- [ ] **Step 3: Write the rain engine and its two vocabularies**

Create `src/lib/streams/rain.ts`:

```ts
/**
 * The rain engine: columns of words falling down fixed lanes, each with a bright head and a
 * fading trail. git drops the object store it reads and writes; the interpreter drops what
 * the Monkey lexer actually emits.
 *
 * Ported from the design handoff. Two corrections to it: lanes are six columns wide rather
 * than five, so git can say `commit` instead of the handoff's `cmmit` and Monkey can say
 * `return`; and `while`, which the handoff listed, is not a Monkey keyword.
 */
import type { Cell, Role } from '../diagram';
import { DENSITY, MAX_OP, blankGrid, edge, hex, pick, rnd, type Stream } from './engine';

/** A word the rain can drop, with the colour it falls in. */
export interface Token {
  text: string;
  color: Role;
  /** a word worth reading: it never dims past MIN_HOT_OP, so the trail cannot swallow it */
  hot?: boolean;
}

export type Vocab = (stream: number, cycle: number, k: number) => Token;

/** `[column, speed, lane width]` */
export type Lane = readonly [x: number, speed: number, width: number];

export const MIN_HOT_OP = 0.7;
/** Six columns is what `commit`, `return`, `ASSIGN` and `LPAREN` need. */
export const LANE = 6;
/** Three lanes of six. */
export const COLS = 18;

export function rain(
  t: number,
  cols: number,
  rows: number,
  vocab: Vocab,
  lanes: readonly Lane[],
  seed: number,
  trail: number,
  floor: number,
): Cell[][] {
  const g = blankGrid(cols, rows);
  const taken = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false));

  lanes.forEach(([x, speed, width], s) => {
    const fall = speed * 2.6 * DENSITY;
    const span = rows + trail;
    /* Lanes past the third repeat the first three half a cycle out of phase. That is what
       makes git's columns read as continuous rather than as separate falling drops. */
    const pos = t * fall + rnd(s % 3, 1, seed) * span + (s >= 3 ? span / 2 : 0);
    const cycle = Math.floor(pos / span);
    const head = Math.floor(pos % span);

    for (let k = 0; k < trail; k++) {
      const r = head - k;
      if (r < 0 || r >= rows) continue;

      // a word too long for its lane is re-rolled, then given up on — never clipped
      let token = vocab(s, cycle, k);
      for (let n = 1; n < 8 && token.text.length > width; n++) token = vocab(s, cycle, k + n * 31);
      if (token.text.length > width) continue;

      const faded = k === 0 ? 1 : Math.max(floor, 0.8 - k * (0.65 / trail));
      const op = (token.hot ? Math.max(faded, MIN_HOT_OP) : faded) * MAX_OP * edge(r, rows);
      // the head of a dim column is the brightest thing in it
      const dim = token.color === 'dim' || token.color === 'faint';
      const color: Role = k === 0 && !token.hot && dim ? 'fg' : token.color;

      const end = x + token.text.length;
      // keep one blank after a short word, so the lane's other stream cannot butt against it
      if (token.text.length < width && !taken[r][end]) taken[r][end] = true;
      for (let i = 0; i < token.text.length && x + i < cols; i++) {
        if (taken[r][x + i]) continue;
        taken[r][x + i] = true;
        g[r][x + i] = { ch: token.text[i], color, op };
      }
    }
  });

  return g;
}

/* ---- git: the object store, and the Smart HTTP protocol it clones over ---- */

export const GIT_OBJECTS = ['blob', 'tree', 'commit', 'tag', 'HEAD'] as const;
export const GIT_WIRE = ['zlib', 'sha1', 'PACK', 'want', 'NAK', 'delta', 'pkt'] as const;

export const gitVocab: Vocab = (s, c, k) => {
  const r = rnd(s, c, k);
  if (r < 0.09) return { text: pick(GIT_OBJECTS, s, c, k + 9), color: 'accent', hot: true };
  if (r < 0.15) return { text: pick(GIT_WIRE, s, c, k + 5), color: 'blue', hot: true };
  return { text: `${hex(s, c, k)} ${hex(s, c, k + 1)}`, color: r < 0.6 ? 'dim' : 'fg' };
};

/* ---- Monkey, as `Writing An Interpreter In Go` defines it ---- */

export const MONKEY_KEYWORDS = ['let', 'fn', 'if', 'else', 'return', 'true', 'false'] as const;
export const MONKEY_IDENTS = ['x', 'y', 'add', 'foo', 'result', 'len', 'first', 'last', 'rest', 'push', 'puts'] as const;
export const MONKEY_OPS = ['+', '-', '*', '/', '!', '=', '==', '!=', '<', '>', '(', ')', '{', '}', '[', ']', ',', ';'] as const;
export const MONKEY_TOKENS = ['IDENT', 'INT', 'LET', 'EOF', 'BANG', 'PLUS', 'MINUS', 'ASSIGN', 'LPAREN', 'LBRACE', 'STRING', 'COMMA', 'EQ', 'LT', 'GT'] as const;

export const monkeyVocab: Vocab = (s, c, k) => {
  const r = rnd(s, c, k);
  if (r < 0.25) return { text: pick(MONKEY_KEYWORDS, s, c, k + 1), color: 'mauve', hot: true };
  if (r < 0.45) return { text: pick(MONKEY_IDENTS, s, c, k + 2), color: 'fg' };
  if (r < 0.65) return { text: String(Math.floor(rnd(s, c, k + 3) * 100)), color: 'accent' };
  if (r < 0.85) return { text: pick(MONKEY_OPS, s, c, k + 4), color: 'teal' };
  return { text: pick(MONKEY_TOKENS, s, c, k + 5), color: 'faint' };
};

const GIT_LANES: readonly Lane[] = [[0, 0.8, LANE], [6, 1.1, LANE], [12, 0.95, LANE]];
const MONKEY_LANES: readonly Lane[] = [[0, 1.2, LANE], [6, 1.5, LANE], [12, 1.0, LANE]];

export const git: Stream = {
  cols: COLS,
  // six streams on three lanes, a long trail and a high floor: near-continuous columns
  render: (t, rows) => rain(t, COLS, rows, gitVocab, [...GIT_LANES, ...GIT_LANES], 2, 22, 0.35),
};

export const interpreter: Stream = {
  cols: COLS,
  // one stream per lane and a short trail: discrete tokens, the way a lexer emits them
  render: (t, rows) => rain(t, COLS, rows, monkeyVocab, MONKEY_LANES, 5, 10, 0.15),
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/streams/rain.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 5: Eyeball one frame**

Run:

```bash
npx vite-node -e "const { git, interpreter } = await import('./src/lib/streams/rain.ts'); \
for (const [n, s] of [['git', git], ['interpreter', interpreter]]) { \
  console.log('--- ' + n); \
  console.log(s.render(7, 18).map((r) => r.map((c) => (c.op > 0 ? c.ch : ' ')).join('')).join('\n')); }"
```

Expected: two 18-column blocks of readable words in columns — `commit`, `blob`, hex pairs for git; `let`, `fn`, `IDENT`, operators for the interpreter. Nothing spilling past column 18, no word split across a lane boundary.

- [ ] **Step 6: Commit**

```bash
git add src/lib/streams/rain.ts src/lib/streams/rain.test.ts
git commit -m "feat: the rain engine, for git and the interpreter"
```

---

### Task 3: The grep engine

Real `grep -nE` sessions scrolling upward, with the matches lit. The highlight is computed by running the pattern against the line, never hand-marked, so what lights up is what the pattern actually matches.

**Files:**
- Create: `src/lib/streams/grep.ts`
- Test: `src/lib/streams/grep.test.ts`

**Interfaces:**
- Consumes: `Stream`, `blankGrid`, `edge`, `DENSITY`, `MAX_OP` from `./engine`; `Cell` from `../diagram`.
- Produces:
  - `interface GrepSession { pattern: string; lines: readonly string[] }`
  - `const COLS = 28`, `const PREFIX = 3`
  - `matchMask(pattern: string, text: string): boolean[]`
  - `command(s: GrepSession): string`
  - `SESSIONS: readonly GrepSession[]`
  - `grep: Stream`

- [ ] **Step 1: Write the failing test**

Create `src/lib/streams/grep.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Role } from '../diagram';
import { MAX_OP } from './engine';
import { COLS, PREFIX, SESSIONS, command, grep, matchMask } from './grep';

const ROLES: Role[] = ['fg', 'muted', 'dim', 'faint', 'accent', 'blue', 'green', 'peach', 'teal', 'orange', 'red', 'mauve'];
const lit = (mask: boolean[]) => mask.map((h, i) => (h ? i : -1)).filter((i) => i >= 0);

describe('matchMask', () => {
  it('marks exactly the spans the pattern matches', () => {
    expect(lit(matchMask('is', 'it is is broken'))).toEqual([3, 4, 6, 7]);
  });

  it('resolves a backreference', () => {
    // `bar bar` is the match; `baz` is not part of it
    const mask = matchMask('(\\w+) \\1', 'bar bar baz');
    expect(lit(mask)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('honours a {n,m} range', () => {
    expect(matchMask('^a{2,4}$', 'aaa').every(Boolean)).toBe(true);
    expect(matchMask('^a{2,4}$', 'aaaaa').some(Boolean)).toBe(false);
    expect(matchMask('^a{2,4}$', 'a').some(Boolean)).toBe(false);
  });

  it('is pure: it never carries lastIndex between calls', () => {
    const first = matchMask('a', 'banana');
    expect(matchMask('a', 'banana')).toEqual(first);
  });

  it('does not spin on a zero-width match', () => {
    expect(matchMask('x*', 'abc').some(Boolean)).toBe(false);
  });
});

describe('the sessions', () => {
  it('every command and every line fits the strip', () => {
    for (const s of SESSIONS) {
      expect(command(s).length).toBeLessThanOrEqual(COLS);
      for (const line of s.lines) expect(line.length).toBeLessThanOrEqual(COLS - PREFIX);
    }
  });

  it('every session shows both a match and a miss', () => {
    for (const s of SESSIONS) {
      const hits = s.lines.filter((l) => matchMask(s.pattern, l).some(Boolean));
      expect(hits.length).toBeGreaterThan(0);
      expect(hits.length).toBeLessThan(s.lines.length);
    }
  });

  it('demonstrates the syntax grep-go is built around', () => {
    const patterns = SESSIONS.map((s) => s.pattern);
    expect(patterns).toContain('(\\w+) \\1');
    expect(patterns).toContain('^a{2,4}$');
    expect(patterns.some((p) => p.includes('|'))).toBe(true);
    expect(patterns.some((p) => p.includes('[^'))).toBe(true);
  });

  it('writes the command from the pattern, so the two cannot drift', () => {
    expect(command({ pattern: '^foo$', lines: [] })).toBe("❯ grep -nE '^foo$'");
  });
});

describe('grep', () => {
  it('is pure: the same t and height always give the same frame', () => {
    expect(grep.render(4.25, 20)).toEqual(grep.render(4.25, 20));
  });

  it('fills the grid it is asked for, at any height', () => {
    for (const rows of [6, 12, 18, 40]) {
      const g = grep.render(3, rows);
      expect(g).toHaveLength(rows);
      for (const row of g) expect(row).toHaveLength(COLS);
    }
  });

  it('only uses colour roles the stylesheet knows, and never over-brightens', () => {
    for (let t = 0; t < 60; t += 0.5) {
      for (const row of grep.render(t, 20)) {
        for (const cell of row) {
          expect(ROLES).toContain(cell.color);
          expect(cell.op).toBeLessThanOrEqual(MAX_OP + 1e-9);
        }
      }
    }
  });

  it('lights up exactly the characters the pattern matches', () => {
    const pattern = new Map<string, string>();
    for (const s of SESSIONS) for (const line of s.lines) pattern.set(line, s.pattern);

    let checked = 0;
    for (let t = 0; t < 60; t += 0.9) {
      for (const row of grep.render(t, 24)) {
        const text = row.slice(PREFIX).map((c) => c.ch).join('').replace(/ +$/, '');
        const p = pattern.get(text);
        if (!p) continue;
        const mask = matchMask(p, text);
        for (let i = 0; i < text.length; i++) expect(row[i + PREFIX].bg === 'match').toBe(mask[i]);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(20);
  });

  it('only ever puts the match background under green text', () => {
    for (let t = 0; t < 60; t += 0.5) {
      for (const row of grep.render(t, 20)) {
        for (const cell of row) if (cell.bg === 'match') expect(cell.color).toBe('green');
      }
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/streams/grep.test.ts`
Expected: FAIL — `Failed to resolve import "./grep"`.

- [ ] **Step 3: Write the grep engine and its sessions**

Create `src/lib/streams/grep.ts`:

```ts
/**
 * The grep engine: real `grep -nE` sessions scrolling up the strip, newest at the bottom.
 *
 * The patterns are ERE that grep-go actually supports, and the two features it was built for
 * — backreferences and {n,m} ranges — lead. What lights up on a line is computed by running
 * the pattern against it, never marked by hand, so the highlight cannot disagree with the
 * command above it.
 */
import type { Cell } from '../diagram';
import { DENSITY, MAX_OP, blankGrid, edge, type Stream } from './engine';

export interface GrepSession {
  /** the ERE, exactly as it appears in the command line above the output */
  pattern: string;
  lines: readonly string[];
}

export const COLS = 28;
/** `n:` and the space after it */
export const PREFIX = 3;

/**
 * Which characters of `text` the pattern matches. Builds a fresh RegExp every call: a shared
 * one carries `lastIndex` between calls, which would make `render` impure.
 */
export function matchMask(pattern: string, text: string): boolean[] {
  const mask = new Array<boolean>(text.length).fill(false);
  const re = new RegExp(pattern, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    // a zero-width match never advances lastIndex, so it would spin here forever
    if (m[0].length === 0) break;
    for (let i = m.index; i < m.index + m[0].length; i++) mask[i] = true;
  }
  return mask;
}

export const command = (s: GrepSession): string => `❯ grep -nE '${s.pattern}'`;

export const SESSIONS: readonly GrepSession[] = [
  {
    // backreferences: grep-go's headline extension
    pattern: '(\\w+) \\1',
    lines: ['the the quick brown fox', 'a cat sat on the mat', 'it is is broken', 'no repeats in this one', 'bar bar baz', 'to be or not to be'],
  },
  {
    // {n,m} ranges, anchored
    pattern: '^a{2,4}$',
    lines: ['a', 'aa', 'aaa', 'aaaa', 'aaaaa', 'aaab'],
  },
  {
    // a negated character class between anchors
    pattern: '^[^0-9]+$',
    lines: ['hello world', 'abc123', 'only letters here', '42', 'no digits at all', 'v2'],
  },
  {
    // alternation, a group and an optional quantifier — and `catalog`, which matches too
    pattern: '(cat|dog)s?',
    lines: ['two cats on the wall', 'one dog barking', 'a bird in the tree', 'dogs and cats', 'nothing here at all', 'catalog'],
  },
  {
    // character classes — note `root@localhost` has no dot, so it does not match
    pattern: '\\w+@\\w+\\.\\w+',
    lines: ['mail alex@example.com', 'cc: bob@corp.io', 'no address in this line', 'ping root@localhost', 'from ci@github.com now', 'x@y is not one'],
  },
];

type Row =
  | { kind: 'cmd'; text: string }
  | { kind: 'line'; text: string; pattern: string; n: number }
  | { kind: 'gap' };

/** The sessions flattened into the scrolling list: a command, its numbered output, a blank. */
const ROWS: readonly Row[] = SESSIONS.flatMap((s): Row[] => [
  { kind: 'cmd', text: command(s) },
  ...s.lines.map((text, i): Row => ({ kind: 'line', text, pattern: s.pattern, n: i + 1 })),
  { kind: 'gap' },
]);

/** The strip scrolls at this many lines a second. */
const RATE = 1.1;
const SEED = 4;

export const grep: Stream = {
  cols: COLS,
  render(t, rows) {
    const g = blankGrid(COLS, rows);
    const head = Math.floor(t * RATE * DENSITY + SEED * 5);

    for (let r = rows - 1; r >= 0; r--) {
      const i = head - (rows - 1 - r);
      if (i < 0) continue;
      const row = ROWS[i % ROWS.length];
      if (row.kind === 'gap') continue;
      const op = MAX_OP * edge(r, rows);

      if (row.kind === 'cmd') {
        for (let k = 0; k < row.text.length && k < COLS; k++) {
          g[r][k] = { ch: row.text[k], color: k === 0 ? 'green' : 'fg', op };
        }
        continue;
      }

      const mask = matchMask(row.pattern, row.text);
      const any = mask.some(Boolean);
      const n = `${row.n}:`;
      for (let k = 0; k < n.length && k < COLS; k++) g[r][k] = { ch: n[k], color: 'faint', op };
      for (let k = 0; k < row.text.length && k + PREFIX < COLS; k++) {
        const hit = mask[k];
        g[r][k + PREFIX] = {
          ch: row.text[k],
          // a matching line reads as found, a line with no match recedes
          color: hit ? 'green' : any ? 'fg' : 'faint',
          op: hit ? op : op * (any ? 0.9 : 0.6),
          bg: hit ? 'match' : undefined,
        };
      }
    }

    return g;
  },
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/streams/grep.test.ts`
Expected: PASS, 14 tests.

- [ ] **Step 5: Eyeball one frame**

Run:

```bash
npx vite-node -e "const { grep } = await import('./src/lib/streams/grep.ts'); \
console.log(grep.render(9, 18).map((r) => r.map((c) => (c.op > 0 ? c.ch : ' ')).join('')).join('\n'))"
```

Expected: a `❯ grep -nE '…'` line followed by numbered output lines, nothing wider than 28 columns.

- [ ] **Step 6: Commit**

```bash
git add src/lib/streams/grep.ts src/lib/streams/grep.test.ts
git commit -m "feat: the grep engine, with real ERE sessions"
```

---

### Task 4: The dialog engine, and the http script

A client/server exchange scrolling upward: client lines left behind `▶`, server replies right-aligned ahead of `◀`, failures red.

**Files:**
- Create: `src/lib/streams/dialog.ts`
- Test: `src/lib/streams/dialog.test.ts`

**Interfaces:**
- Consumes: `Stream`, `blankGrid`, `edge`, `DENSITY`, `MAX_OP` from `./engine`; `Cell`, `Role` from `../diagram`.
- Produces:
  - `interface DialogLine { side: 'c' | 's'; text: string; meta?: boolean }`
  - `isError(text: string): boolean`
  - `dialog(t, cols, rows, script, seed): Cell[][]`
  - `HTTP: readonly DialogLine[]`, `http: Stream` (30 columns)
  - Task 5 appends `REDIS`/`redis`, `DNS`/`dns`, `TORRENT`/`bittorrent` to this same file.

- [ ] **Step 1: Write the failing test**

Create `src/lib/streams/dialog.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import type { Cell, Role } from '../diagram';
import { MAX_OP } from './engine';
import { HTTP, http, isError } from './dialog';

const ROLES: Role[] = ['fg', 'muted', 'dim', 'faint', 'accent', 'blue', 'green', 'peach', 'teal', 'orange', 'red', 'mauve'];

/** The columns of a row that carry ink, in order. */
const ink = (row: Cell[]): number[] => row.flatMap((c, i) => (c.op > 0 ? [i] : []));

describe('isError', () => {
  it('reads a protocol failure', () => {
    for (const text of ['-ERR unknown command', '-WRONGTYPE', '400 Bad Request', '404 Not Found', '500 Internal Server Error', 'NXDOMAIN', 'choke']) {
      expect(isError(text)).toBe(true);
    }
  });

  it('leaves a success alone', () => {
    for (const text of ['200 OK', '+OK', '+PONG', '+QUEUED', 'unchoke', '= 93.184.216.34', ':1']) {
      expect(isError(text)).toBe(false);
    }
  });
});

describe('http', () => {
  it('is pure: the same t and height always give the same frame', () => {
    expect(http.render(4.25, 20)).toEqual(http.render(4.25, 20));
  });

  it('fills the grid it is asked for, at any height', () => {
    for (const rows of [6, 12, 18, 40]) {
      const g = http.render(3, rows);
      expect(g).toHaveLength(rows);
      for (const row of g) expect(row).toHaveLength(http.cols);
    }
  });

  it('only uses colour roles the stylesheet knows, and never over-brightens', () => {
    for (let t = 0; t < 60; t += 0.5) {
      for (const row of http.render(t, 20)) {
        for (const cell of row) {
          expect(ROLES).toContain(cell.color);
          expect(cell.op).toBeLessThanOrEqual(MAX_OP + 1e-9);
        }
      }
    }
  });

  it('every line fits the strip, markers included', () => {
    for (const line of HTTP) expect(line.text.length + 2).toBeLessThanOrEqual(http.cols);
  });

  it('puts client lines on the left edge and replies on the right', () => {
    for (let t = 0; t < 60; t += 0.5) {
      for (const row of http.render(t, 20)) {
        const cols = ink(row);
        if (cols.length === 0) continue;
        if (row[cols[0]].ch === '▶') expect(cols[0]).toBe(0);
        else expect(cols[cols.length - 1]).toBe(http.cols - 1);
      }
    }
  });

  it('draws a failed reply red and a successful one green', () => {
    for (let t = 0; t < 60; t += 0.5) {
      for (const row of http.render(t, 20)) {
        const cols = ink(row);
        if (cols.length === 0) continue;
        const text = cols.map((i) => row[i].ch).join('');
        if (!text.endsWith(' ◀')) continue;
        const color = row[cols[0]].color;
        if (color === 'dim') continue; // metadata is dim whichever side it is on
        expect(color).toBe(isError(text.slice(0, -2)) ? 'red' : 'green');
      }
    }
  });

  it('uses only routes and headers go_http actually serves', () => {
    const text = HTTP.map((l) => l.text);
    expect(text).toContain('GET /yourproblem');
    expect(text).toContain('GET /myproblem');
    expect(text.some((t) => t.startsWith('Transfer-Encoding: chunked'))).toBe(true);
    // the trailers the course computes once the body is fully sent
    expect(text.some((t) => t.startsWith('X-Content-SHA256:'))).toBe(true);
    expect(text.some((t) => t.startsWith('X-Content-Length:'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/streams/dialog.test.ts`
Expected: FAIL — `Failed to resolve import "./dialog"`.

- [ ] **Step 3: Write the dialog engine and the http script**

Create `src/lib/streams/dialog.ts`:

```ts
/**
 * The dialog engine: a protocol exchange scrolling up the strip, newest line at the bottom.
 * The client speaks on the left behind `▶`, the server answers right-aligned ahead of `◀`.
 *
 * Every payload here is valid for its protocol and limited to what that project actually
 * implements. The repos are implementations, not transcripts, so these lines are written
 * against the protocols rather than copied — but they are written correctly, and the tests
 * check the parts that can be checked mechanically.
 */
import type { Cell, Role } from '../diagram';
import { DENSITY, MAX_OP, blankGrid, edge, type Stream } from './engine';

export interface DialogLine {
  side: 'c' | 's';
  text: string;
  /** a header, a TTL, a keep-alive — the parts around the exchange rather than in it */
  meta?: boolean;
}

/** The strip scrolls at this many lines a second. */
const RATE = 1.1;
/** The markers are punctuation, so they sit back from the line they mark. */
const MARKER_OP = 0.6;

/** Anything these protocols would call a failure. */
export function isError(text: string): boolean {
  return /^(-|4\d\d|5\d\d|NXDOMAIN|choke$)/.test(text);
}

function tone(line: DialogLine): Role {
  if (line.meta) return 'dim';
  if (line.side === 'c') return 'blue';
  return isError(line.text) ? 'red' : 'green';
}

export function dialog(
  t: number,
  cols: number,
  rows: number,
  script: readonly DialogLine[],
  seed: number,
): Cell[][] {
  const g = blankGrid(cols, rows);
  const head = Math.floor(t * RATE * DENSITY + seed * 7);

  for (let r = rows - 1; r >= 0; r--) {
    const i = head - (rows - 1 - r);
    if (i < 0) continue;
    const line = script[i % script.length];
    const color = tone(line);
    const text = line.side === 'c' ? `▶ ${line.text}` : `${line.text} ◀`;
    const x = line.side === 'c' ? 0 : Math.max(0, cols - text.length);
    // the newest line is the one being spoken
    const op = (i === head ? 1 : 0.85) * MAX_OP * edge(r, rows);

    for (let k = 0; k < text.length && x + k < cols; k++) {
      const marker = line.side === 'c' ? k < 2 : k >= text.length - 2;
      g[r][x + k] = { ch: text[k], color, op: marker ? op * MARKER_OP : op };
    }
  }

  return g;
}

/* ---- http ---- */

const HTTP_COLS = 30;

/**
 * go_http from the client's side. The routes are the ones the Boot.dev course defines —
 * `/yourproblem` answers 400, `/myproblem` answers 500, `/httpbin/stream/N` is proxied and
 * re-chunked, `/video` is streamed from disk — and the trailers are the ones it computes once
 * the body is fully sent. The rejected request has a space in its field name, which is not in
 * the RFC 9110 tchar set, so the header parser refuses it.
 */
export const HTTP: readonly DialogLine[] = [
  { side: 'c', text: 'GET / HTTP/1.1' },
  { side: 'c', text: 'Host: localhost:42069', meta: true },
  { side: 's', text: '200 OK' },
  { side: 's', text: 'Content-Length: 78', meta: true },
  { side: 'c', text: 'GET /video HTTP/1.1' },
  { side: 's', text: '200 OK' },
  { side: 's', text: 'Content-Type: video/mp4', meta: true },
  { side: 'c', text: 'GET /httpbin/stream/100' },
  { side: 's', text: '200 OK' },
  { side: 's', text: 'Transfer-Encoding: chunked', meta: true },
  { side: 's', text: 'X-Content-SHA256: a3f5c9…', meta: true },
  { side: 's', text: 'X-Content-Length: 4096', meta: true },
  { side: 'c', text: 'GET /yourproblem' },
  { side: 'c', text: 'Bad Header : nope', meta: true },
  { side: 's', text: '400 Bad Request' },
  { side: 'c', text: 'GET /nowhere' },
  { side: 's', text: '404 Not Found' },
  { side: 'c', text: 'GET /myproblem' },
  { side: 's', text: '500 Internal Server Error' },
  { side: 'c', text: 'Connection: keep-alive', meta: true },
];

export const http: Stream = {
  cols: HTTP_COLS,
  render: (t, rows) => dialog(t, HTTP_COLS, rows, HTTP, 1),
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/streams/dialog.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/streams/dialog.ts src/lib/streams/dialog.test.ts
git commit -m "feat: the dialog engine, and the http exchange"
```

---

### Task 5: The redis, dns and bittorrent scripts

Three more dialogs on the same engine. This task is where the "payloads must be valid" rule earns its tests: RESP array headers must state the true element count, `$n` the true byte length, and the peer wire the real block size.

**Files:**
- Modify: `src/lib/streams/dialog.ts` (append three scripts and three streams)
- Modify: `src/lib/streams/dialog.test.ts` (append the shared and per-protocol checks)

**Interfaces:**
- Consumes: `dialog`, `DialogLine`, `isError` from Task 4.
- Produces: `REDIS`, `redis: Stream`; `DNS`, `dns: Stream`; `TORRENT`, `bittorrent: Stream` — all 26 columns.

- [ ] **Step 1: Write the failing test**

Extend the existing `./dialog` import at the top of `src/lib/streams/dialog.test.ts` to:

```ts
import { DNS, HTTP, REDIS, TORRENT, bittorrent, dns, http, isError, redis, type DialogLine } from './dialog';
```

and extend the `./engine` import to bring in the `Stream` type:

```ts
import { MAX_OP, type Stream } from './engine';
```

Then append to the same file. http already has these four checks from Task 4, so the loop
covers the three new protocols only:

```ts
const DIALOGS: [string, Stream, readonly DialogLine[]][] = [
  ['redis', redis, REDIS],
  ['dns', dns, DNS],
  ['bittorrent', bittorrent, TORRENT],
];

describe.each(DIALOGS)('%s', (_name, stream, script) => {
  it('is pure: the same t and height always give the same frame', () => {
    expect(stream.render(4.25, 20)).toEqual(stream.render(4.25, 20));
  });

  it('fills the grid it is asked for, at any height', () => {
    for (const rows of [6, 12, 18, 40]) {
      const g = stream.render(3, rows);
      expect(g).toHaveLength(rows);
      for (const row of g) expect(row).toHaveLength(stream.cols);
    }
  });

  it('every line fits the strip, markers included', () => {
    for (const line of script) expect(line.text.length + 2).toBeLessThanOrEqual(stream.cols);
  });

  it('puts client lines on the left edge and replies on the right', () => {
    for (let t = 0; t < 60; t += 0.5) {
      for (const row of stream.render(t, 20)) {
        const cols = ink(row);
        if (cols.length === 0) continue;
        if (row[cols[0]].ch === '▶') expect(cols[0]).toBe(0);
        else expect(cols[cols.length - 1]).toBe(stream.cols - 1);
      }
    }
  });
});

describe('the RESP exchange', () => {
  const arrays = REDIS.filter((l) => /^\*\d/.test(l.text));

  it('states the true element count in every array header', () => {
    expect(arrays.length).toBeGreaterThan(10);
    for (const line of arrays) {
      const [head, ...elements] = line.text.split(' ');
      expect(elements).toHaveLength(Number(head.slice(1)));
    }
  });

  it('states the true byte length in every bulk string', () => {
    const bulk = REDIS.filter((l) => /^\$\d/.test(l.text));
    expect(bulk.length).toBeGreaterThan(0);
    for (const line of bulk) {
      const [head, value] = [line.text.slice(0, line.text.indexOf(' ')), line.text.slice(line.text.indexOf(' ') + 1)];
      expect(value).toHaveLength(Number(head.slice(1)));
    }
  });

  it('uses the real null representations', () => {
    const text = REDIS.map((l) => l.text);
    expect(text).toContain('$-1'); // a key that expired
    expect(text).toContain('*-1'); // a transaction WATCH aborted
  });

  it('covers what redis-go implements', () => {
    const commands = REDIS.filter((l) => l.side === 'c' && /^\*\d/.test(l.text)).map((l) => l.text.split(' ')[1]);
    for (const c of ['PING', 'SET', 'GET', 'INCR', 'XADD', 'MULTI', 'EXEC', 'WATCH', 'PSYNC', 'WAIT']) {
      expect(commands).toContain(c);
    }
  });
});

describe('the DNS exchange', () => {
  it('asks only for record types dns-go answers', () => {
    const queries = DNS.filter((l) => l.text.startsWith('? '));
    expect(queries.length).toBeGreaterThan(3);
    for (const q of queries) expect(['A', 'AAAA', 'CNAME']).toContain(q.text.split(' ').at(-1));
  });

  it('shows the parts that are the actual work', () => {
    const text = DNS.map((l) => l.text);
    // 0xC00C is the canonical compression pointer: the name at offset 12, where the question starts
    expect(text.some((t) => t.includes('0xC00C') && t.includes('offset 12'))).toBe(true);
    expect(text.some((t) => t.startsWith('hdr QR='))).toBe(true);
    expect(text.some((t) => t.startsWith('fwd '))).toBe(true);
    expect(text).toContain('NXDOMAIN');
    expect(text).toContain('RCODE=3');
  });
});

describe('the peer wire exchange', () => {
  it('states the handshake prefix length in decimal', () => {
    // the pstrlen byte is 0x13 — 19 — followed by the 19 characters of `BitTorrent protocol`
    const shake = TORRENT.find((l) => l.text.startsWith('handshake'));
    expect(shake?.text).toBe('handshake 19 BitTorrent');
    expect('BitTorrent protocol').toHaveLength(19);
  });

  it('requests 16 KiB blocks', () => {
    const requests = TORRENT.filter((l) => l.text.startsWith('request '));
    expect(requests.length).toBeGreaterThan(1);
    for (const r of requests) {
      const [, index, begin, length] = r.text.split(' ');
      expect(Number(length)).toBe(16384);
      expect(Number(begin) % 16384).toBe(0);
      expect(Number.isInteger(Number(index))).toBe(true);
    }
  });

  it('chokes and unchokes, and only choke reads as a failure', () => {
    const text = TORRENT.map((l) => l.text);
    expect(text).toContain('choke');
    expect(text).toContain('unchoke');
    expect(isError('choke')).toBe(true);
    expect(isError('unchoke')).toBe(false);
  });

  it('covers the magnet path too', () => {
    const text = TORRENT.map((l) => l.text);
    expect(text.some((t) => t.includes('ut_metadata'))).toBe(true);
    expect(text.some((t) => t.startsWith('metadata '))).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/streams/dialog.test.ts`
Expected: FAIL — `REDIS is not exported by ./dialog`.

- [ ] **Step 3: Write the three scripts**

Append to `src/lib/streams/dialog.ts`:

```ts
/* ---- redis ---- */

const NARROW_COLS = 26;

/**
 * redis-go over RESP. A client line carries the true array header for the command it sends;
 * a reply carries its real type byte — `+` simple string, `$` bulk string with its byte
 * length, `:` integer, `*` array, `-` error, and the null forms `$-1` and `*-1`.
 *
 * The exchange covers what redis-go implements: strings with expiry, INCR, streams,
 * transactions with optimistic locking, and leader-follower replication.
 */
export const REDIS: readonly DialogLine[] = [
  { side: 'c', text: '*1 PING' },
  { side: 's', text: '+PONG' },
  { side: 'c', text: '*3 SET mykey hello' },
  { side: 's', text: '+OK' },
  { side: 'c', text: '*2 GET mykey' },
  { side: 's', text: '$5 hello' },
  { side: 'c', text: '*5 SET tmp v PX 100' },
  { side: 's', text: '+OK' },
  { side: 'c', text: '*2 GET tmp' },
  { side: 's', text: '$-1', meta: true },
  { side: 'c', text: '*2 INCR hits' },
  { side: 's', text: ':1' },
  { side: 'c', text: '*5 XADD s * temp 36' },
  { side: 's', text: '$12 1526919030-0' },
  { side: 'c', text: '*1 MULTI' },
  { side: 's', text: '+OK' },
  { side: 'c', text: '*3 SET k 1' },
  { side: 's', text: '+QUEUED' },
  { side: 'c', text: '*2 INCR k' },
  { side: 's', text: '+QUEUED' },
  { side: 'c', text: '*1 EXEC' },
  { side: 's', text: '*2 +OK :2' },
  { side: 'c', text: '*2 WATCH k' },
  { side: 's', text: '+OK' },
  { side: 'c', text: '*1 EXEC' },
  { side: 's', text: '*-1', meta: true },
  { side: 'c', text: '*3 FOO bar baz' },
  { side: 's', text: '-ERR unknown command' },
  { side: 'c', text: '*2 LPOP mykey' },
  { side: 's', text: '-WRONGTYPE' },
  { side: 'c', text: '*3 PSYNC ? -1' },
  { side: 's', text: '+FULLRESYNC a3f5c9… 0' },
  { side: 's', text: '*3 REPLCONF GETACK *' },
  { side: 'c', text: '*3 REPLCONF ACK 37' },
  { side: 'c', text: '*3 WAIT 1 500' },
  { side: 's', text: ':1' },
];

export const redis: Stream = {
  cols: NARROW_COLS,
  render: (t, rows) => dialog(t, NARROW_COLS, rows, REDIS, 2),
};

/* ---- dns ---- */

/**
 * dns-go, as query and answer. The metadata lines are the parts that are the actual work:
 * the bit-packed header flags, a compression pointer resolved (0xC00C is the canonical one —
 * the name at offset 12, where the question section starts), and the upstream it forwards to.
 */
export const DNS: readonly DialogLine[] = [
  { side: 'c', text: '? example.com A' },
  { side: 's', text: '= 93.184.216.34' },
  { side: 's', text: 'ttl 3600 · IN A', meta: true },
  { side: 'c', text: '? codecrafters.io A' },
  { side: 's', text: '= 76.76.21.21' },
  { side: 'c', text: '? example.com AAAA' },
  { side: 's', text: '= 2606:2800:220:1:248:…' },
  { side: 'c', text: '? www.example.com CNAME' },
  { side: 's', text: '= example.com.' },
  { side: 's', text: 'ptr 0xC00C → offset 12', meta: true },
  { side: 's', text: 'fwd 8.8.8.8:53', meta: true },
  { side: 'c', text: '? nope.invalid A' },
  { side: 's', text: 'NXDOMAIN' },
  { side: 's', text: 'RCODE=3', meta: true },
  { side: 's', text: 'hdr QR=1 AA=0 RD=1 RA=1', meta: true },
];

export const dns: Stream = {
  cols: NARROW_COLS,
  render: (t, rows) => dialog(t, NARROW_COLS, rows, DNS, 3),
};

/* ---- bittorrent ---- */

/**
 * bittorrent-go on the peer wire. The handshake's pstrlen byte is 0x13 — 19 decimal —
 * followed by the nineteen characters of `BitTorrent protocol`. Blocks are 16 KiB, which is
 * what `request` asks for and what `piece` returns, and the run ends on the ut_metadata
 * exchange (BEP 9/10) that magnet links use to fetch the torrent metadata from a peer.
 */
export const TORRENT: readonly DialogLine[] = [
  { side: 'c', text: 'announce info_hash=…' },
  { side: 's', text: 'peers 5 · interval 60', meta: true },
  { side: 'c', text: 'handshake 19 BitTorrent' },
  { side: 's', text: 'peer_id 2d5254…' },
  { side: 's', text: 'bitfield ▓▓▓░░░░░', meta: true },
  { side: 'c', text: 'interested' },
  { side: 's', text: 'unchoke' },
  { side: 'c', text: 'request 12 0 16384' },
  { side: 's', text: 'piece 12 0 ▓' },
  { side: 'c', text: 'request 12 16384 16384' },
  { side: 's', text: 'piece 12 16384 ▓' },
  { side: 's', text: 'sha1 ok · piece 12', meta: true },
  { side: 'c', text: 'have 12' },
  { side: 's', text: 'choke' },
  { side: 'c', text: 'keep-alive', meta: true },
  { side: 's', text: 'unchoke' },
  { side: 'c', text: 'extended ut_metadata' },
  { side: 's', text: 'ut_metadata id 1' },
  { side: 'c', text: 'metadata request 0' },
  { side: 's', text: 'metadata data 0 ▓' },
];

export const bittorrent: Stream = {
  cols: NARROW_COLS,
  render: (t, rows) => dialog(t, NARROW_COLS, rows, TORRENT, 4),
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/lib/streams/dialog.test.ts`
Expected: PASS. The `describe.each` adds four checks for each of the three new protocols, on top of Task 4's http block and the protocol-validity blocks below it.

- [ ] **Step 5: Eyeball one frame of each**

Run:

```bash
npx vite-node -e "const m = await import('./src/lib/streams/dialog.ts'); \
for (const n of ['http', 'redis', 'dns', 'bittorrent']) { console.log('--- ' + n); \
  console.log(m[n].render(11, 16).map((r) => r.map((c) => (c.op > 0 ? c.ch : ' ')).join('').replace(/ +$/, '')).join('\n')); }"
```

Expected: four exchanges, `▶` lines flush left and `◀` lines flush right, nothing wider than the strip.

- [ ] **Step 6: Commit**

```bash
git add src/lib/streams/dialog.ts src/lib/streams/dialog.test.ts
git commit -m "feat: the redis, dns and bittorrent exchanges"
```

---

### Task 6: The registry, the schema, and the seven opt-ins

Wire the streams into the content model. Nothing renders yet — this task's deliverable is that the build validates a `stream:` id and rejects a typo.

**Files:**
- Create: `src/lib/streams/index.ts`
- Test: `src/lib/streams/index.test.ts`
- Modify: `src/content.config.ts:1` (import) and the `projectSchema` object
- Modify: all seven of `src/content/projects/from_scratch/*.md`

**Interfaces:**
- Consumes: `git`, `interpreter` from `./rain`; `grep` from `./grep`; `http`, `redis`, `dns`, `bittorrent` from `./dialog`; `Stream` from `./engine`.
- Produces: `STREAM_IDS`, `StreamId`, `STREAMS: Record<StreamId, Stream>`, and a re-export of `Stream`. `src/scripts/stream.ts` and `src/components/MarginStream.astro` import `StreamId` from here.

- [ ] **Step 1: Write the failing test**

Create `src/lib/streams/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { STREAMS, STREAM_IDS } from './index';

const pages = import.meta.glob('/src/content/projects/from_scratch/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

describe('the registry', () => {
  it('has a stream for every id and an id for every stream', () => {
    expect(Object.keys(STREAMS).sort()).toEqual([...STREAM_IDS].sort());
  });

  it('gives every stream a positive column count', () => {
    for (const id of STREAM_IDS) expect(STREAMS[id].cols).toBeGreaterThan(0);
  });
});

describe('the from_scratch pages', () => {
  it('each opts into exactly one stream, and between them they use all seven', () => {
    const paths = Object.keys(pages).sort();
    expect(paths).toHaveLength(STREAM_IDS.length);

    const used = paths.map((path) => {
      const m = /^stream:\s*(\S+)\s*$/m.exec(pages[path]);
      expect(m, `${path} has no stream: line`).not.toBeNull();
      return m![1];
    });
    expect(used.sort()).toEqual([...STREAM_IDS].sort());
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/lib/streams/index.test.ts`
Expected: FAIL — `Failed to resolve import "./index"`.

- [ ] **Step 3: Write the registry**

Create `src/lib/streams/index.ts`:

```ts
/**
 * Every margin stream the site can put on a project page. A project opts in with
 * `stream: <id>` in its frontmatter; the id is validated against this list by the content
 * schema, so a typo fails the build.
 *
 * Unlike a diagram, a stream is never drawn on the server — its height is whatever the pane
 * allows. So this registry serves the schema and the tests; the client loads one renderer on
 * demand (see scripts/stream.ts).
 */
import { bittorrent, dns, http, redis } from './dialog';
import type { Stream } from './engine';
import { grep } from './grep';
import { git, interpreter } from './rain';

export type { Stream } from './engine';

export const STREAM_IDS = ['git', 'interpreter', 'grep', 'http', 'redis', 'dns', 'bittorrent'] as const;
export type StreamId = (typeof STREAM_IDS)[number];

export const STREAMS: Record<StreamId, Stream> = { git, interpreter, grep, http, redis, dns, bittorrent };
```

- [ ] **Step 4: Add the schema field**

In `src/content.config.ts`, add the import beside the existing `DIAGRAM_IDS` one:

```ts
import { STREAM_IDS } from './lib/streams';
```

and add this to `projectSchema`, directly after the `diagram` field:

```ts
    /** an animated text stream in the file view's right margin */
    stream: z.enum(STREAM_IDS).optional(),
```

- [ ] **Step 5: Opt the seven pages in**

Run:

```bash
cd src/content/projects/from_scratch
for f in git interpreter grep http redis dns bittorrent; do
  perl -0pi -e "s/^excerpts:/stream: $f\nexcerpts:/m" "$f.md"
done
grep -n 'stream:' *.md
```

Expected: seven lines, each `stream: <the file's own name>`.

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx vitest run src/lib/streams/index.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 7: Verify the schema accepts them and rejects a typo**

Run: `npm run build`
Expected: builds clean.

Then check the guard actually bites:

```bash
perl -0pi -e 's/^stream: git$/stream: gti/m' src/content/projects/from_scratch/git.md
npm run build; echo "exit: $?"
perl -0pi -e 's/^stream: gti$/stream: git/m' src/content/projects/from_scratch/git.md
```

Expected: the middle build FAILS with a Zod error naming `stream`, and the last command restores the file. Confirm with `git diff --stat src/content` that only the seven intended lines changed.

- [ ] **Step 8: Commit**

```bash
git add src/lib/streams/index.ts src/lib/streams/index.test.ts src/content.config.ts src/content/projects/from_scratch
git commit -m "feat: projects opt into a margin stream from their frontmatter"
```

---

### Task 7: The host element — the strips appear

**Files:**
- Create: `src/lib/measure.ts`
- Create: `src/components/MarginStream.astro`
- Create: `src/scripts/stream.ts`
- Modify: `src/scripts/train.ts:75-84` (drop the local `columnWidth`, import it instead)
- Modify: `src/layouts/Nvim.astro`
- Modify: `src/pages/projects/[...slug].astro`
- Modify: `src/styles/global.css` (the `---- margin streams ----` block from Task 1)

**Interfaces:**
- Consumes: `rowHtml` from `../lib/diagram`; `Stream`, `StreamId` from `../lib/streams`.
- Produces: `columnWidth(node: HTMLElement): number` from `src/lib/measure.ts`; the `<margin-stream>` custom element; `Nvim.astro`'s optional `stream?: StreamId` prop.

- [ ] **Step 1: Extract the column measurement**

Create `src/lib/measure.ts`:

```ts
/**
 * Width of one column of the buffer font, measured rather than assumed. A probe goes in
 * beside the node so it inherits the same font, is measured, and is taken straight back out.
 * Falls back to 9px, which is what the site's 15px JetBrains Mono actually measures.
 */
export function columnWidth(node: HTMLElement): number {
  const probe = document.createElement('span');
  probe.textContent = '0'.repeat(20);
  probe.style.cssText = 'position:absolute;visibility:hidden;white-space:pre';
  node.after(probe);
  const w = probe.getBoundingClientRect().width / 20;
  probe.remove();
  return w || 9;
}
```

In `src/scripts/train.ts`, delete the local `columnWidth` function and its doc comment, and add the import at the top of the file. **Match the quote style already used in that file** — it uses double quotes:

```ts
import { columnWidth } from "../lib/measure";
```

- [ ] **Step 2: Verify the train is untouched**

Run: `npm test && npm run check`
Expected: PASS both. The function moved verbatim, so nothing about the train changes.

- [ ] **Step 3: Commit the extraction on its own**

```bash
git add src/lib/measure.ts src/scripts/train.ts
git commit -m "refactor: column measurement moves to lib/measure, for a second user"
```

- [ ] **Step 4: Write the host component**

Create `src/components/MarginStream.astro`:

```astro
---
/**
 * The animated text stream in a file view's right margin.
 *
 * Unlike a diagram this is not content: the layout renders it into #main beside the train,
 * never through the buffer slot, so numberLines never sees it and it inherits the pane's
 * clipping. Nothing is drawn here either — the strip's height is whatever the pane allows,
 * which only the browser knows — so it starts hidden and scripts/stream.ts brings it up.
 */
import type { StreamId } from '../lib/streams';

interface Props { id: StreamId }
const { id } = Astro.props;
---
<margin-stream class="stream" data-id={id} aria-hidden="true" hidden></margin-stream>
```

- [ ] **Step 5: Write the client element**

Create `src/scripts/stream.ts`:

```ts
import { rowHtml } from '../lib/diagram';
import { columnWidth } from '../lib/measure';
import type { Stream, StreamId } from '../lib/streams';

/** Nothing here moves faster than this, so redrawing more often buys only CPU. */
const FPS = 20;
/** Prose is hard-wrapped to this many columns — WRAP_COLUMNS in lib/text. */
const PROSE = 80;
/** Columns between the end of the prose column and the strip. */
const GAP = 2;
/** Rows above the strip: the winbar, the buffer's top padding, and the title line. */
const TOP_ROWS = 3;
/** Below this the strip is too short to read as a column at all. */
const MIN_ROWS = 8;

/** One chunk per engine: a page downloads its own renderer and no others. */
const LOADERS: Record<StreamId, () => Promise<Stream>> = {
  git: () => import('../lib/streams/rain').then((m) => m.git),
  interpreter: () => import('../lib/streams/rain').then((m) => m.interpreter),
  grep: () => import('../lib/streams/grep').then((m) => m.grep),
  http: () => import('../lib/streams/dialog').then((m) => m.http),
  redis: () => import('../lib/streams/dialog').then((m) => m.redis),
  dns: () => import('../lib/streams/dialog').then((m) => m.dns),
  bittorrent: () => import('../lib/streams/dialog').then((m) => m.bittorrent),
};

class MarginStream extends HTMLElement {
  private stream: Stream | undefined;
  private rows: HTMLElement[] = [];
  private timer: number | undefined;
  private ro: ResizeObserver | undefined;
  private started = 0;
  private onVis = () => this.sync();

  async connectedCallback() {
    const id = this.dataset.id as StreamId | undefined;
    if (!id || !LOADERS[id]) return;
    // reduced motion gets nothing at all: a frozen frame of falling hex is noise, not a picture
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    this.stream = await LOADERS[id]();
    const pane = this.parentElement;
    if (!this.isConnected || !pane) return;

    this.style.setProperty('--cols', String(this.stream.cols));
    this.started = performance.now();
    this.ro = new ResizeObserver(() => this.layout());
    this.ro.observe(pane);
    document.addEventListener('visibilitychange', this.onVis);
    this.layout();
  }

  disconnectedCallback() {
    clearTimeout(this.timer);
    this.ro?.disconnect();
    document.removeEventListener('visibilitychange', this.onVis);
    this.classList.remove('page-effect');
  }

  /**
   * Measure the pane and decide whether the strip belongs here at all. It shows only where
   * there is room for the whole prose column, a gap, and the strip; below that the text and
   * the animation would be fighting over the same columns, so nothing is drawn.
   */
  private layout() {
    const pane = this.parentElement;
    if (!pane || !this.stream) return;

    const ch = columnWidth(this);
    const lh = parseFloat(getComputedStyle(this).lineHeight) || 22;
    const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 4;
    const fits = pane.clientWidth / ch >= gutter + PROSE + GAP + this.stream.cols;
    const rows = Math.floor((pane.clientHeight - TOP_ROWS * lh) / lh);

    if (!fits || rows < MIN_ROWS) return this.stand();
    if (rows !== this.rows.length) this.build(rows);
    this.hidden = false;
    // the train is the fallback, and stays in the shed while the strip is running
    this.classList.add('page-effect');
    this.sync();
  }

  /** No room for it here: draw nothing, and hand the page back to the train. */
  private stand() {
    clearTimeout(this.timer);
    this.hidden = true;
    this.classList.remove('page-effect');
    this.replaceChildren();
    this.rows = [];
  }

  private build(rows: number) {
    this.rows = Array.from({ length: rows }, () => document.createElement('div'));
    this.replaceChildren(...this.rows);
  }

  /** Animate only in a foreground tab. Pinned to the pane, the strip is always on screen. */
  private sync() {
    clearTimeout(this.timer);
    if (!this.hidden && document.visibilityState !== 'hidden') this.tick();
  }

  private tick = () => {
    const grid = this.stream!.render((performance.now() - this.started) / 1000, this.rows.length);
    grid.forEach((row, i) => {
      const el = this.rows[i];
      if (!el) return;
      const html = rowHtml(row);
      if (el.innerHTML !== html) el.innerHTML = html;
    });
    this.timer = window.setTimeout(this.tick, 1000 / FPS);
  };
}

if (!customElements.get('margin-stream')) customElements.define('margin-stream', MarginStream);
```

- [ ] **Step 6: Wire it into the layout**

In `src/layouts/Nvim.astro`:

Add to the imports:

```ts
import MarginStream from '../components/MarginStream.astro';
import type { StreamId } from '../lib/streams';
```

Add to the `Props` interface, after `shortPath: string;`:

```ts
  stream?: StreamId;
```

Change the destructure to:

```ts
const { title, description, crumb, short, path, shortPath, stream } = Astro.props;
```

Add the element immediately after `<Train />`:

```astro
        {stream && <MarginStream id={stream} />}
```

Add to the script block, after the diagram import:

```ts
      import '../scripts/stream';
```

In `src/pages/projects/[...slug].astro`, add `stream={d.stream}` to the `<Nvim>` props, after `shortPath={...}`.

- [ ] **Step 7: Style it**

In `src/styles/global.css`, insert this **above** the `.stream .bg-match` rule added in Task 1, inside the same `---- margin streams ----` section:

```css
/* The animated strip in a file view's right margin. It is not content: it sits over the
   pane, pinned below the title row, and stays put while the buffer scrolls under it.
   The background is the pane's own colour — the trick .train span uses — so where one of
   the handful of code lines long enough to reach it does, the strip reads as being in front
   of it rather than tangled with it, and the top and bottom fades resolve against the right
   ground. It never covers prose: scripts/stream.ts hides it unless the pane is wide enough
   for the full 80-column prose column as well. */
.stream {
  position: absolute;
  top: calc(3 * var(--lh));
  right: 2ch;
  width: calc(var(--cols) * 1ch);
  z-index: 3; /* under the train's 4 */
  white-space: pre;
  background: var(--bg);
  /* it floats over the buffer, so it must never swallow a click or a drag */
  pointer-events: none;
  user-select: none;
}
.stream > div { height: var(--lh); }
```

- [ ] **Step 8: Build and typecheck**

Run: `npm run check && npm run build && npm test`
Expected: PASS all three.

- [ ] **Step 9: See it in a real browser**

Run: `npm run dev`, then check every item:

- All seven pages at a window wide enough for the strip (~1512px): `/projects/from_scratch/{git,interpreter,grep,http,redis,dns,bittorrent}`. Each shows its own strip in the right margin, starting below the title line, faded at top and bottom, no border or visible panel.
- Scroll a page: the strip stays put while the buffer moves under it.
- Narrow the window until the strip disappears; widen it until it comes back. It must never appear on top of prose, and must never leave a half-width strip behind.
- With the window narrow, confirm the train runs again (wait for its slot, or check `document.querySelector('.page-effect')` is null in the console).
- On a phone viewport: no strip at all.
- Toggle `prefers-reduced-motion` in devtools and reload: no strip, and the train is gone too.
- Click a link that passes under the strip and confirm it still works (`pointer-events: none`).
- Navigate between two stream pages and back: the strip restarts cleanly, with no duplicate elements.
- Safari as well as Chrome, since the character grid has sheared there before.

- [ ] **Step 10: Commit**

```bash
git add src/components/MarginStream.astro src/scripts/stream.ts src/layouts/Nvim.astro src/pages/projects/[...slug].astro src/styles/global.css
git commit -m "feat: margin streams on the from_scratch pages"
```

---

### Task 8: Glyph coverage and documentation

The last guard and the docs. A glyph JetBrains Mono does not carry falls back to another face at a different advance width and shears the row it sits on — the whitelist catches that before it ships rather than after someone spots a crooked column.

**Files:**
- Modify: `src/lib/diagrams/glyphs.test.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: `STREAMS`, `STREAM_IDS` from `../streams`.
- Produces: nothing.

- [ ] **Step 1: Write the failing test**

In `src/lib/diagrams/glyphs.test.ts`, add the import beside the existing ones:

```ts
import { STREAMS, STREAM_IDS } from '../streams';
```

and append this block at the end of the file:

```ts
describe.each(STREAM_IDS)('stream %s', (id) => {
  const stream = STREAMS[id];

  it('draws only glyphs that are one cell wide in JetBrains Mono', () => {
    const used = new Set<string>();
    // two heights, because a stream takes its row count as an argument: a short strip shows a
    // different window of a script than a tall one does
    for (const rows of [12, 30]) {
      for (let t = 0; t < 70; t += 0.25) {
        for (const row of stream.render(t, rows)) for (const cell of row) used.add(cell.ch);
      }
    }
    expect([...used].filter((ch) => !SAFE.has(ch))).toEqual([]);
  });

  it('fills the grid it is asked for', () => {
    for (const rows of [12, 30]) {
      const grid = stream.render(0, rows);
      expect(grid).toHaveLength(rows);
      for (const row of grid) expect(row).toHaveLength(stream.cols);
    }
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run src/lib/diagrams/glyphs.test.ts`
Expected: PASS. Every glyph the streams use — `▶ ◀ ▓ ░ ❯ · → …` — is already in `SAFE`. If anything else shows up, it must be confirmed present in the font subset (README > Icons) before it ships; do not widen `SAFE` to make the test go green.

- [ ] **Step 3: Document it**

In `README.md`, add this section directly after the "Add a diagram" section and before "Add a code excerpt":

```markdown
## Add a margin stream

A project can carry an animated text stream in the right margin of its file view, opted into
with `stream: <id>` in its frontmatter. The seven `from_scratch` projects each have one. Like a
diagram it is a pure `render(t, rows)` over a character grid, in `src/lib/streams/`, registered
in `src/lib/streams/index.ts`; the content schema validates the id against that list, so a typo
fails the build.

Three engines cover all seven: `rain.ts` drops words down fixed lanes (git, interpreter),
`grep.ts` scrolls real `grep -nE` sessions with the matches lit, and `dialog.ts` scrolls a
client/server exchange (http, redis, dns, bittorrent).

A stream is **not** content, and that is the whole difference from a diagram:

- The layout renders it into `#main` beside the train, never through the buffer slot, so it
  never picks up a line number and it inherits the pane's clipping.
- It takes `rows` as an argument and fills whatever pane it is given, so there is no fixed grid
  and **no server-rendered first frame**. Under `prefers-reduced-motion` the page simply has no
  strip: a frozen frame of falling hex is noise, not a picture, so there is nothing worth
  keeping.
- `scripts/stream.ts` measures the pane and shows the strip only where there is room for the
  full 80-column prose column, a gap, and the strip. Below that it draws nothing, and because
  it carries `.page-effect` only while it is actually drawing, the train takes the page back.

**Write the copy against the protocol, not from the repo.** These projects are implementations,
not transcripts, so there are no sample sessions to copy — the lines are written by hand, and
they have to be right: true RESP array counts and bulk-string lengths, real DNS records, the
real 16 KiB BitTorrent block size, ERE that grep-go actually supports. The tests in
`src/lib/streams/*.test.ts` check what can be checked mechanically; the rest is on you.

**One glyph, one cell**, exactly as for diagrams — `glyphs.test.ts` covers the streams too.
```

- [ ] **Step 4: Run the whole suite one more time**

Run: `npm test && npm run check && npm run build && npm run test:e2e`
Expected: PASS all four. `test:e2e` still reports four tests — this plan adds none.

- [ ] **Step 5: Commit**

```bash
git add src/lib/diagrams/glyphs.test.ts README.md
git commit -m "test: glyph coverage for the margin streams, and the docs for adding one"
```

---

## Done when

- [ ] All seven `from_scratch` pages show their own strip on a wide window, and none of them shows one on a phone.
- [ ] `npm test`, `npm run check`, `npm run build` and `npm run test:e2e` all pass.
- [ ] `e2e/guards.spec.ts` is still four tests.
- [ ] The strip never overlaps prose at any window width, and never leaves a partial strip behind while resizing.
- [ ] `prefers-reduced-motion` leaves the pages with no strip and no train.
- [ ] Checked in both Chrome and Safari.
