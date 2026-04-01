import { test, expect } from 'playwright/test';

test.describe('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('text=OpenShift Pulse')).toBeVisible({ timeout: 10_000 });
  });

  test('opens with Cmd+K', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await expect(page.locator('[role="dialog"], [data-testid="command-palette"]').first()).toBeVisible({ timeout: 3_000 });
  });

  test('shows navigation results when typing a view name', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await page.keyboard.type('workloads');
    await expect(page.locator('text=Workloads').first()).toBeVisible({ timeout: 3_000 });
  });

  test('closes with Escape', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await expect(page.locator('[role="dialog"], [data-testid="command-palette"]').first()).toBeVisible({ timeout: 3_000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"], [data-testid="command-palette"]').first()).not.toBeVisible({ timeout: 2_000 });
  });
});
