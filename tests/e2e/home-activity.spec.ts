import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('Home shows scoped PRs and local allowance with recovery; preview fits without hiding tools', async ({
  page,
}) => {
  await page.route('**/api/contributions?scope=example', (route) =>
    route.fulfill({
      json: [
        {
          number: 42,
          title: 'Review dashboard exploration',
          html_url: 'https://github.com/amansh-tty/Groot/pull/42',
          state: 'closed',
          merged_at: '2026-11-01T10:00:00Z',
        },
      ],
    }),
  );
  let fail = false;
  let reads = 0;
  await page.route('**/api/agent-allowance?scope=example', (route) => {
    reads++;
    return fail
      ? route.fulfill({ status: 503, json: { error: { message: 'Local connection unavailable' } } })
      : route.fulfill({
          json: {
            checkedAt: new Date().toISOString(),
            windows: [
              { remainingPercent: 76, windowMinutes: 300, resetsAt: 1800000000 },
              { remainingPercent: 34, windowMinutes: 10080, resetsAt: 1800003600 },
            ],
          },
        });
  });
  await page.goto('/?example=nova#page=all');
  await expect(page.getByRole('heading', { name: 'PR contributions' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Review dashboard exploration/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Project files', exact: true })).toHaveCount(0);
  await expect(
    page.locator('.studio-bar').getByText('Example project', { exact: true }),
  ).toHaveCount(0);
  expect(reads).toBe(0);
  await page.getByRole('button', { name: 'Read local allowance' }).click();
  await expect(page.getByLabel('5-hour allowance remaining')).toHaveAttribute('value', '76');
  await expect(page.getByLabel('Weekly allowance remaining')).toHaveAttribute('value', '34');
  fail = true;
  await page.getByRole('button', { name: 'Refresh allowance' }).click();
  await expect(page.getByRole('alert')).toContainText('Showing the last successful check');
  await expect(page.getByLabel('5-hour allowance remaining')).toHaveAttribute('value', '76');
  // No allowance screenshot: personal account information never becomes a published artifact.
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/?example=nova#demo=emergency-booking');
  const frame = page.locator('iframe[title="Interactive prototype"]');
  await expect(frame).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hide inspector', exact: true })).toBeVisible();
  const previous = page.getByRole('button', { name: 'Previous screen on canvas' });
  await expect(previous).toBeDisabled();
  await page.getByRole('button', { name: 'Next screen on canvas' }).click();
  await expect(page.locator('.screen-heading')).toContainText('2 of 7');
  await expect(previous).toBeEnabled();
  await previous.click();
  await expect(page.locator('.screen-heading')).toContainText('1 of 7');
  const canvas = await page.locator('.preview-canvas').boundingBox();
  const artboard = await page.locator('.preview-frame-wrap').boundingBox();
  expect(artboard!.y).toBeGreaterThanOrEqual(canvas!.y + 120);
  expect(artboard!.y + artboard!.height).toBeLessThanOrEqual(canvas!.y + canvas!.height - 40);
  await mkdir('docs/home-activity', { recursive: true });
  await page.screenshot({ path: 'docs/home-activity/preview.png' });
});
