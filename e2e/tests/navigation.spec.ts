import { test, expect } from 'playwright/test';

test.describe('Navigation', () => {
  test('Welcome page loads and shows key elements', async ({ page }) => {
    await page.goto('/welcome');
    await expect(page.locator('text=OpenShift Pulse')).toBeVisible({ timeout: 10_000 });
  });

  test('Pulse view loads', async ({ page }) => {
    await page.goto('/pulse');
    await expect(page.locator('text=Cluster Pulse')).toBeVisible({ timeout: 10_000 });
  });

  test('Workloads view loads', async ({ page }) => {
    await page.goto('/workloads');
    await expect(page.locator('text=Workloads')).toBeVisible({ timeout: 10_000 });
  });

  test('Compute view loads', async ({ page }) => {
    await page.goto('/compute');
    await expect(page.locator('text=Compute')).toBeVisible({ timeout: 10_000 });
  });

  test('Storage view loads', async ({ page }) => {
    await page.goto('/storage');
    await expect(page.locator('text=Storage')).toBeVisible({ timeout: 10_000 });
  });

  test('Networking view loads', async ({ page }) => {
    await page.goto('/networking');
    await expect(page.locator('text=Networking')).toBeVisible({ timeout: 10_000 });
  });

  test('Admin view loads', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('text=Administration')).toBeVisible({ timeout: 10_000 });
  });

  test('Incident Center loads', async ({ page }) => {
    await page.goto('/incidents');
    await expect(page.locator('text=Incident Center')).toBeVisible({ timeout: 10_000 });
  });

  test('Review Queue loads', async ({ page }) => {
    await page.goto('/reviews');
    await expect(page.locator('text=Review Queue')).toBeVisible({ timeout: 10_000 });
  });

  test('Identity view loads', async ({ page }) => {
    await page.goto('/identity');
    await expect(page.locator('text=Identity')).toBeVisible({ timeout: 10_000 });
  });

  test('Security view loads', async ({ page }) => {
    await page.goto('/security');
    await expect(page.locator('text=Security')).toBeVisible({ timeout: 10_000 });
  });

  test('GitOps view loads', async ({ page }) => {
    await page.goto('/gitops');
    await expect(page.locator('text=GitOps')).toBeVisible({ timeout: 10_000 });
  });

  test('redirects /alerts to /incidents', async ({ page }) => {
    await page.goto('/alerts');
    await expect(page).toHaveURL(/incidents/);
  });

  test('redirects /builds to /workloads', async ({ page }) => {
    await page.goto('/builds');
    await expect(page).toHaveURL(/workloads/);
  });
});
