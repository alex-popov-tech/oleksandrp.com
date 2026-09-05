import { describe, it, expect } from 'vitest';
import { buildTree, countFiles, fileName, type TreeEntry, type FolderNode } from './tree';

const entries: TreeEntry[] = [
  { section: 'projects', id: 'store', lang: 'lua', order: 1 },
  { section: 'projects', id: 'from_scratch/git', lang: 'go', order: 2 },
  { section: 'projects', id: 'from_scratch/redis', lang: 'go', order: 1 },
  { section: 'elsewhere', id: 'advent_of_code', lang: 'go', order: 1 },
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
  it('orders sections work, projects, elsewhere and ends with README', () => {
    const tree = buildTree(entries);
    expect(tree.map((n) => n.name)).toEqual(['work', 'projects', 'elsewhere', 'README.md']);
    expect(tree.at(-1)).toMatchObject({ kind: 'file', href: '/', icon: 'readme', depth: 0 });
  });
  it('puts subfolders before files and sorts files by order', () => {
    const projects = folder(buildTree(entries), 'projects');
    expect(projects.children.map((c) => c.name)).toEqual(['from_scratch', 'store.lua']);
    const fs = projects.children[0] as FolderNode;
    expect(fs.children.map((c) => c.name)).toEqual(['redis.go', 'git.go']);
    expect(fs.children[0]).toMatchObject({ href: '/projects/from_scratch/redis', icon: 'go', depth: 2 });
    expect(fs.path).toBe('projects/from_scratch');
    expect(fs.depth).toBe(1);
  });
  it('counts files recursively', () => {
    const projects = folder(buildTree(entries), 'projects');
    expect(projects.count).toBe(3);
    expect((projects.children[0] as FolderNode).count).toBe(2);
  });
  it('folds the folders named in options', () => {
    const tree = buildTree(entries, { folded: ['elsewhere'] });
    expect(folder(tree, 'elsewhere').folded).toBe(true);
    expect(folder(tree, 'projects').folded).toBe(false);
  });
  it('adds a cv folder before README only when files exist', () => {
    expect(buildTree(entries).some((n) => n.name === 'cv')).toBe(false);
    const tree = buildTree(entries, { cv: [{ name: 'golang.pdf', href: '/cv/golang.pdf' }] });
    expect(tree.map((n) => n.name)).toEqual(['work', 'projects', 'elsewhere', 'cv', 'README.md']);
    expect(folder(tree, 'cv').children[0]).toMatchObject({ kind: 'file', name: 'golang.pdf', icon: 'pdf', download: true, depth: 1 });
  });
  it('omits empty sections', () => {
    const tree = buildTree(entries.filter((e) => e.section !== 'work'));
    expect(tree.map((n) => n.name)).toEqual(['projects', 'elsewhere', 'README.md']);
  });
});

describe('countFiles', () => {
  it('counts every file including README', () => {
    expect(countFiles(buildTree(entries))).toBe(6);
  });
});
