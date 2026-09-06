import { test, expect } from '@playwright/test';

test('the acapulko page draws the data-flow diagram above its code', async ({ page }) => {
  await page.goto('/projects/acapulko');
  const flow = page.locator('ascii-flow');
  await expect(flow).toBeVisible();
  await expect(flow.locator('.flow-row')).toHaveCount(14);
  // the two SVG nodes carry detail the character grid cannot
  await expect(flow.locator('svg.bulb')).toBeVisible();
  await expect(flow.locator('svg.plane')).toBeVisible();
  // diagram first, excerpt underneath
  const diagram = (await flow.boundingBox())!;
  const code = (await page.locator('code-cycler').boundingBox())!;
  expect(diagram.y).toBeLessThan(code.y);
});

test('the diagram animates, and the bulb goes out during the outage', async ({ page }) => {
  await page.goto('/projects/acapulko');
  const flow = page.locator('ascii-flow');
  await expect(flow).toHaveAttribute('data-on', '');
  // the timeline drops the grid at 5s and the bulb follows once the pulse lands
  await expect(flow).not.toHaveAttribute('data-on', '', { timeout: 12_000 });
  await expect(page.locator('ascii-flow')).toContainText('outage');
});

test('reduced motion leaves a still diagram', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/projects/acapulko');
  const row = page.locator('.flow-row').nth(6);
  const before = await row.textContent();
  await page.waitForTimeout(2500);
  expect(await row.textContent()).toBe(before);
});

test('the 100-column diagram never widens the page', async ({ page }) => {
  for (const width of [1440, 1180, 1000]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/projects/acapulko');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `page overflow at ${width}px`).toBeLessThanOrEqual(0);
  }
});
