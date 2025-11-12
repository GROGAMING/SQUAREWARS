const { test, expect } = require('@playwright/test');

test.describe('Button Interactivity', () => {
  test('Single Player selection advances to next screen', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.setViewportSize({ width: 360, height: 640 });

    await page.locator('[data-qa="btn-single"]').click();
    await expect(page.locator('#scoringSelectModal')).toBeVisible();
  });

  test('Back button returns to mode selection', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.setViewportSize({ width: 360, height: 640 });

    await page.locator('[data-qa="btn-single"]').click();
    await page.locator('[data-qa="btn-back"]').click();
    await expect(page.locator('#modeSelectModal')).toBeVisible();
  });

  test('Overlay blocks background buttons', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.locator('[data-qa="btn-single"]').click();
    await page.locator('#scoringSelectModal').click();
    await expect(page.locator('#modeSelectModal')).not.toBeVisible();
  });

  test('Buttons remain interactive after resize', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.setViewportSize({ width: 360, height: 640 });

    await page.locator('[data-qa="btn-single"]').click();
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.locator('[data-qa="btn-back"]').click();
    await expect(page.locator('#modeSelectModal')).toBeVisible();
  });
});

test.describe('Navigation Reliability', () => {
  test('Single Player button navigates to scoring screen', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.setViewportSize({ width: 360, height: 640 });

    await page.locator('[data-qa="btn-single"]').click();
    await expect(page.locator('#scoringSelectModal')).toBeVisible();
  });

  test('Back button returns to mode selection', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.setViewportSize({ width: 360, height: 640 });

    await page.locator('[data-qa="btn-single"]').click();
    await page.locator('[data-qa="btn-back"]').click();
    await expect(page.locator('#modeSelectModal')).toBeVisible();
  });

  test('Buttons remain functional after resize', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.setViewportSize({ width: 360, height: 640 });

    await page.locator('[data-qa="btn-single"]').click();
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.locator('[data-qa="btn-back"]').click();
    await expect(page.locator('#modeSelectModal')).toBeVisible();
  });

  test('Modal buttons do not block navigation', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.setViewportSize({ width: 1024, height: 768 });

    await page.locator('[data-qa="btn-single"]').click();
    await page.locator('#scoringSelectModal').click();
    await expect(page.locator('#modeSelectModal')).not.toBeVisible();
  });
});
