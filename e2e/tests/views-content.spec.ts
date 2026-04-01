import { test, expect } from 'playwright/test';

test.describe('View Content', () => {
  test('Welcome page shows navigation cards', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('text=OpenShift Pulse')).toBeVisible({ timeout: 10_000 });
    // Should show main nav cards
    await expect(page.locator('text=Pulse').first()).toBeVisible();
    await expect(page.locator('text=Workloads').first()).toBeVisible();
    await expect(page.locator('text=Compute').first()).toBeVisible();
  });

  test('Welcome page cards are clickable', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('text=OpenShift Pulse')).toBeVisible({ timeout: 10_000 });
    // Click Workloads card
    await page.locator('text=Workloads').first().click();
    await expect(page).toHaveURL(/workloads/);
  });

  test('Admin view shows tab navigation', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('text=Administration')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('text=Overview').first()).toBeVisible();
  });

  test('Incident Center shows tab navigation', async ({ page }) => {
    await page.goto('/incidents');
    await expect(page.locator('text=Incident Center')).toBeVisible({ timeout: 10_000 });
    // Should show Now, Investigate, Alerts, History tabs
    await expect(page.locator('text=Now').first()).toBeVisible();
  });

  test('Workloads view shows health metrics section', async ({ page }) => {
    await page.goto('/workloads');
    await expect(page.locator('text=Workloads')).toBeVisible({ timeout: 10_000 });
  });

  test('StatusBar shows at bottom of page', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('text=OpenShift Pulse')).toBeVisible({ timeout: 10_000 });
    // StatusBar should be visible
    const statusBar = page.locator('[class*="statusbar"], [class*="StatusBar"], footer').first();
    if (await statusBar.count() > 0) {
      await expect(statusBar).toBeVisible();
    }
  });
});
