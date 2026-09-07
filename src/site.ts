export const SITE = {
  name: 'Oleksandr Popov',
  url: 'https://oleksandrp.com',
  description: 'A neovimmer and a web dev who likes to re-invent the wheel. Go, TypeScript and Lua, built from the wire up.',
  github: 'https://github.com/alex-popov-tech',
  root: '~/oleksandr',
};

/**
 * The ways to reach me, in the order README.sh prints them. The value is what the page shows —
 * a handle, not a URL, because the column is narrow and the link already carries the rest.
 */
export const CONTACTS = [
  { label: 'telegram', value: '@alex_popov_tech', href: 'https://t.me/alex_popov_tech' },
  { label: 'email', value: 'alex.popov.tech@gmail.com', href: 'mailto:alex.popov.tech@gmail.com' },
  { label: 'linkedin', value: 'in/aleksanderpopov', href: 'https://www.linkedin.com/in/aleksanderpopov/' },
  { label: 'github', value: 'alex-popov-tech', href: SITE.github },
];

/** folder paths that start folded in the tree; everything is open by default */
export const FOLDED: string[] = [];
