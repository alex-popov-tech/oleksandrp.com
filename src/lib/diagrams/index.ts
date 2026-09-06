/**
 * Every animated diagram the site can put on a project page. A project opts in with
 * `diagram: <id>` in its frontmatter; the id is validated against this list.
 *
 * The client loads one renderer on demand (see scripts/diagram.ts) — this registry is for
 * the build, which draws the first frame server-side.
 */
import type { Diagram } from '../diagram';
import { diagram as acapulko } from './acapulko';
import { diagram as store } from './store';

export const DIAGRAM_IDS = ['acapulko-flow', 'store-browse'] as const;
export type DiagramId = (typeof DIAGRAM_IDS)[number];

export const DIAGRAMS: Record<DiagramId, Diagram> = {
  'acapulko-flow': acapulko,
  'store-browse': store,
};
