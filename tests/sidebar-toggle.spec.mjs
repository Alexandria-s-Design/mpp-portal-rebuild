import { test, expect } from '@playwright/test';

test.describe('Sidebar Toggle', () => {
  test('chevron button expands sidebar on page 06', async ({ page }) => {
    await page.goto('/06-Agreement.html');

    // Sidebar starts collapsed at 72px
    const sidebar = page.locator('.h-full.flex.flex-col.relative').first();
    await expect(sidebar).toHaveClass(/w-\[72px\]/);

    // Click expand button
    const btn = page.locator('[aria-label="Expand sidebar"]');
    await expect(btn).toBeVisible();
    await btn.click();

    // Sidebar should now have expanded class
    await expect(sidebar).toHaveClass(/sidebar-expanded/);

    // Text labels should be visible
    const labels = page.locator('.sidebar-label');
    const count = await labels.count();
    expect(count).toBeGreaterThan(0);

    // Check a specific label is visible
    const dashLabel = labels.filter({ hasText: 'Dashboard' });
    await expect(dashLabel.first()).toBeVisible();

    // Button label should change
    const collapseBtn = page.locator('[aria-label="Collapse sidebar"]');
    await expect(collapseBtn).toBeVisible();
  });

  test('chevron button collapses sidebar when clicked again', async ({ page }) => {
    await page.goto('/06-Agreement.html');

    const sidebar = page.locator('.h-full.flex.flex-col.relative').first();
    const btn = page.locator('[aria-label="Expand sidebar"]');

    // Expand
    await btn.click();
    await expect(sidebar).toHaveClass(/sidebar-expanded/);

    // Collapse
    const collapseBtn = page.locator('[aria-label="Collapse sidebar"]');
    await collapseBtn.click();
    await expect(sidebar).not.toHaveClass(/sidebar-expanded/);
  });

  test('expanded sidebar shows all nav labels on Dashboard', async ({ page }) => {
    await page.goto('/Mentor-Protege-Program.html');

    const btn = page.locator('[aria-label="Expand sidebar"]');
    await btn.click();

    // Check expected labels
    const expectedLabels = ['Dashboard', 'Agreements & Reports'];
    for (const label of expectedLabels) {
      const el = page.locator('.sidebar-label', { hasText: label });
      await expect(el.first()).toBeVisible();
    }
  });

  test('sidebar toggle works on a wizard page (page 15)', async ({ page }) => {
    await page.goto('/15-Mentor-Company-Info.html');

    const btn = page.locator('[aria-label="Expand sidebar"]');
    await btn.click();

    const labels = page.locator('.sidebar-label:visible');
    const count = await labels.count();
    expect(count).toBeGreaterThan(3);
  });

  test('screenshot: expanded sidebar', async ({ page }) => {
    await page.goto('/06-Agreement.html');

    const btn = page.locator('[aria-label="Expand sidebar"]');
    await btn.click();

    // Wait for transition
    await page.waitForTimeout(400);

    await page.screenshot({
      path: 'test-results/screenshots/sidebar-expanded.png',
      fullPage: true
    });
  });
});
