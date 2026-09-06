export interface CvItem {
  name: string;
  label: string;
  href: string;
}

export type CvMenu = { kind: 'none' } | { kind: 'single'; item: CvItem } | { kind: 'menu'; items: CvItem[] };

/** Intersect the manifest (filename -> label) with the PDFs actually present in public/cv. */
export function cvMenu(manifest: Record<string, string>, existing: string[]): CvMenu {
  const items: CvItem[] = Object.entries(manifest)
    .filter(([name]) => existing.includes(name))
    .map(([name, label]) => ({ name, label, href: `/cv/${name}` }));
  if (items.length === 0) return { kind: 'none' };
  if (items.length === 1) return { kind: 'single', item: items[0] };
  return { kind: 'menu', items };
}
