import { test, expect } from '@playwright/test';

test.skip(({ isMobile }) => isMobile, 'the sprite is 84 columns wide; phones do not get it');

test('the locomotive departs, crosses, and never blocks a click', async ({ page }) => {
  await page.clock.install();
  await page.goto('/projects/store');
  const train = page.locator('#train');
  await expect(train).toBeHidden();

  await page.clock.fastForward('00:13');
  await expect(train).toBeVisible();
  await expect(train).toHaveCSS('pointer-events', 'none');
  expect((await train.textContent())?.split('\n')).toHaveLength(10);

  // it floats over the buffer, so links underneath must still take the click
  await page.locator('#tree a[href="/projects/from_scratch/redis"]').click();
  await expect(page).toHaveURL(/from_scratch\/redis$/);
});

test('reduced motion keeps it in the shed', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.goto('/projects/store');
  await page.clock.fastForward('05:00');
  await expect(page.locator('#train')).toBeHidden();
});
