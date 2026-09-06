import { test, expect } from '@playwright/test';

test.skip(({ isMobile }) => isMobile, 'the sprite is 63 columns wide; phones do not get it');

const SLOT = 'sl:next-departure';

test('the train departs, crosses, and never blocks a click', async ({ page }) => {
  await page.clock.install();
  await page.goto('/projects/store');
  const train = page.locator('#train');
  await expect(train).toBeHidden();

  // the slot falls due at 12s but is only noticed on the next 10s poll
  await page.clock.fastForward('00:25');
  await expect(train).toBeVisible();
  await expect(train).toHaveCSS('pointer-events', 'none');
  expect((await train.textContent())?.split('\n')).toHaveLength(6);
  // each row dims what it covers, otherwise the sprite interleaves with the prose.
  // it must be a backdrop-filter, not a fill: the tree and the buffer are different shades
  const row = train.locator('span').first();
  expect(await row.evaluate((el) => getComputedStyle(el).backdropFilter)).toContain('brightness');
  // an ancestor transform would make .train a backdrop root and the filter would dim nothing
  expect(await train.evaluate((el) => getComputedStyle(el).transform)).toBe('none');

  // it floats over the buffer, so links underneath must still take the click
  await page.locator('#tree a[href="/projects/from_scratch/redis"]').click();
  await expect(page).toHaveURL(/from_scratch\/redis$/);
});

test('the departure slot survives navigation, so browsing does not reset the wait', async ({ page }) => {
  await page.clock.install();
  await page.goto('/projects/store');
  const slot = await page.evaluate((k) => localStorage.getItem(k), SLOT);
  expect(Number(slot)).toBeGreaterThan(0);

  // browse for a while; the countdown must keep running rather than restarting
  await page.clock.fastForward('00:06');
  for (const href of ['/projects/dotfiles', '/projects/lastpass', '/projects/acapulko']) {
    await page.locator(`#tree a[href="${href}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  }
  expect(await page.evaluate((k) => localStorage.getItem(k), SLOT)).toBe(slot);

  // the remainder of the original wait is all that is left
  await page.clock.fastForward('00:20');
  await expect(page.locator('#train')).toBeVisible();
});

test('reduced motion keeps it in the shed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/projects/store');
  await page.clock.fastForward('05:00');
  await expect(page.locator('#train')).toBeHidden();
});
