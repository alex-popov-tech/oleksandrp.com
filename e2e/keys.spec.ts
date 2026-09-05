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

test('h focuses the tree; k, l, j, Enter unfold elsewhere and open a file', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('h');
  await expect(page.locator('body')).toHaveAttribute('data-pane', 'tree');
  await expect(page.locator('#tree .row.tcur .name')).toHaveText('README.md');
  await page.keyboard.press('k');
  await expect(page.locator('#tree .row.tcur .name')).toHaveText('elsewhere');
  await page.keyboard.press('l');
  await expect(page.locator('#tree [data-children="elsewhere"]')).toBeVisible();
  await page.keyboard.press('j');
  await expect(page.locator('#tree .row.tcur .name')).toHaveText('advent_of_code.go');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/elsewhere\/advent_of_code$/);
  await expect(page.locator('#tree .row.sel .name')).toHaveText('advent_of_code.go');
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
