/**
 * Every margin stream the site can put on a project page. A project opts in with
 * `stream: <id>` in its frontmatter; the id is validated against this list by the content
 * schema, so a typo fails the build.
 *
 * Unlike a diagram, a stream is never drawn on the server — its height is whatever the pane
 * allows. So this registry serves the schema and the tests; the client loads one renderer on
 * demand (see scripts/stream.ts).
 */
import { bittorrent, dns, http, redis } from './dialog';
import type { Stream } from './engine';
import { grep } from './grep';
import { git, interpreter } from './rain';

export type { Stream } from './engine';

export const STREAM_IDS = ['git', 'interpreter', 'grep', 'http', 'redis', 'dns', 'bittorrent'] as const;
export type StreamId = (typeof STREAM_IDS)[number];

export const STREAMS: Record<StreamId, Stream> = { git, interpreter, grep, http, redis, dns, bittorrent };
