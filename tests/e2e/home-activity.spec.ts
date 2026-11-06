import { test, expect } from '@playwright/test';
test('Home lists projects and opens a spacious independent prototype viewer', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/?home=1');
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  await expect(page.locator('.studio-bar')).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Open project NOVA Dental', exact: true }),
  ).toBeVisible();
  let fail = false;
  await page.route('**/api/agent-allowance?**', (route) =>
    fail
      ? route.fulfill({ status: 503, json: { error: { message: 'Local connection unavailable' } } })
      : route.fulfill({
          json: {
            checkedAt: new Date().toISOString(),
            windows: [
              { remainingPercent: 76, windowMinutes: 300, resetsAt: 1800000000 },
              { remainingPercent: 34, windowMinutes: 10080, resetsAt: 1800003600 },
            ],
          },
        }),
  );
  await page.getByRole('button', { name: 'Allowance', exact: true }).click();
  await page.getByRole('button', { name: 'Read local allowance' }).click();
  await expect(page.getByLabel('5-hour allowance remaining')).toHaveAttribute('value', '76');
  await expect(page.getByLabel('Weekly allowance remaining')).toHaveAttribute('value', '34');
  fail = true;
  await page.getByRole('button', { name: 'Refresh allowance' }).click();
  await expect(page.getByRole('alert')).toContainText('Showing the last successful check');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open project NOVA Dental', exact: true }).click();
  await expect(page).toHaveURL(/example=nova/);
  await page
    .getByRole('button', { name: 'View prototype Emergency Booking — Current', exact: true })
    .click();
  const viewer = page.getByRole('dialog', { name: 'Emergency Booking — Current', exact: true });
  await expect(viewer).toBeVisible();
  await expect(viewer.locator('.variation-panel')).toHaveCount(0);
  await expect(viewer.getByRole('toolbar')).toHaveCount(0);
  const frame = viewer.locator('iframe[title="Prototype viewer"]');
  await expect(frame).toBeVisible();
  await expect(frame).toHaveAttribute('sandbox', 'allow-scripts');
  await expect(viewer.getByRole('button', { name: 'Next prototype screen' })).toBeEnabled();
  expect((await viewer.locator('.viewer-artboard').boundingBox())!.width).toBeGreaterThan(900);
  await viewer.getByRole('button', { name: 'Next prototype screen' }).click();
  await expect(viewer.locator('.viewer-footer')).toContainText('2 of 7 screens');
  await viewer.getByRole('button', { name: 'Previous prototype screen' }).click();
  await viewer.getByRole('button', { name: 'Show prototype comments' }).click();
  await expect(viewer.locator('.viewer-comments')).toBeVisible();
  await viewer.getByRole('button', { name: 'Show prototype comments' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(frame).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await viewer.getByRole('button', { name: 'Open workspace', exact: true }).click();
  await expect(page.locator('iframe[title="Interactive prototype"]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hide inspector', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open project NOVA Dental', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Recents', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open project NOVA Dental', exact: true }),
  ).toBeVisible();
});
