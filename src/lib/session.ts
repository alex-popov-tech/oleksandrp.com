/**
 * The README as a shell session: each command is a section of the bio, typed out in order.
 *
 * Pure, like the diagrams — `renderSession(t)` decides what is on screen at time t, so the
 * server can render the finished session and the client can replay it from the top without
 * the two disagreeing about what it contains.
 */
import { escapeHtml, type Role } from './diagram';

export interface Span {
  text: string;
  color: Role;
  href?: string;
  /** an external link, opened in a new tab */
  external?: boolean;
}

export type Row = Span[];

/**
 * A row whose columns carry meaning — a table, a drawing — so it scrolls rather than reflows.
 * Everything else is prose and wraps, which is what a phone needs.
 */
export interface PreRow {
  spans: Row;
  pre: true;
}

export type Output = Row | PreRow;

export interface Command {
  cmd: string;
  out: Output[];
}

const spansOf = (out: Output): Row => (Array.isArray(out) ? out : out.spans);
const wrapsOf = (out: Output): boolean => Array.isArray(out) || !out.pre;

/** how long each part of a command takes, in seconds */
export const CHAR_S = 0.075;
const OUTPUT_S = 0.18;
const PAUSE_S = 0.55;

export interface SessionFrame {
  /** the rows to show, prompts and output alike */
  rows: { spans: Row; indent: boolean; wrap: boolean }[];
  /** the command being typed right now, if any */
  typing: string | null;
  /** true once the last command has run: the session rests on an idle prompt */
  done: boolean;
}

/** How long the whole session takes to play, in seconds. */
export function duration(script: Command[]): number {
  return script.reduce((t, { cmd }) => t + cmd.length * CHAR_S + OUTPUT_S + PAUSE_S, 0);
}

export function renderSession(script: Command[], tSeconds: number): SessionFrame {
  const rows: SessionFrame['rows'] = [];
  let at = 0;
  let typing: string | null = null;
  let done = false;

  for (const [i, { cmd, out }] of script.entries()) {
    const typed = cmd.length * CHAR_S;
    if (tSeconds < at) break;
    if (tSeconds < at + typed) {
      typing = cmd.slice(0, Math.floor((tSeconds - at) / CHAR_S));
      break;
    }
    rows.push({ spans: prompt(cmd), indent: false, wrap: false });
    at += typed;
    // the command has landed but its output has not come back yet
    if (tSeconds < at + OUTPUT_S) break;
    for (const row of out) rows.push({ spans: spansOf(row), indent: true, wrap: wrapsOf(row) });
    rows.push({ spans: [], indent: false, wrap: false });
    at += OUTPUT_S + PAUSE_S;
    if (i === script.length - 1) done = true;
  }

  return { rows, typing, done };
}

export function prompt(cmd: string): Row {
  return [
    { text: '❯ ', color: 'green' },
    { text: cmd, color: 'fg' },
  ];
}

/** One row as HTML. The server and the client both go through here, so a replayed row is
 * built exactly like the one the build rendered. */
export function rowHtml(spans: Row): string {
  return spans
    .map((s) => {
      const cls = `c-${s.color}`;
      const text = escapeHtml(s.text);
      if (!s.href) return `<span class="${cls}">${text}</span>`;
      const target = s.external ? ' target="_blank" rel="noopener"' : '';
      return `<a class="${cls}" href="${s.href}"${target}>${text}</a>`;
    })
    .join('');
}
