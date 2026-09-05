import { test, expect } from '@playwright/test';

test('landing responds with the site title', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await expect(page).toHaveTitle(/Oleksandr Popov/);
});
