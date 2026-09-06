export type Lang = 'go' | 'lua' | 'ts' | 'js' | 'sh' | 'md';
export type Section = 'work' | 'projects';

export const EXT: Record<Lang, string> = { go: '.go', lua: '.lua', ts: '.ts', js: '.js', sh: '.sh', md: '.md' };
export const SECTION_ORDER: Section[] = ['work', 'projects'];

export interface TreeEntry {
  section: Section;
  /** collection entry id, e.g. 'from_scratch/redis' */
  id: string;
  lang: Lang;
  order: number;
}

export interface CvFile {
  name: string;
  href: string;
}

export interface TreeOptions {
  /** folder paths that start folded, e.g. ['projects/other'] */
  folded?: string[];
  cv?: CvFile[];
}

export interface FileNode {
  kind: 'file';
  name: string;
  href: string;
  icon: Lang | 'pdf' | 'readme';
  depth: number;
  download?: boolean;
}

export interface FolderNode {
  kind: 'folder';
  name: string;
  /** 'projects/from_scratch' */
  path: string;
  depth: number;
  count: number;
  folded: boolean;
  children: TreeNode[];
}

export type TreeNode = FileNode | FolderNode;

export function fileName(id: string, lang: Lang): string {
  return id.slice(id.lastIndexOf('/') + 1) + EXT[lang];
}

export function buildTree(entries: TreeEntry[], opts: TreeOptions = {}): TreeNode[] {
  const folded = new Set(opts.folded ?? []);
  const roots: TreeNode[] = [];
  for (const section of SECTION_ORDER) {
    const own = entries.filter((e) => e.section === section);
    if (own.length === 0) continue;
    roots.push(folder(section, section, 0, section, '', own, folded));
  }
  if (opts.cv && opts.cv.length > 0) {
    roots.push({
      kind: 'folder',
      name: 'cv',
      path: 'cv',
      depth: 0,
      count: opts.cv.length,
      folded: folded.has('cv'),
      children: opts.cv.map((f) => ({ kind: 'file', name: f.name, href: f.href, icon: 'pdf', depth: 1, download: true })),
    });
  }
  roots.push({ kind: 'file', name: 'README.md', href: '/', icon: 'readme', depth: 0 });
  return roots;
}

function folder(
  name: string,
  path: string,
  depth: number,
  section: Section,
  prefix: string,
  entries: TreeEntry[],
  folded: Set<string>,
): FolderNode {
  const subfolders = new Map<string, TreeEntry[]>();
  const files: TreeEntry[] = [];
  for (const e of entries) {
    const rel = e.id.slice(prefix.length);
    const slash = rel.indexOf('/');
    if (slash === -1) {
      files.push(e);
    } else {
      const sub = rel.slice(0, slash);
      subfolders.set(sub, [...(subfolders.get(sub) ?? []), e]);
    }
  }
  const children: TreeNode[] = [];
  for (const sub of [...subfolders.keys()].sort()) {
    children.push(folder(sub, `${path}/${sub}`, depth + 1, section, `${prefix}${sub}/`, subfolders.get(sub)!, folded));
  }
  files.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  for (const e of files) {
    children.push({ kind: 'file', name: fileName(e.id, e.lang), href: `/${section}/${e.id}`, icon: e.lang, depth: depth + 1 });
  }
  return { kind: 'folder', name, path, depth, count: entries.length, folded: folded.has(path), children };
}

export function countFiles(nodes: TreeNode[]): number {
  let n = 0;
  for (const node of nodes) n += node.kind === 'file' ? 1 : countFiles(node.children);
  return n;
}

/** Box-drawing columns for the tree, in the shape neo-tree.nvim draws them. */
export const GUIDE = { vertical: '│  ', blank: '   ', tee: '├─ ', corner: '╰─ ' } as const;

/**
 * The guide string that precedes a row's icon.
 *
 * `ancestors[i]` says whether the ancestor folder at depth i+1 was the last of its siblings:
 * a last ancestor leaves a blank column, any other keeps its pipe running down. The row itself
 * gets a rounded corner when it is the last of its siblings, so nothing trails below it.
 * Depth-0 rows sit directly under the root and draw no guides at all.
 */
export function guideFor(ancestors: boolean[], isLast: boolean): string {
  const columns = ancestors.map((last) => (last ? GUIDE.blank : GUIDE.vertical)).join('');
  return columns + (isLast ? GUIDE.corner : GUIDE.tee);
}
