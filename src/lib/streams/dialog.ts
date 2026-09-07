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
