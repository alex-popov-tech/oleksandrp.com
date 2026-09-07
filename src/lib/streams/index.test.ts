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
