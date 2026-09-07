import { DIAGRAM_IDS } from './lib/diagrams';
import { STREAM_IDS } from './lib/streams';
import { defineCollection, z, type SchemaContext } from 'astro:content';
import { glob } from 'astro/loaders';

export const LANGS = ['go', 'lua', 'ts', 'js', 'sh', 'md'] as const;
const lang = z.enum(LANGS);

const link = {
  /** GitHub path after github.com/, e.g. 'alex-popov-tech/redis-go' */
  repo: z.string().regex(/^[^/\s]+\/[^\s]+$/).optional(),
  live: z.string().url().optional(),
};

const projectSchema = ({ image }: SchemaContext) =>
  z.object({
    title: z.string(),
    lang,
    order: z.number().int(),
    ...link,
    tags: z.array(z.string()).default([]),
    hero: z
      .discriminatedUnion('type', [
        z.object({ type: z.literal('image'), src: image() }),
        z.object({ type: z.literal('video'), src: z.string().startsWith('/') }),
      ])
      .optional(),
    /** files under src/excerpts, e.g. 'redis-go/unmarshal.go' */
    excerpts: z.array(z.string()).default([]),
    /** an animated ascii diagram to show above the excerpts */
    diagram: z.enum(DIAGRAM_IDS).optional(),
    /** an animated text stream in the file view's right margin */
    stream: z.enum(STREAM_IDS).optional(),
  });

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: projectSchema,
});

export const collections = { projects };
