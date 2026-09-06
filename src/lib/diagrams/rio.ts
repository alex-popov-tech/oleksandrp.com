/**
 * claude-rio, side by side: the same prompt reaches two Claude Code sessions. On the left it
 * is answered directly; on the right rio's hook matches keywords first and suggests the skill,
 * so the skill is the thing that runs. Three prompts, ten seconds each.
 *
 * Ported from the design handoff. Its `⚡` and `⎿` are not in JetBrains Mono — `⚡` renders as
 * a double-width emoji in WebKit — so the hook marker is `➜` and the tree branch `╰`.
 *
 * Pure: the same `t` always yields the same grid.
 */
import { Grid, type Diagram, type Frame, type Role } from '../diagram';
import { clip } from '../text';

const C: Record<string, Role> = { fg: 'fg', dim: 'faint', mute: 'dim', amber: 'accent', red: 'red', grn: 'green', org: 'orange' };

export interface Scenario {
  prompt: string;
  /** the words rio's matcher keys on, highlighted once the hook fires */
  keywords: string[];
  match: { name: string; kind: 'skill' | 'agent' | 'command' };
  /** what the unhooked session says, and the tool it reaches for */
  without: string;
  tool: string;
}

export const SCENARIOS: Scenario[] = [
  {
    prompt: 'add a dockerfile and compose for postgres',
    keywords: ['dockerfile', 'compose', 'postgres'],
    match: { name: 'docker-helper', kind: 'skill' },
    without: "I'll write a Dockerfile and docker-compose.yml from scratch…",
    tool: 'Write(Dockerfile)',
  },
  {
    prompt: 'review my diff before i push',
    keywords: ['review', 'diff', 'push'],
    match: { name: 'code-reviewer', kind: 'agent' },
    without: 'Let me look at the changes…',
    tool: 'Bash(git diff)',
  },
  {
    prompt: 'fix the typescript build errors in utils',
    keywords: ['typescript', 'build', 'errors'],
    match: { name: 'typescript-compiler', kind: 'skill' },
    without: 'Let me check utils/…',
    tool: 'Read(utils/index.ts)',
  },
];

const invocation = ({ name, kind }: Scenario['match']) =>
  kind === 'skill' ? `Skill(${name})` : kind === 'agent' ? `Task(${name})` : `SlashCommand(/${name})`;

export const COLS = 74;
export const ROWS = 12;
/** seconds per scenario */
export const SCENARIO_S = 10;

/** the beat each thing happens on, in seconds from the start of a scenario */
const TYPED = 2.4;
const HOOK = 2.7;
const SUGGESTED = 4.4;
const INVOKE = 5.6;
const SECOND_LINE = 6.4;
const VERDICT = 7.2;
const CLEAR = 9.6;

/** column each session's pane starts at, and how wide it is */
const LEFT = 1;
const RIGHT = 38;
const PANE = 35;

export interface RioFrame extends Frame {
  scenario: number;
  hooked: boolean;
}

export function renderFrame(tSeconds: number, opts: { speed?: number; scenarios?: Scenario[] } = {}): RioFrame {
  const speed = opts.speed ?? 1;
  const scenarios = opts.scenarios ?? SCENARIOS;
  const T = tSeconds * speed;
  const index = Math.floor(T / SCENARIO_S) % scenarios.length;
  const t = T % SCENARIO_S;
  const scenario = scenarios[index];
  const { match } = scenario;

  const typed = scenario.prompt.slice(0, Math.floor(Math.min(1, t / TYPED) * scenario.prompt.length));
  const blink = Math.floor(T * 2) % 2 === 0;
  const showing = t < CLEAR;
  const hooked = t >= HOOK;

  const g = new Grid(COLS, ROWS);

  g.put(0, LEFT, 'without rio', C.mute);
  g.put(0, RIGHT, 'with rio', C.amber);
  g.put(1, LEFT, '─'.repeat(PANE), C.dim);
  g.put(1, RIGHT, '─'.repeat(PANE), C.dim);

  /** Type the prompt into one pane, wrapping inside it. Returns the row it ended on. */
  const prompt = (start: number, highlight: boolean) => {
    g.put(2, start, '>', C.mute);
    if (!showing) return 2;
    let col = start + 2;
    let row = 2;
    const place = (word: string, color: Role) => {
      if (col + word.length > start + PANE) {
        row++;
        col = start + 2;
      }
      g.put(row, col, word, color);
      col += word.length + 1;
    };
    for (const word of typed.split(' ')) {
      place(word, highlight && hooked && scenario.keywords.includes(word) ? C.amber : C.fg);
    }
    // the cursor wraps like a word: at the pane edge it would otherwise land in the next pane
    if (t < HOOK && blink) place('▌', C.fg);
    return row;
  };

  const left = prompt(LEFT, false);
  const right = prompt(RIGHT, true);

  if (showing && t >= INVOKE) {
    g.put(left + 2, LEFT, '●', C.org);
    g.put(left + 2, LEFT + 2, clip(scenario.without, PANE - 2), C.fg);
    if (t >= SECOND_LINE) {
      g.put(left + 3, LEFT, '●', C.org);
      g.put(left + 3, LEFT + 2, scenario.tool, C.fg);
    }
    if (t >= VERDICT) g.put(left + 5, LEFT, `○ ${match.name} ignored`, C.red);
  }

  if (showing && hooked) {
    g.put(right + 2, RIGHT, '➜', C.amber);
    const matching = `rio: matching${'.'.repeat(Math.floor((t - HOOK) * 5) % 4)}`;
    const settled = t >= SUGGESTED;
    g.put(right + 2, RIGHT + 2, settled ? `rio: SUGGESTED ${match.name}` : matching, settled ? C.amber : C.mute);
    if (t >= INVOKE) {
      g.put(right + 3, RIGHT, '●', C.org);
      // the call flashes as it lands, then settles into ordinary output
      g.put(right + 3, RIGHT + 2, invocation(match), t < INVOKE + 0.4 ? C.amber : C.fg);
    }
    if (t >= SECOND_LINE) {
      g.put(right + 4, RIGHT + 2, '╰', C.dim);
      g.put(right + 4, RIGHT + 4, `loaded ${match.kind}`, C.mute);
    }
    if (t >= VERDICT) g.put(right + 5, RIGHT, `◉ ${match.name} invoked`, C.grn);
  }

  /** activation [███░░░░░░░░░] sometimes */
  const bar = (start: number, filled: number, color: Role, label: string) => {
    const width = 12;
    g.put(10, start, 'activation', C.mute);
    g.put(10, start + 11, '[', C.dim);
    g.put(10, start + 12, '█'.repeat(filled), color);
    g.put(10, start + 12 + filled, '░'.repeat(width - filled), C.dim);
    g.put(10, start + 12 + width, ']', C.dim);
    g.put(10, start + 14 + width, label, C.mute);
  };
  bar(LEFT, 3, C.red, 'sometimes');
  bar(RIGHT, 11, C.grn, 'usually');
  g.put(11, LEFT, 'illustrative — claude still makes the final call', C.dim);

  return { grid: g.cells, scenario: index, hooked };
}

export const diagram: Diagram = { cols: COLS, rows: ROWS, render: (t) => renderFrame(t) };
