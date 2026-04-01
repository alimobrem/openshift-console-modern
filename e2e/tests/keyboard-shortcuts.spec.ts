import { test, expect } from 'playwright/test';

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('text=OpenShift Pulse')).toBeVisible({ timeout: 10_000 });
  });

  test('Cmd+B opens Resource Browser', async ({ page }) => {
    await page.keyboard.press('Meta+b');
    await expect(page.locator('text=Resource Browser').first()).toBeVisible({ timeout: 3_000 });
  });

  test('Cmd+J toggles Dock', async ({ page }) => {
    await page.keyboard.press('Meta+j');
    // Dock should appear (logs/terminal/events tabs)
    await expect(page.locator('text=Terminal').first()).toBeVisible({ timeout: 3_000 });
  });

  test('Escape closes overlays', async ({ page }) => {
    await page.keyboard.press('Meta+k');
    await expect(page.locator('[role="dialog"], [data-testid="command-palette"]').first()).toBeVisible({ timeout: 3_000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"], [data-testid="command-palette"]').first()).not.toBeVisible({ timeout: 2_000 });
  });
});
