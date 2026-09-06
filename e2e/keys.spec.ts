import { test, expect } from '@playwright/test';

test.skip(({ isMobile }) => isMobile, 'the keyboard layer is desktop only');

test('j/k move the cursor and relative numbers follow', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('j');
  await page.keyboard.press('j');
  await page.keyboard.press('j');
  const lines = page.locator('#buffer .ln');
  await expect(lines.nth(3)).toHaveClass(/cur/);
  await expect(lines.nth(3).locator('.nr')).toHaveText('4');
  await expect(lines.nth(0).locator('.nr')).toHaveText('3');
  await expect(lines.nth(2).locator('.nr')).toHaveText('1');
  await expect(lines.nth(4).locator('.nr')).toHaveText('1');
  await page.keyboard.press('k');
  await expect(lines.nth(2)).toHaveClass(/cur/);
  await expect(lines.nth(2).locator('.nr')).toHaveText('3');
  await page.keyboard.press('G');
  await expect(lines.last()).toHaveClass(/cur/);
  await page.keyboard.type('gg');
  await expect(lines.first()).toHaveClass(/cur/);
});

test('h focuses the tree; gg, h, l, j and Enter drive it', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('h');
  await expect(page.locator('body')).toHaveAttribute('data-pane', 'tree');
  await expect(page.locator('#tree .row.tcur .name')).toHaveText('README.md');
  await page.keyboard.type('gg');
  await expect(page.locator('#tree .row.tcur .name')).toHaveText('work');
  await page.keyboard.press('h');
  await expect(page.locator('#tree [data-children="work"]')).toBeHidden();
  await page.keyboard.press('l');
  await expect(page.locator('#tree [data-children="work"]')).toBeVisible();
  await page.keyboard.press('j');
  await expect(page.locator('#tree .row.tcur .name')).toHaveText('lokalise.md');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/work\/lokalise$/);
  await expect(page.locator('#tree .row.sel .name')).toHaveText('lokalise.md');
  await expect(page.locator('body')).toHaveAttribute('data-pane', 'buffer');
  await expect(page.locator('#buffer .ln').first()).toHaveClass(/cur/);
});

test('h on an open folder folds it, h on a file goes to its folder', async ({ page }) => {
  await page.goto('/projects/from_scratch/redis');
  await page.keyboard.press('h');
  await expect(page.locator('#tree .row.tcur .name')).toHaveText('redis.go');
  await page.keyboard.press('h');
  await expect(page.locator('#tree .row.tcur .name')).toHaveText('from_scratch');
  await page.keyboard.press('h');
  await expect(page.locator('#tree [data-children="projects/from_scratch"]')).toBeHidden();
  await page.keyboard.press('l');
  await expect(page.locator('#tree [data-children="projects/from_scratch"]')).toBeVisible();
});

test(':q drops to a shell and nvim returns to the same page', async ({ page }) => {
  await page.goto('/projects/from_scratch/redis');
  await page.keyboard.press(':');
  await page.keyboard.type('q');
  await page.keyboard.press('Enter');
  await expect(page.locator('#shell')).toBeVisible();
  await expect(page.locator('#app')).toBeHidden();
  await page.keyboard.type('ls');
  await page.keyboard.press('Enter');
  await expect(page.locator('#shell')).toContainText('zsh: command not found: ls');
  await page.keyboard.type('nvim');
  await page.keyboard.press('Enter');
  await expect(page.locator('#app')).toBeVisible();
  await expect(page.locator('#buffer .ln').first()).toContainText('Redis');
});

test('unknown commands show E492, ? opens help', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press(':');
  await page.keyboard.type('wat');
  await page.keyboard.press('Enter');
  await expect(page.locator('#cmdline')).toHaveText('E492: Not an editor command: wat');
  await expect(page.locator('#cmdline')).toHaveText('hjkl to move · Enter to open · :q to quit', { timeout: 5000 });
  await page.keyboard.press('?');
  await expect(page.locator('#help')).toBeVisible();
  await page.keyboard.press('q');
  await expect(page.locator('#help')).toBeHidden();
});

test('folders fold on a fresh load and keep folding after navigating', async ({ page }) => {
  // regression: the bind guard used a falsy '' so listeners stacked up, and an even
  // number of them folded then instantly unfolded again
  await page.goto('/');
  const work = page.locator('#tree [data-children="work"]');
  await expect(work).toBeVisible();
  await page.locator('#tree .row.folder[data-folder="work"]').click();
  await expect(work).toBeHidden();
  await page.locator('#tree .row.folder[data-folder="work"]').click();
  await expect(work).toBeVisible();

  for (const href of ['/projects/store', '/projects/from_scratch/redis', '/work/epam']) {
    await page.locator(`#tree a[href="${href}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await page.locator('#tree .row.folder[data-folder="work"]').click();
    await expect(work, `folding after navigating to ${href}`).toBeHidden();
    await page.locator('#tree .row.folder[data-folder="work"]').click();
    await expect(work).toBeVisible();
  }
});

test('the shell logs exactly one echo and one error per command', async ({ page }) => {
  // regression: a second submit listener re-read the cleared input and logged a bare prompt
  await page.goto('/');
  await page.keyboard.press(':');
  await page.keyboard.type('q');
  await page.keyboard.press('Enter');
  await expect(page.locator('#shell')).toBeVisible();
  await page.keyboard.type('echo oops');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-shell-log] div')).toHaveText([
    '~/oleksandr $ echo oops',
    'zsh: command not found: echo',
  ]);
  await page.keyboard.type('fd .');
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-shell-log] div')).toHaveCount(4);
});
