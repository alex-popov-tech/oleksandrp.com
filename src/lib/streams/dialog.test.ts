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
