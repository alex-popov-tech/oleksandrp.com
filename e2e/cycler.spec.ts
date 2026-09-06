import { test, expect } from '@playwright/test';

test('the README showcase types code and moves to the next snippet', async ({ page }) => {
  await page.goto('/');
  const cycler = page.locator('code-cycler');
  const src = cycler.locator('a[data-src]');
  const first = await src.textContent();
  expect(first).toContain('redis-go/app/internal/resp/unmarshal.go:7-25');
  await expect(cycler.locator('.caret')).toBeAttached();
  // the cycler pauses while off screen, which it is on a phone: the README wraps above it
  await cycler.scrollIntoViewIfNeeded();
  await expect.poll(async () => (await cycler.locator('[data-live]').innerText()).length, { timeout: 15_000 }).toBeGreaterThan(80);
  await expect(src).not.toHaveText(first!, { timeout: 60_000 });
  await expect(cycler.locator('a[data-project]')).toHaveText('git.go');
});

test('reduced motion shows the first snippet complete and still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const live = page.locator('code-cycler [data-live]');
  await expect(live).toContainText('func Parse(r Reader)');
  await expect(live).toContainText('unexpected input');
  await expect(page.locator('code-cycler .caret')).toHaveCount(0);
});

test('a from-scratch project page cycles its own excerpts', async ({ page }) => {
  await page.goto('/projects/from_scratch/dns');
  await expect(page.locator('code-cycler a[data-src]')).toHaveText('dns-go/internal/message/question.go:31-56');
  await expect(page.locator('code-cycler template[data-snippet]')).toHaveCount(2);
  await expect(page.locator('#buffer .tx.media')).toHaveCount(0);
});
