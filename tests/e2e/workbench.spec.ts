import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

test('NOVA core loop: discover, interact, fork, externally edit, recover and reopen', async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/?example=nova');
  await expect(
    page.getByRole('button', { name: 'Open Emergency Booking — Current', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open Emergency Booking — Simplified', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open Patient Search', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('gallery.png'), fullPage: true });
  await page.getByRole('button', { name: 'MOBILE', exact: true }).click();
  await expect(page.getByRole('button', { name: /Open Emergency Booking/ })).toHaveCount(0);
  await page.locator('.gallery-filters').getByRole('button', { name: /^ALL/ }).click();
  await page.getByRole('button', { name: 'Design System', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Buttons & inputs' })).toBeVisible();
  await page.getByRole('button', { name: 'Start Here', exact: true }).click();
  await page.getByRole('button', { name: 'Product', exact: true }).click();
  await expect(page.locator('.context-document')).toContainText('NOVA DENTAL');
  await page.getByRole('button', { name: 'All Demos', exact: false }).click();
  await page.getByRole('button', { name: 'Open Emergency Booking — Current', exact: true }).click();
  const preview = page.frameLocator('iframe[title="Interactive prototype"]');
  await expect(
    preview.getByRole('heading', { name: 'Book an emergency appointment' }),
  ).toBeVisible();
  await preview.getByRole('button', { name: /Avery Morgan/ }).click();
  await preview.getByRole('button', { name: /Continue/ }).click();
  await preview
    .getByLabel('Reason for visit', { exact: false })
    .fill('Patient requests an urgent appointment');
  await preview.getByRole('button', { name: /Continue/ }).click();
  await preview.getByRole('button', { name: /Continue/ }).click();
  await preview.getByRole('button', { name: /Continue/ }).click();
  await preview.getByRole('button', { name: /09:00/ }).first().click();
  await preview.getByRole('button', { name: /Continue/ }).click();
  await preview.getByRole('button', { name: /Continue/ }).click();
  await preview.getByRole('button', { name: 'Confirm appointment', exact: true }).click();
  await expect(preview.getByRole('heading', { name: 'Appointment confirmed' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to gallery' }).click();
  await page
    .getByRole('button', { name: 'Open Emergency Booking — Simplified', exact: true })
    .click();
  await expect(
    preview.getByRole('heading', { name: 'Book an emergency appointment' }),
  ).toBeVisible();
  await preview.getByRole('button', { name: /Avery Morgan/ }).click();
  await preview
    .getByLabel('Reason for visit', { exact: false })
    .fill('Patient requests an urgent appointment');
  await preview.getByRole('button', { name: /Find available slots/ }).click();
  await preview.getByRole('button', { name: /09:00/ }).first().click();
  await preview.getByRole('button', { name: /Continue/ }).click();
  await preview.getByRole('button', { name: 'Confirm appointment', exact: true }).click();
  await expect(preview.getByRole('heading', { name: 'Appointment confirmed' })).toBeVisible();
  await page.getByLabel('Preview state').selectOption('error');
  await expect(preview.getByRole('alert')).toContainText('Availability could not be loaded');
  await page.getByLabel('Preview state').selectOption('default');
  await page.getByRole('button', { name: 'Create alternative', exact: true }).click();
  await page.getByLabel('Alternative name').fill('Same-day booking experiment');
  await page.getByRole('button', { name: 'Create alternative', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Same-day booking experiment' })).toBeVisible();
  const id = new URLSearchParams(new URL(page.url()).hash.slice(1)).get('demo')!;
  const source = join(process.env.PLAYGROUND_E2E_ROOT!, 'demos', id, 'src/App.tsx');
  const original = await readFile(source, 'utf8');
  await writeFile(
    source,
    original.replace('Book an emergency appointment', 'Same-day booking, simplified'),
  );
  await expect(preview.getByRole('heading', { name: 'Same-day booking, simplified' })).toBeVisible({
    timeout: 30000,
  });
  await page.screenshot({ path: test.info().outputPath('prototype.png'), fullPage: true });
  await writeFile(source, 'export default function Broken( {');
  await expect(page.getByRole('alert')).toContainText('Preview needs attention', {
    timeout: 30000,
  });
  await expect(
    preview.getByRole('heading', { name: 'Same-day booking, simplified' }),
  ).toBeVisible();
  await writeFile(
    source,
    original.replace('Book an emergency appointment', 'Same-day booking, simplified'),
  );
  await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 30000 });
  await page
    .getByLabel('Exploration', { exact: true })
    .selectOption('emergency-booking-simplified');
  await expect(
    preview.getByRole('heading', { name: 'Book an emergency appointment' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    preview.getByRole('heading', { name: 'Book an emergency appointment' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'My Demos', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open Same-day booking experiment', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'All Demos', exact: false }).click();
  await page.getByRole('button', { name: 'Open Patient Search', exact: true }).click();
  await expect(preview.getByRole('heading', { name: 'Find your patient' })).toBeVisible();
  await preview.getByLabel('Search patients').fill('Zelda');
  await expect(preview.getByRole('heading', { name: 'No patients found' })).toBeVisible();
  await preview.getByRole('button', { name: 'Clear search' }).click();
  await preview.getByRole('button', { name: /Avery Morgan/ }).click();
  await expect(preview.getByText('Patient selected', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
