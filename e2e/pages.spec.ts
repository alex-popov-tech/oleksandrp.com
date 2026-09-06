import { test, expect } from '@playwright/test';

test('every project shows code, never a screenshot', async ({ page }) => {
  for (const url of ['/projects/store', '/projects/dotfiles', '/projects/other/advent_of_code']) {
    await page.goto(url);
    await expect(page.locator('code-cycler'), url).toBeVisible();
    await expect(page.locator('#buffer .tx.media'), url).toHaveCount(0);
  }
});

test('a project page renders the pane template', async ({ page }) => {
  await page.goto('/projects/from_scratch/redis');
  const lines = page.locator('#buffer .ln');
  await expect(lines.first()).toContainText('A Redis-compatible server');
  await expect(lines.first().locator('a', { hasText: '[github]' })).toHaveAttribute('href', 'https://github.com/alex-popov-tech/redis-go');
  await expect(page.locator('#buffer .tx.tags')).toContainText('RESP');
  await expect(page.locator('code-cycler')).toBeVisible();
  await expect(page.locator('#statusline')).toContainText('redis.go');
});

test('a work page shows role, dates and shipped items', async ({ page }) => {
  await page.goto('/work/lokalise');
  await expect(page.locator('#buffer .ln').first()).toContainText('[ROLE]');
  await expect(page.locator('#buffer .ln').first()).toContainText('[YYYY] - [YYYY]');
});

test('unknown paths answer 404', async ({ page }) => {
  const res = await page.goto('/projects/nope');
  expect(res?.status()).toBe(404);
});

test('the 404 page is an nvim error naming the path', async ({ page }) => {
  await page.goto('/404');
  await expect(page.locator('#buffer')).toContainText("E484: Can't open file /404");
  await expect(page.locator('#buffer a', { hasText: 'README.md' })).toHaveAttribute('href', '/');
});

test('routes have no trailing slash', async ({ page }) => {
  const res = await page.goto('/projects/from_scratch/redis/');
  expect(res?.status()).toBe(404);
});


test('the tree cannot be text-selected but the buffer can', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the tree is a drawer on phones');
  await page.goto('/projects/store');
  const dragOver = async (selector: string) => {
    const box = (await page.locator(selector).first().boundingBox())!;
    await page.mouse.move(box.x + 4, box.y + 4);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 4, box.y + 160, { steps: 12 });
    await page.mouse.up();
    const text = await page.evaluate(() => window.getSelection()?.toString() ?? '');
    await page.evaluate(() => window.getSelection()?.removeAllRanges());
    return text;
  };
  expect(await dragOver('#tree')).toBe('');
  expect(await dragOver('#buffer .ln .tx')).toContain('Store.nvim');
});
