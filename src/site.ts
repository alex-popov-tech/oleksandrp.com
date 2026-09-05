export const SITE = {
  name: 'Oleksandr Popov',
  url: 'https://oleksandrp.com',
  description: 'A neovimmer and a web dev who likes to re-invent the wheel. Go, TypeScript and Lua, built from the wire up.',
  github: 'https://github.com/alex-popov-tech',
  root: '~/oleksandr',
};

/** folder paths that start folded in the tree */
export const FOLDED = ['elsewhere'];

/** README code showcase: cycles through these excerpts, in order. */
export const showcase = [
  { name: 'redis.go', project: '/projects/from_scratch/redis', file: 'redis-go/unmarshal.go' },
  { name: 'git.go', project: '/projects/from_scratch/git', file: 'git-go/blob.go' },
  { name: 'bittorrent.go', project: '/projects/from_scratch/bittorrent', file: 'bittorrent-go/handshake.go' },
  { name: 'dns.go', project: '/projects/from_scratch/dns', file: 'dns-go/question.go' },
  { name: 'store.lua', project: '/projects/store', file: 'store.nvim/sort.lua' },
  { name: 'better_dtek.ts', project: '/projects/better_dtek', file: 'better-dtek/transform.ts' },
];
