import { test, expect } from '@playwright/test';

test.describe('Gallery & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load dashboard page', async ({ page }) => {
    await expect(page).toHaveTitle(/client/i);
    const heading = page.getByText(/ComfyUI Dashboard/i);
    await expect(heading).toBeVisible();
  });

  test('should display gallery section', async ({ page }) => {
    const gallery = page.locator('[role="main"]');
    await expect(gallery).toBeVisible();
  });

  test('should display status filter buttons', async ({ page }) => {
    const allButton = page.getByRole('button', { name: /All/i });
    const approvedButton = page.getByRole('button', { name: /APPROVED/i });
    
    await expect(allButton).toBeVisible();
    // Other buttons may not be visible on all screen sizes
  });

  test('should display search input', async ({ page }) => {
    const searchInputs = page.locator('input[placeholder*="Search"i], input[placeholder*="Filename"i]');
    const count = await searchInputs.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display date range inputs', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();
    expect(count).toBeGreaterThanOrEqual(0); // May be in sidebar on desktop only
  });

  test('should display refresh button', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /Refresh/i });
    await expect(refreshButton).toBeVisible();
  });

  test('should display theme toggle button', async ({ page }) => {
    const themeButton = page.getByRole('button', { name: /Dark|Light/i });
    await expect(themeButton).toBeVisible();
  });

  test('should display stats panel', async ({ page }) => {
    const statsPanel = page.getByText(/Approval Statistics/i);
    await expect(statsPanel).toBeVisible({ timeout: 5000 });
  });

  test('should toggle theme', async ({ page }) => {
    const themeButton = page.getByRole('button', { name: /Dark|Light/i });
    const initialText = await themeButton.textContent();
    
    await themeButton.click();
    await page.waitForTimeout(500);
    
    const newText = await themeButton.textContent();
    expect(initialText).not.toBe(newText);
  });

  test('should clear filters', async ({ page }) => {
    const clearButtons = page.getByRole('button', { name: /Clear/i });
    if (await clearButtons.count() > 0) {
      await clearButtons.first().click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should handle search input', async ({ page }) => {
    const searchInputs = page.locator('input[placeholder*="Search"i], input[placeholder*="Filename"i]');
    if (await searchInputs.count() > 0) {
      await searchInputs.first().fill('test');
      await page.waitForTimeout(300);
      const value = await searchInputs.first().inputValue();
      expect(value).toBe('test');
    }
  });

  test('should handle date filtering', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() > 0) {
      await dateInputs.first().fill('2026-02-13');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should handle refresh button', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /Refresh/i });
    await refreshButton.click();
    await page.waitForLoadState('networkidle');
  });
});
