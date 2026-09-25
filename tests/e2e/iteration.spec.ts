import { test, expect } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

test('designer iteration: element feedback is readable and actionable in local files', async ({
  page,
}) => {
  test.setTimeout(90000);
  const file = join(
    process.env.PLAYGROUND_E2E_ROOT!,
    'demos/emergency-booking-simplified/feedback/feedback.json',
  );
  const initialCount = JSON.parse(await readFile(file, 'utf8')).length;
  await page.goto('/#demo=emergency-booking-simplified');
  const preview = page.frameLocator('iframe[title="Interactive prototype"]');
  await page.getByLabel('Preview screen', { exact: true }).selectOption('confirmation');
  await expect(
    preview.getByRole('button', { name: 'Confirm appointment', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Comment', exact: true }).click();
  await preview.getByRole('button', { name: 'Confirm appointment', exact: true }).click();
  await page
    .getByLabel('Feedback', { exact: true })
    .fill('Make this action feel more connected to the appointment summary.');
  await page.getByRole('button', { name: 'Save feedback', exact: true }).click();
  await expect
    .poll(async () => JSON.parse(await readFile(file, 'utf8')).length)
    .toBe(initialCount + 1);
  await expect
    .poll(async () => JSON.parse(await readFile(file, 'utf8')).at(-1)?.comment)
    .toBe('Make this action feel more connected to the appointment summary.');
  const items = JSON.parse(await readFile(file, 'utf8'));
  const item = items.at(-1);
  expect(item).toMatchObject({
    elementId: 'confirm-appointment',
    screen: 'confirmation',
    state: 'default',
    status: 'open',
  });
  await expect(
    preview.getByRole('button', { name: 'Open feedback ' + items.length, exact: true }),
  ).toBeVisible();
  const row = page.locator('#feedback-' + item.id);
  await row.getByRole('button', { name: 'Resolve', exact: true }).click();
  await expect
    .poll(async () => JSON.parse(await readFile(file, 'utf8')).at(-1)?.status)
    .toBe('resolved');
  await row.getByRole('button', { name: 'Reopen', exact: true }).click();
  await row.getByRole('button', { name: 'Edit', exact: true }).click();
  await page
    .getByLabel('Feedback', { exact: true })
    .fill('Keep the confirmation action beside its summary.');
  await page.getByRole('button', { name: 'Save feedback', exact: true }).click();
  await expect(row).toContainText('Keep the confirmation action beside its summary.');
  await page.getByRole('button', { name: 'Comment', exact: true }).click();
  await preview.getByRole('button', { name: 'Confirm appointment', exact: true }).click();
  await expect(
    preview.getByRole('heading', { name: 'Appointment confirmed', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Create alternative', exact: true }).click();
  await page.getByLabel('Alternative name').fill('V2 iteration alternative');
  await page.getByLabel('Description', { exact: true }).fill('A local comparison experiment.');
  await page
    .getByLabel('Design rationale (optional)')
    .fill('Keep urgency visible during slot selection.');
  await page.getByRole('button', { name: 'Create alternative', exact: true }).last().click();
  await expect(
    page.getByRole('heading', { name: 'V2 iteration alternative', exact: true }),
  ).toBeVisible();
  const alternativeId = new URLSearchParams(new URL(page.url()).hash.slice(1)).get('demo')!;
  const meta = JSON.parse(
    await readFile(
      join(process.env.PLAYGROUND_E2E_ROOT!, 'demos', alternativeId, 'meta.json'),
      'utf8',
    ),
  );
  expect(meta.parentId).toBe('emergency-booking-simplified');
  expect(meta.rationale).toBe('Keep urgency visible during slot selection.');
  expect(
    JSON.parse(
      await readFile(
        join(process.env.PLAYGROUND_E2E_ROOT!, 'demos', alternativeId, 'feedback/feedback.json'),
        'utf8',
      ),
    ),
  ).toEqual([]);
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await page
    .getByLabel('Left exploration', { exact: true })
    .selectOption('emergency-booking-simplified');
  await page
    .getByLabel('Right exploration', { exact: true })
    .selectOption('emergency-booking-urgency-first');
  const left = page.frameLocator('iframe[title="Left interactive prototype"]');
  const right = page.frameLocator('iframe[title="Right interactive prototype"]');
  await left.getByRole('button', { name: /Avery Morgan/ }).click();
  await left.getByLabel('Reason for visit', { exact: false }).fill('Urgent appointment requested');
  await left.getByRole('button', { name: /Find available slots/ }).click();
  await expect(left.getByRole('heading', { name: 'Recommended slots', exact: true })).toBeVisible();
  await expect(right.getByRole('heading', { name: 'Patient', exact: true })).toBeVisible();
  await right.getByRole('button', { name: /Jamie Ellis/ }).click();
  await right.getByRole('button', { name: /Continue/ }).click();
  await right
    .getByLabel('Reason for visit', { exact: false })
    .fill('Same-day appointment requested');
  await right.getByRole('button', { name: /Show same-day recommendations/ }).click();
  await right.getByRole('button', { name: /09:00/ }).first().click();
  await right.getByRole('button', { name: /Continue/ }).click();
  await right.getByRole('button', { name: 'Confirm appointment', exact: true }).click();
  await expect(
    right.getByRole('heading', { name: 'Appointment confirmed', exact: true }),
  ).toBeVisible();
  await expect(left.getByRole('heading', { name: 'Recommended slots', exact: true })).toBeVisible();
  await left.getByRole('button', { name: /09:00/ }).first().click();
  await left.getByRole('button', { name: /Continue/ }).click();
  await left.getByRole('button', { name: 'Confirm appointment', exact: true }).click();
  await expect(
    left.getByRole('heading', { name: 'Appointment confirmed', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('compare.png'), fullPage: true });

  await page.getByRole('button', { name: 'Close comparison', exact: true }).click();
  await page
    .getByLabel('Exploration', { exact: true })
    .selectOption('emergency-booking-simplified');
  await page.getByRole('button', { name: 'Controls', exact: true }).click();
  await page.getByRole('button', { name: 'Show appointment slots', exact: true }).click();
  const gap = page.getByLabel('Card gap', { exact: false });
  await expect(gap).toHaveValue('16');
  await gap.focus();
  await gap.press('ArrowRight');
  await gap.press('ArrowRight');
  await expect(preview.locator('[data-playground-id="appointment-slots"]')).toHaveCSS(
    'gap',
    '24px',
  );
  const controlsFile = join(
    process.env.PLAYGROUND_E2E_ROOT!,
    'demos/emergency-booking-simplified/controls.json',
  );
  expect(JSON.parse(await readFile(controlsFile, 'utf8')).controls[0].value).toBe(16);
  await page.getByRole('button', { name: /^All Demos/ }).click();
  await expect(page.getByRole('alert')).toContainText('Save or discard');
  await expect(
    page.getByRole('heading', { name: 'Emergency Booking — Simplified', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect
    .poll(async () => JSON.parse(await readFile(controlsFile, 'utf8')).controls[0].value)
    .toBe(24);
  await expect(preview.locator('[data-playground-id="appointment-slots"]')).toHaveCSS(
    'gap',
    '24px',
  );
  await page.getByRole('button', { name: 'Undo last change', exact: true }).click();
  await expect
    .poll(async () => JSON.parse(await readFile(controlsFile, 'utf8')).controls[0].value)
    .toBe(16);
  await expect(preview.locator('[data-playground-id="appointment-slots"]')).toHaveCSS(
    'gap',
    '16px',
  );
  await gap.press('ArrowRight');
  await gap.press('ArrowRight');
  const externallyEdited = JSON.parse(await readFile(controlsFile, 'utf8'));
  externallyEdited.controls.find((c: { id: string }) => c.id === 'motion-duration').value = 250;
  await writeFile(controlsFile, JSON.stringify(externallyEdited, null, 2) + '\n');
  await expect(
    page.getByRole('region', { name: 'Designer controls' }).getByRole('alert'),
  ).toContainText('Controls changed externally');
  await page.getByRole('button', { name: 'Reload file values', exact: true }).click();
  await expect(gap).toHaveValue('16');
  await gap.press('ArrowRight');
  await gap.press('ArrowRight');
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect
    .poll(async () => JSON.parse(await readFile(controlsFile, 'utf8')).controls[0].value)
    .toBe(24);
  await page.reload();
  await page.getByLabel('Preview screen', { exact: true }).selectOption('slots');
  await expect(preview.locator('[data-playground-id="appointment-slots"]')).toHaveCSS(
    'gap',
    '24px',
  );
  await page.getByRole('button', { name: 'Controls', exact: true }).click();
  await expect(page.getByLabel('Card gap', { exact: false })).toHaveValue('24');
  await page.screenshot({ path: test.info().outputPath('controls.png'), fullPage: true });
  await page.setViewportSize({ width: 760, height: 900 });
  await expect(page.getByRole('button', { name: 'Comment', exact: true })).toBeVisible();
  await expect(gap).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('controls-narrow.png'), fullPage: true });
  await page.getByRole('button', { name: 'Hide inspector', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Designer controls' })).toBeHidden();
  await page.getByRole('button', { name: 'Show inspector', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Designer controls' })).toBeVisible();
});
