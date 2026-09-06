export type ReadmeLine =
  | { kind: 'h1'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'p'; text: string }
  | { kind: 'sub'; text: string }
  | { kind: 'link'; text: string; href: string }
  | { kind: 'blank' }
  | { kind: 'showcase' };

export const README: ReadmeLine[] = [
  { kind: 'h1', text: 'Oleksandr Popov' },
  { kind: 'blank' },
  { kind: 'p', text: 'A neovimmer and a web dev who likes to re-invent the wheel.' },
  { kind: 'blank' },
  { kind: 'p', text: 'Currently writing Go for things that already exist: Redis, DNS, Git, BitTorrent and HTTP, each built from the wire up, with no library doing the interesting part.' },
  { kind: 'blank' },
  { kind: 'p', text: 'Before that, TypeScript on the web and inside test frameworks. Lua in between, for Neovim plugins and a config I keep tweaking.' },
  { kind: 'blank' },
  { kind: 'showcase' },
  { kind: 'blank' },
  { kind: 'h2', text: 'Start here' },
  { kind: 'blank' },
  { kind: 'link', text: 'redis.go', href: '/projects/from_scratch/redis' },
  { kind: 'sub', text: 'a Redis server that redis-cli cannot tell apart' },
  { kind: 'link', text: 'git.go', href: '/projects/from_scratch/git' },
  { kind: 'sub', text: 'the object store by hand, then clone over Smart HTTP' },
  { kind: 'link', text: 'store.lua', href: '/projects/store' },
  { kind: 'sub', text: 'a plugin browser for Neovim, with live README preview' },
  { kind: 'link', text: 'acapulko.go', href: '/projects/acapulko' },
  { kind: 'sub', text: 'an outage tracker on a Raspberry Pi, still running' },
  { kind: 'blank' },
  { kind: 'h2', text: 'Languages' },
  { kind: 'blank' },
  { kind: 'p', text: 'Go, TypeScript, Lua, Gleam, JavaScript and Shell.' },
  { kind: 'blank' },
  { kind: 'h2', text: 'Find me' },
  { kind: 'blank' },
  { kind: 'link', text: 'github.com/alex-popov-tech', href: 'https://github.com/alex-popov-tech' },
  { kind: 'link', text: 'oleksandrp.com', href: 'https://oleksandrp.com' },
  { kind: 'p', text: '- [EMAIL]' },
];
