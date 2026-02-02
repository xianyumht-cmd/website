import { test, expect } from '@playwright/test';

test('Security Headers and Attributes', async ({ page }) => {
  await page.goto('/down/nav/index.html');

  // Check for rel="noopener noreferrer"
  const links = await page.locator('a[target="_blank"]');
  const count = await links.count();
  for (let i = 0; i < count; ++i) {
    const rel = await links.nth(i).getAttribute('rel');
    expect(rel).toContain('noopener');
    expect(rel).toContain('noreferrer');
  }

  // Check ConsoleBan is removed
  const consoleBan = await page.evaluate(() => window.ConsoleBan);
  expect(consoleBan).toBeUndefined();
});
