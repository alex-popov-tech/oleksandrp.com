/**
 * What a person cannot see by looking at the site.
 *
 * Everything visual or behavioural is verified by hand — that is what actually catches the
 * bugs here. These cover only failures that are silent: an overlay quietly eating clicks, a
 * motion preference ignored, a fixed-width block widening the page at a size nobody owns, and
 * routing config that breaks on an upgrade without changing how any page looks.
 */
import { test, expect } from '@playwright/test';

test('overlays never swallow a click', async ({ page, isMobile }) => {
  test.skip(isMobile, 'the train and diagram are desktop only');
  await page.clock.install();
  // a page with no diagram of its own: the train only runs where nothing else is animating
  await page.goto('/projects/dotfiles');
  await page.clock.fastForward('00:25');
  await expect(page.locator('#train')).toBeVisible();
  await expect(page.locator('#train')).toHaveCSS('pointer-events', 'none');
  // a link underneath the running train must still take the click
  await page.locator('#tree a[href="/projects/from_scratch/redis"]').click();
  await expect(page).toHaveURL(/from_scratch\/redis$/);
});

test('prefers-reduced-motion silences everything that moves', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/projects/acapulko');

  // the diagram holds its first frame
  const row = page.locator('.diagram-row').nth(6);
  const before = await row.textContent();

  // the cycler shows its snippet whole rather than typing it
  await expect(page.locator('code-cycler [data-live]')).toContainText('getOutage');
  await expect(page.locator('code-cycler .caret')).toHaveCount(0);

  await page.clock.fastForward('05:00');
  expect(await row.textContent()).toBe(before);
  await expect(page.locator('#train')).toBeHidden();
});

test('no page scrolls sideways, at any width', async ({ page, isMobile }) => {
  const widths = isMobile ? [390] : [1440, 1180, 1000];
  // acapulko carries the fixed 100-column diagram; dns a long code excerpt
  for (const url of ['/', '/projects/acapulko', '/projects/from_scratch/dns']) {
    for (const width of widths) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${url} at ${width}px`).toBeLessThanOrEqual(0);
    }
  }
});

test('routing config still holds', async ({ page }) => {
  // both come from astro.config build.format and trailingSlash, and fail silently on upgrade
  expect((await page.goto('/projects/nope'))?.status()).toBe(404);
  expect((await page.goto('/projects/store/'))?.status()).toBe(404);
  expect((await page.goto('/projects/store'))?.status()).toBe(200);
  await page.goto('/404');
  await expect(page.locator('#buffer')).toContainText("E484: Can't open file");
});
