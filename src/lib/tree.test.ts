import { describe, it, expect } from 'vitest';
import { buildTree, countFiles, fileName, guideFor, type TreeEntry, type FolderNode } from './tree';

const entries: TreeEntry[] = [
  { section: 'projects', id: 'store', lang: 'lua', order: 1 },
  { section: 'projects', id: 'from_scratch/git', lang: 'go', order: 2 },
  { section: 'projects', id: 'from_scratch/redis', lang: 'go', order: 1 },
  { section: 'projects', id: 'other/advent_of_code', lang: 'go', order: 1 },
  { section: 'work', id: 'lokalise', lang: 'md', order: 1 },
];

const folder = (nodes: ReturnType<typeof buildTree>, name: string) =>
  nodes.find((n) => n.kind === 'folder' && n.name === name) as FolderNode;

describe('fileName', () => {
  it('appends the extension for the language', () => {
    expect(fileName('from_scratch/redis', 'go')).toBe('redis.go');
    expect(fileName('store', 'lua')).toBe('store.lua');
  });
});

describe('buildTree', () => {
  it('orders sections work, projects and ends with README', () => {
    const tree = buildTree(entries);
    expect(tree.map((n) => n.name)).toEqual(['work', 'projects', 'README.sh']);
    expect(tree.at(-1)).toMatchObject({ kind: 'file', href: '/', icon: 'sh', depth: 0 });
  });
  it('puts subfolders before files and sorts files by order', () => {
    const projects = folder(buildTree(entries), 'projects');
    expect(projects.children.map((c) => c.name)).toEqual(['from_scratch', 'other', 'store.lua']);
    const fs = projects.children[0] as FolderNode;
    expect(fs.children.map((c) => c.name)).toEqual(['redis.go', 'git.go']);
    expect(fs.children[0]).toMatchObject({ href: '/projects/from_scratch/redis', icon: 'go', depth: 2 });
    expect(fs.path).toBe('projects/from_scratch');
    expect(fs.depth).toBe(1);
  });
  it('counts files recursively', () => {
    const projects = folder(buildTree(entries), 'projects');
    expect(projects.count).toBe(4);
    expect((projects.children[0] as FolderNode).count).toBe(2);
  });
  it('folds the folders named in options', () => {
    const tree = buildTree(entries, { folded: ['projects'] });
    expect(folder(tree, 'projects').folded).toBe(true);
    expect(folder(tree, 'work').folded).toBe(false);
  });
  it('adds a cv folder before README only when files exist', () => {
    expect(buildTree(entries).some((n) => n.name === 'cv')).toBe(false);
    const tree = buildTree(entries, { cv: [{ name: 'golang.pdf', href: '/cv/golang.pdf' }] });
    expect(tree.map((n) => n.name)).toEqual(['work', 'projects', 'cv', 'README.sh']);
    expect(folder(tree, 'cv').children[0]).toMatchObject({ kind: 'file', name: 'golang.pdf', icon: 'pdf', download: true, depth: 1 });
  });
  it('omits empty sections', () => {
    const tree = buildTree(entries.filter((e) => e.section !== 'work'));
    expect(tree.map((n) => n.name)).toEqual(['projects', 'README.sh']);
  });
});

describe('countFiles', () => {
  it('counts every file including README', () => {
    expect(countFiles(buildTree(entries))).toBe(6);
  });
});

describe('guideFor', () => {
  it('uses a tee for a middle child and a rounded corner for the last', () => {
    expect(guideFor([], false)).toBe('├─ ');
    expect(guideFor([], true)).toBe('╰─ ');
  });
  it('keeps a pipe under open ancestors and a blank under finished ones', () => {
    expect(guideFor([false], false)).toBe('│  ├─ ');
    expect(guideFor([false], true)).toBe('│  ╰─ ');
    expect(guideFor([true], false)).toBe('   ├─ ');
    expect(guideFor([true, false], true)).toBe('   │  ╰─ ');
  });
});
