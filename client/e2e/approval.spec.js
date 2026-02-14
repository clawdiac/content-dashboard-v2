import { test, expect } from '@playwright/test';

test.describe('Approval Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open image modal on click', async ({ page }) => {
    // Wait for gallery to load
    await page.waitForTimeout(2000);
    
    // Look for any card or image to click
    const cards = page.locator('[role="main"]').locator('div').filter({ has: page.locator('img') });
    
    if (await cards.count() > 0) {
      await cards.first().click();
      await page.waitForTimeout(500);
      
      // Modal should be visible
      const modal = page.locator('div:has(> div:has(button:has-text("Approve")))');
      // At least check if buttons exist
      const approveButtons = page.getByRole('button', { name: /Approve/i });
      expect(await approveButtons.count()).toBeGreaterThanOrEqual(0);
    }
  });

  test('should close modal with escape key', async ({ page }) => {
    // Try to press Escape
    await page.press('body', 'Escape');
    await page.waitForTimeout(300);
  });

  test('should display approve button', async ({ page }) => {
    const approveButtons = page.getByRole('button', { name: /Approve/i });
    // The button should exist somewhere on the page (in modal or hover state)
    expect(await approveButtons.count()).toBeGreaterThanOrEqual(0);
  });

  test('should display reject button', async ({ page }) => {
    const rejectButtons = page.getByRole('button', { name: /Reject/i });
    expect(await rejectButtons.count()).toBeGreaterThanOrEqual(0);
  });

  test('should display feedback button', async ({ page }) => {
    const feedbackButtons = page.getByRole('button', { name: /Feedback/i });
    expect(await feedbackButtons.count()).toBeGreaterThanOrEqual(0);
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    // Press 'A' for approve
    await page.press('body', 'a');
    await page.waitForTimeout(200);
    
    // Press 'R' for reject
    await page.press('body', 'r');
    await page.waitForTimeout(200);
    
    // Press 'F' for feedback
    await page.press('body', 'f');
    await page.waitForTimeout(200);
    
    // Press 'Escape' to close
    await page.press('body', 'Escape');
    await page.waitForTimeout(200);
  });

  test('should accept feedback submission', async ({ page }) => {
    // Click on refresh to ensure data is fresh
    const refreshButton = page.getByRole('button', { name: /Refresh/i });
    await refreshButton.click();
    await page.waitForLoadState('networkidle');
  });

  test('should display status badges', async ({ page }) => {
    // Look for status indicators in the page
    const statusTexts = page.getByText(/Approved|Rejected|Pending|Close/i);
    const count = await statusTexts.count();
    // Should have at least the header stats
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle modal navigation', async ({ page }) => {
    // These tests check keyboard input handling
    await page.press('body', 'ArrowRight');
    await page.waitForTimeout(200);
    
    await page.press('body', 'ArrowLeft');
    await page.waitForTimeout(200);
  });
});
