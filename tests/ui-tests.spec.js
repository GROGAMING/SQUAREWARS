const { test, expect } = require('@playwright/test');

test.describe('Button Interactivity', () => {
  test('Single Player selection advances to next screen', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.setViewportSize({ width: 360, height: 640 });

    await page.locator('button.single-player').click();
    await expect(page.locator('#scoringSelectModal')).toBeVisible();
  });

  test('Back button returns to mode selection', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.setViewportSize({ width: 360, height: 640 });

    await page.locator('button.single-player').click();
    await page.locator('button.qf-cancel').click();
    await expect(page.locator('#modeSelectModal')).toBeVisible();
  });

  test('Overlay blocks background buttons', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.locator('button.single-player').click();
    await page.locator('#scoringSelectModal').click();
    await expect(page.locator('#modeSelectModal')).not.toBeVisible();
  });
});
