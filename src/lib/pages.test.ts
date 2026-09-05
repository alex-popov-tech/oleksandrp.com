import { describe, it, expect } from 'vitest';
import { crumbFor, pathFor, shortPathFor, bracketLinks } from './pages';

describe('page helpers', () => {
  it('builds the breadcrumb from section, folders and file name', () => {
    expect(crumbFor('projects', 'from_scratch/redis', 'go')).toBe('projects > from_scratch > redis.go');
    expect(crumbFor('work', 'lokalise', 'md')).toBe('work > lokalise.md');
  });
  it('builds the statusline path', () => {
    expect(pathFor('projects', 'from_scratch/redis', 'go')).toBe('~/oleksandr/projects/from_scratch/redis.go');
    expect(pathFor('projects', 'store', 'lua')).toBe('~/oleksandr/projects/store.lua');
  });
  it('shortens to the last folder and file', () => {
    expect(shortPathFor('projects', 'from_scratch/redis', 'go')).toBe('.../from_scratch/redis.go');
    expect(shortPathFor('projects', 'store', 'lua')).toBe('.../projects/store.lua');
  });
  it('builds bracket links', () => {
    expect(bracketLinks({ repo: 'alex-popov-tech/redis-go' })).toEqual([{ label: '[github]', href: 'https://github.com/alex-popov-tech/redis-go' }]);
    expect(bracketLinks({ live: 'https://x.y' })).toEqual([{ label: '[live]', href: 'https://x.y' }]);
    expect(bracketLinks({})).toEqual([]);
  });
});
