import { test, expect } from '@playwright/test';
import { cp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

test('Spend.In dashboard preserves Figma content and provides bounded local interactions', async ({
  page,
}) => {
  const target = join(process.env.PLAYGROUND_E2E_ROOT!, 'workspace');
  await mkdir(target, { recursive: true });
  await cp(join(process.cwd(), 'workspace'), target, { recursive: true });
  await page.setViewportSize({ width: 1800, height: 1400 });
  await page.goto('/#demo=spend-in-dashboard');
  const frame = page.frameLocator('iframe[title="Interactive prototype"]');
  await expect(frame.getByText('Spending Statistics', { exact: true })).toBeVisible();
  await expect(frame.getByRole('tooltip')).toContainText('$15.030');
  await frame
    .getByRole('button', { name: 'Jan expense; exact value not supplied', exact: true })
    .focus();
  await expect(frame.getByRole('tooltip')).toContainText('Not provided');
  await frame.getByRole('button', { name: 'Next year' }).click();
  await expect(frame.getByRole('status')).toContainText('No source data provided for 2025');
  await frame.getByRole('button', { name: 'Return to 2024' }).click();
  await frame.getByLabel('Search something here').fill('Paypal');
  await expect(frame.locator('tbody tr')).toHaveCount(1);
  await frame.getByRole('button', { name: 'Clear search' }).click();
  await expect(frame.locator('tbody tr')).toHaveCount(3);
  await frame.getByRole('button', { name: 'Date', exact: true }).click();
  await expect(frame.locator('tbody tr').first()).toContainText('Jan 06,2022');
  await frame.getByRole('button', { name: 'Date', exact: true }).click();
  await frame.getByRole('button', { name: 'Insight', exact: true }).click();
  await expect(frame.getByRole('button', { name: 'Insight', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await frame.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await frame.getByRole('button', { name: 'Top Up', exact: true }).click();
  await expect(frame.getByRole('status')).toContainText('not supplied');
  await frame.getByRole('button', { name: 'Dismiss notice' }).click();
  const images = frame.locator('img');
  await expect
    .poll(() =>
      images.evaluateAll((elements) =>
        elements.every(
          (element) =>
            (element as HTMLImageElement).complete &&
            (element as HTMLImageElement).naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
  // Inspect the frame at its original design dimensions, independent of workbench chrome.
  const previewFrame = page.frames().find((item) => item.url().includes('/frame?'))!;
  await page.goto(previewFrame.url());
  await page.setViewportSize({ width: 1440, height: 1024 });
  await expect(page.getByText('Spending Statistics', { exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('dashboard-1440.png'), fullPage: true });
});
