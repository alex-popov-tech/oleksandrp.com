import { test, expect } from '@playwright/test';

test.skip(({ isMobile }) => isMobile, 'the phone project covers the drawer layout');

const PAGES = ['/', '/projects/other/advent_of_code', '/projects/from_scratch/dns', '/projects/openai_chat'];

// an iPad Air in landscape, and the ~1000px a split-view window gets
for (const [label, width, height] of [
  ['ipad-landscape', 1180, 820],
  ['ipad-split', 1000, 820],
] as const) {
  test(`${label} shows every page without sideways scrolling`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    for (const url of PAGES) {
      await page.goto(url);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${url} at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
}
