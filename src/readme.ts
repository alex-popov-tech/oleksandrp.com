/**
 * README.sh — the about page as a shell session. Each command is a section of the bio; the
 * playback lives in lib/session.ts, this is only the content.
 *
 * The keyboard is the real GALLIUM layer from ~/me/zmk/zmk-skean/config/skean.keymap, and
 * the language table is a real count — see src/languages.ts.
 */
import { LANGUAGES, LANGUAGE_TOTAL } from './languages';
import type { Command, Output, Row, Span } from './lib/session';
import { hardWrap } from './lib/text';
import { SITE } from './site';

const BIO = [
  'Currently writing Go for things that already exist: Redis, DNS, Git, BitTorrent and HTTP — each built from the wire up, with no library doing the interesting part.',
  'Before that, TypeScript on the web and inside test frameworks. Lua in between, for Neovim plugins and a config I keep tweaking.',
];

/** the four projects worth opening first, in the order they are worth opening */
const START_HERE = [
  { name: 'redis.go', href: '/projects/from_scratch/redis', note: 'a Redis server that redis-cli cannot tell apart' },
  { name: 'git.go', href: '/projects/from_scratch/git', note: 'the object store by hand, then clone over Smart HTTP' },
  { name: 'store.lua', href: '/projects/store', note: 'a plugin browser for Neovim, with live README preview' },
  { name: 'acapulko.go', href: '/projects/acapulko', note: 'an outage tracker on a Raspberry Pi, still running' },
];

/** ~/me/zmk, one directory per board */
const BOARDS = ['corne/', 'dao/', 'jorne/', 'pockettype/', 'seagull/', 'skean/', 'skeletyl/'];

/**
 * The keys the eight fingers rest on. G and P sit on the same row but belong to the index
 * stretch, so they are not home keys — the design handoff highlighted them anyway, which
 * disagreed with its own caption.
 */
const HOME = new Set(['N', 'R', 'T', 'S', 'H', 'A', 'E', 'I']);

/** the GALLIUM layer, 4-wide keys, three columns between the halves */
const KEYBOARD: [string, boolean][] = [
  ['┌────┬────┬────┬────┬────┬────┐   ┌────┬────┬────┬────┬────┬────┐', false],
  ['│F13 │ B  │ L  │ D  │ C  │ V  │   │ J  │ Y  │ O  │ U  │ \'  │F13 │', false],
  ['├────┼────┼────┼────┼────┼────┤   ├────┼────┼────┼────┼────┼────┤', false],
  ['│F11 │ N  │ R  │ T  │ S  │ G  │   │ P  │ H  │ A  │ E  │ I  │F12 │', true],
  ['├────┼────┼────┼────┼────┼────┤   ├────┼────┼────┼────┼────┼────┤', false],
  ['│F14 │ X  │ Q  │ M  │ W  │ Z  │   │ K  │ F  │ .: │ /; │ ,; │F14 │', false],
  ['└────┴────┴────┼────┼────┼────┤   ├────┼────┼────┼────┴────┴────┘', false],
  ['               │ESC │SPC │SYM │   │BSP │SFT │RET │', false],
  ['               └────┴────┴────┘   └────┴────┴────┘', false],
];

const BOX = /[┌┐└┘├┤┬┴┼─│]/;

/** Colour a keyboard row: frame faint, keycaps foreground, home-row letters amber. */
function keyRow(line: string, home: boolean): Row {
  const spans: Span[] = [];
  for (const [i, ch] of [...line].entries()) {
    const isCap = home && HOME.has(ch) && line[i - 1] === ' ' && line[i + 1] === ' ';
    const color: Span['color'] = BOX.test(ch) ? 'faint' : isCap ? 'accent' : 'fg';
    const last = spans[spans.length - 1];
    if (last && last.color === color) last.text += ch;
    else spans.push({ text: ch, color });
  }
  return spans;
}

const BAR_CELLS = 25;

/** A bar of full blocks, rounded to the nearest half cell so 1% still shows something. */
function bar(percent: number): string {
  const halves = Math.round((percent / 100) * BAR_CELLS * 2);
  return '█'.repeat(Math.floor(halves / 2)) + (halves % 2 ? '▌' : '');
}

const num = (n: number) => n.toLocaleString('en-US');
const cols = (name: string, files: string, lines: string, percent: string) =>
  name.padEnd(14) + files.padStart(5) + lines.padStart(9) + percent.padStart(5);

/** The table's columns line up, so its rows scroll on a narrow screen rather than reflow. */
const pre = (spans: Row): Output => ({ spans, pre: true });

function languageTable(): Output[] {
  const header = pre([{ text: cols('Language', 'Files', 'Lines', '%'), color: 'dim' }]);
  const rows = LANGUAGES.map((l) =>
    pre([
      { text: l.name.padEnd(14), color: l.color },
      { text: num(l.files).padStart(5) + num(l.lines).padStart(9) + `${l.percent}%`.padStart(5) + '  ', color: 'fg' },
      { text: bar(l.percent), color: l.color },
    ]),
  );
  const total = pre([
    { text: cols('Total', num(LANGUAGE_TOTAL.files), num(LANGUAGE_TOTAL.lines), '100%'), color: 'dim' },
  ]);
  return [header, ...rows, total];
}

export const SCRIPT: Command[] = [
  {
    cmd: 'whoami',
    out: [[
      { text: 'oleksandr popov', color: 'fg' },
      { text: '  —  neovimmer · web dev · likes to re-invent the wheel', color: 'dim' },
    ]],
  },
  {
    cmd: 'cat about.txt',
    // hard-wrapped like a README on disk, and free to reflow again on a narrow screen
    out: BIO.flatMap((paragraph, i): Output[] => {
      const lines: Output[] = hardWrap(paragraph, 76).map((line) => [{ text: line, color: 'dim' } as Span]);
      return i === 0 ? [...lines, []] : lines;
    }),
  },
  { cmd: 'll projects/', out: languageTable() },
  {
    cmd: 'cat start-here.md',
    out: START_HERE.map((p) => [
      { text: p.name.padEnd(14), color: 'blue', href: p.href },
      { text: p.note, color: 'dim' },
    ]),
  },
  {
    cmd: 'ls ~/zmk/',
    out: [
      [
        { text: '5x12-ortho/  ', color: 'blue' },
        { text: 'own pcb + case', color: 'faint' },
      ],
      [{ text: BOARDS.join('  '), color: 'blue' }],
      [{ text: `${BOARDS.length + 1} boards · zmk · nice!nano / nrfmicro · one designed from scratch`, color: 'faint' }],
    ],
  },
  {
    cmd: 'cat ~/zmk/skean/config/skean.keymap | grep -A4 GALLIUM',
    out: [
      [
        { text: 'layer 0 · GALLIUM · home row ', color: 'dim' },
        { text: 'N R T S · H A E I', color: 'accent' },
        { text: ' · combos for ⌃ ⌘ ⌥', color: 'dim' },
      ],
      ...KEYBOARD.map(([line, home]) => pre(keyRow(line, home))),
    ],
  },
  { cmd: 'echo $EDITOR $SHELL', out: [[{ text: 'nvim /bin/zsh', color: 'fg' }]] },
  {
    cmd: 'open github.com/alex-popov-tech',
    out: [[
      { text: '→ ', color: 'dim' },
      { text: 'github.com/alex-popov-tech', color: 'blue', href: SITE.github, external: true },
    ]],
  },
];
