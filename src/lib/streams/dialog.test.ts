import { describe, it, expect } from 'vitest';
import type { Cell, Role } from '../diagram';
import { MAX_OP, type Stream } from './engine';
import { DNS, HTTP, REDIS, TORRENT, bittorrent, dns, http, isError, redis, type DialogLine } from './dialog';

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

const DIALOGS: [string, Stream, readonly DialogLine[]][] = [
  ['http', http, HTTP],
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
