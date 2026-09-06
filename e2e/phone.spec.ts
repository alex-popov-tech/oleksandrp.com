import { test, expect } from '@playwright/test';

test.skip(({ isMobile }) => !isMobile, 'phone layout only');

test('the tree is a drawer opened from the winbar', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#sidebar')).toBeHidden();
  await expect(page.locator('#drawer-open')).toHaveText('≡');
  await page.locator('#drawer-open').click();
  await expect(page.locator('#sidebar')).toBeVisible();
  await expect(page.locator('.drawer-status')).toContainText('files');
  await page.locator('#tree a', { hasText: 'redis.go' }).click();
  await expect(page).toHaveURL(/from_scratch\/redis$/);
  await expect(page.locator('#sidebar')).toBeHidden();
  await expect(page.locator('#drawer-open')).toHaveText('<');
  await expect(page.locator('#main .winbar .crumb .short')).toHaveText('from_scratch');
});

test('the page never scrolls sideways', async ({ page }) => {
  for (const url of ['/', '/projects/from_scratch/dns', '/projects/openai_chat']) {
    await page.goto(url);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, url).toBeLessThanOrEqual(0);
  }
});

test('bracket links sit under the title and the statusline path is short', async ({ page }) => {
  await page.goto('/projects/acapulko');
  const title = page.locator('#buffer .ln').first();
  const titleBox = await title.locator('.tx.title > span').first().boundingBox();
  const linksBox = await title.locator('.links').boundingBox();
  expect(linksBox!.y).toBeGreaterThan(titleBox!.y + titleBox!.height - 1);
  await expect(page.locator('#statusline .path .short')).toHaveText('.../projects/acapulko.go');
});
