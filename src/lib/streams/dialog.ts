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
import { MAX_OP, blankGrid, edge, isScrollHead, scrollIndex, type Stream } from './engine';

export interface DialogLine {
  side: 'c' | 's';
  text: string;
  /** a header, a TTL, a keep-alive — the parts around the exchange rather than in it */
  meta?: boolean;
}

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

  for (let r = 0; r < rows; r++) {
    const line = script[scrollIndex(t, r, rows, seed * 7, script.length)];
    const color = tone(line);
    const text = line.side === 'c' ? `▶ ${line.text}` : `${line.text} ◀`;
    const x = line.side === 'c' ? 0 : Math.max(0, cols - text.length);
    // the newest line is the one being spoken
    const op = (isScrollHead(r, rows) ? 1 : 0.85) * MAX_OP * edge(r, rows);

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
