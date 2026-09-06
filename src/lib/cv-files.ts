import manifest from '../cv.json';
import { cvMenu, type CvItem, type CvMenu } from './cv';
import type { CvFile } from './tree';

const present = Object.keys(import.meta.glob('/public/cv/*.pdf')).map((p) => p.slice(p.lastIndexOf('/') + 1));

export function cvState(): CvMenu {
  return cvMenu(manifest as Record<string, string>, present);
}

export function cvFiles(): CvFile[] {
  const m = cvState();
  const items: CvItem[] = m.kind === 'none' ? [] : m.kind === 'single' ? [m.item] : m.items;
  return items.map((i) => ({ name: i.name, href: i.href }));
}
