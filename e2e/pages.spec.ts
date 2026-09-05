import { test, expect } from '@playwright/test';

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

test('an elsewhere page renders a video', async ({ page }) => {
  await page.goto('/elsewhere/advent_of_code');
  await expect(page.locator('#buffer video')).toHaveAttribute('src', '/videos/aoc2024.mp4');
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

test('a project without excerpts shows its screenshot', async ({ page }) => {
  await page.goto('/projects/store');
  await expect(page.locator('#buffer .tx.media img')).toBeVisible();
});
