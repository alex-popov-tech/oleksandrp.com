import { describe, it, expect } from 'vitest';
import { parseExcerpt, langFor, excerptLabel } from './excerpts';

const GO = `// https://github.com/alex-popov-tech/redis-go/blob/df77b784abd992c8fa52e2ae9c27c0c3b119f74a/app/internal/resp/unmarshal.go#L7-L25
func Parse(r Reader) (RESPValue, error) {
\tb, err := r.ReadByte()
}
`;

describe('parseExcerpt', () => {
  it('parses a Go permalink header', () => {
    const e = parseExcerpt('redis-go/unmarshal.go', GO);
    expect(e.repo).toBe('alex-popov-tech/redis-go');
    expect(e.path).toBe('app/internal/resp/unmarshal.go');
    expect(e.from).toBe(7);
    expect(e.to).toBe(25);
    expect(e.permalink).toMatch(/^https:\/\/github\.com\/.*#L7-L25$/);
    expect(e.lang).toBe('go');
    expect(e.code).toBe('func Parse(r Reader) (RESPValue, error) {\n\tb, err := r.ReadByte()\n}');
  });
  it('parses a Lua header', () => {
    const e = parseExcerpt('store.nvim/sort.lua', '-- https://github.com/alex-popov-tech/store.nvim/blob/c52e4fff19f3c59589328ffd352d7502fa8b580d/lua/store/sort.lua#L3-L27\nlocal M = {}');
    expect(e.lang).toBe('lua');
    expect(e.path).toBe('lua/store/sort.lua');
    expect(e.code).toBe('local M = {}');
  });
  it('throws without a permalink header', () => {
    expect(() => parseExcerpt('x/y.go', 'func main() {}')).toThrow(/permalink/);
  });
  it('maps extensions to shiki languages', () => {
    expect(langFor('a/b.ts')).toBe('typescript');
    expect(langFor('a/b.sh')).toBe('bash');
    expect(() => langFor('a/b.xyz')).toThrow();
  });
  it('builds a label', () => {
    const e = parseExcerpt('redis-go/unmarshal.go', GO);
    expect(excerptLabel(e)).toBe('redis-go/app/internal/resp/unmarshal.go:7-25');
  });
});
