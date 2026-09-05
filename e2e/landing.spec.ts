import { test, expect } from '@playwright/test';

test('README opens with the cursor on line 1 and relative numbers', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Oleksandr Popov');
  const lines = page.locator('#buffer .ln');
  await expect(lines.first()).toHaveClass(/cur/);
  await expect(lines.first()).toContainText('# Oleksandr Popov');
  await expect(lines.nth(0).locator('.nr')).toHaveText('1');
  await expect(lines.nth(1).locator('.nr')).toHaveText('1');
  await expect(lines.nth(2).locator('.nr')).toHaveText('2');
  await expect(page.locator('#statusline')).toContainText('README.md');
});

test('the tree shows every section with README last', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the tree is a drawer on phones, covered in phone.spec.ts');
  await page.goto('/');
  const names = await page.locator('#tree .row[data-depth="0"] .name').allTextContents();
  expect(names).toEqual(['work', 'projects', 'elsewhere', 'README.md']);
  await expect(page.locator('#tree .row.sel .name')).toHaveText('README.md');
  await expect(page.locator('#tree [data-children="elsewhere"]')).toBeHidden();
  await expect(page.locator('#tree .row', { hasText: 'redis.go' })).toBeVisible();
});

test('start-here links point at real pages', async ({ page }) => {
  await page.goto('/');
  // the showcase links redis.go too, so ask for the "Start here" list link only
  const href = await page.locator('#buffer a:not([data-project]):not([data-src])', { hasText: 'redis.go' }).getAttribute('href');
  expect(href).toBe('/projects/from_scratch/redis');
});
