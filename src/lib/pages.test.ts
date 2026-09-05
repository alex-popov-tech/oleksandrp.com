import { describe, it, expect } from 'vitest';
import { crumbFor, pathFor, shortPathFor, bracketLinks, currentPath } from './pages';

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

describe('currentPath', () => {
  it('normalises the file-format pathnames astro renders with', () => {
    expect(currentPath('/index.html')).toBe('/');
    expect(currentPath('/')).toBe('/');
    expect(currentPath('/projects/store.html')).toBe('/projects/store');
    expect(currentPath('/projects/from_scratch/redis')).toBe('/projects/from_scratch/redis');
    expect(currentPath('/projects/store/')).toBe('/projects/store');
    expect(currentPath('/404.html')).toBe('/404');
  });
});
