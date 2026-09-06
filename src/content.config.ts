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
    diagram: z.enum(['acapulko-flow']).optional(),
  });

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: projectSchema,
});

const work = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    role: z.string(),
    from: z.string(),
    to: z.string(),
    lang: lang.default('md'),
    order: z.number().int(),
    tags: z.array(z.string()).default([]),
    shipped: z
      .array(
        z.object({
          title: z.string(),
          ...link,
          tags: z.array(z.string()).default([]),
          description: z.string(),
        }),
      )
      .default([]),
  }),
});

export const collections = { projects, work };
