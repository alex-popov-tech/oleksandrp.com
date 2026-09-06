import { describe, it, expect } from 'vitest';
import { cvMenu } from './cv';

const manifest = { 'golang.pdf': 'Golang developer', 'qa.pdf': 'QA automation' };

describe('cvMenu', () => {
  it('is none without files', () => {
    expect(cvMenu(manifest, [])).toEqual({ kind: 'none' });
  });
  it('is single with one file present', () => {
    expect(cvMenu(manifest, ['golang.pdf'])).toEqual({
      kind: 'single',
      item: { name: 'golang.pdf', label: 'Golang developer', href: '/cv/golang.pdf' },
    });
  });
  it('is a menu with several files, in manifest order', () => {
    const m = cvMenu(manifest, ['qa.pdf', 'golang.pdf']);
    expect(m.kind).toBe('menu');
    if (m.kind === 'menu') expect(m.items.map((i) => i.name)).toEqual(['golang.pdf', 'qa.pdf']);
  });
  it('ignores files not in the manifest', () => {
    expect(cvMenu(manifest, ['other.pdf'])).toEqual({ kind: 'none' });
  });
});
