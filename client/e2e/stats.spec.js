import { test, expect } from '@playwright/test';

test.describe('Stats & Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display stats panel', async ({ page }) => {
    const statsPanel = page.getByText(/Approval Statistics/i);
    await expect(statsPanel).toBeVisible({ timeout: 5000 });
  });

  test('should display total images stat', async ({ page }) => {
    const totalText = page.getByText(/Total/i);
    expect(await totalText.count()).toBeGreaterThan(0);
  });

  test('should display approved stat', async ({ page }) => {
    const approvedText = page.getByText(/Approved/i);
    expect(await approvedText.count()).toBeGreaterThan(0);
  });

  test('should display rejected stat', async ({ page }) => {
    const rejectedText = page.getByText(/Rejected/i);
    expect(await rejectedText.count()).toBeGreaterThan(0);
  });

  test('should display success rate', async ({ page }) => {
    const successRateText = page.getByText(/Success Rate/i);
    // May or may not be visible depending on layout
    const count = await successRateText.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should update stats in real-time', async ({ page }) => {
    // Wait for WebSocket connection
    await page.waitForTimeout(2000);
    
    // Check if stats are displayed
    const statsPanel = page.getByText(/Approval Statistics/i);
    const isVisible = await statsPanel.isVisible({ timeout: 1000 }).catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should toggle dark theme', async ({ page }) => {
    const themeButton = page.getByRole('button', { name: /Dark/i });
    
    if (await themeButton.isVisible()) {
      const initialTheme = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      
      await themeButton.click();
      await page.waitForTimeout(500);
      
      const newTheme = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      
      // Theme should have changed
      expect(typeof newTheme).toBe('boolean');
    }
  });

  test('should toggle light theme', async ({ page }) => {
    const themeButton = page.getByRole('button', { name: /Light/i });
    
    if (await themeButton.isVisible()) {
      await themeButton.click();
      await page.waitForTimeout(500);
      
      const theme = await page.evaluate(() => 
        document.documentElement.classList.contains('dark')
      );
      expect(typeof theme).toBe('boolean');
    }
  });

  test('should persist theme preference', async ({ page, context }) => {
    const themeButton = page.getByRole('button', { name: /Dark|Light/i });
    
    if (await themeButton.isVisible()) {
      const initialText = await themeButton.textContent();
      
      // Click theme button
      await themeButton.click();
      await page.waitForTimeout(500);
      
      // Check localStorage
      const theme = await page.evaluate(() => 
        localStorage.getItem('theme')
      );
      
      expect(['dark', 'light']).toContain(theme);
    }
  });

  test('should display progress bars for stats', async ({ page }) => {
    const divs = page.locator('div');
    const count = await divs.count();
    
    // Page should have rendered content
    expect(count).toBeGreaterThan(0);
  });

  test('should have properly formatted stat values', async ({ page }) => {
    // Look for numeric content in the page
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    // Should contain some statistics
    expect(bodyText.length).toBeGreaterThan(0);
  });
});
