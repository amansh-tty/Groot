import { test, expect } from '@playwright/test';
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

test('Groot: file tabs, monochrome tools, centered handoff and recorded prompts', async ({
  page,
}) => {
  const root = join(process.env.PLAYGROUND_E2E_ROOT!, 'workspace');
  await mkdir(root, { recursive: true });
  await cp(join(process.cwd(), 'workspace'), root, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeVisible();
  await expect(
    page
      .frameLocator('iframe[title="Spend.In — Dashboard thumbnail"]')
      .getByText('Spending Statistics', { exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: 'docs/groot/home-1440.png' });
  await page.getByRole('button', { name: 'New exploration', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Start a new exploration' });
  await page.screenshot({ path: 'docs/groot/dialog-1440.png' });
  const box = await dialog.boundingBox();
  expect(Math.abs(box!.x + box!.width / 2 - 720)).toBeLessThan(2);
  expect(Math.abs(box!.y + box!.height / 2 - 512)).toBeLessThan(2);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open Spend.In — Dashboard', exact: true }).click();
  await expect(page.getByLabel('Preview screen', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Exploration tools')).toBeVisible();
  const divider = page.getByRole('separator', { name: 'Resize tools panel' });
  await divider.focus();
  await divider.press('ArrowLeft');
  await expect(divider).toHaveAttribute('aria-valuenow', '316');
  const resized = await page.getByLabel('Exploration tools').boundingBox();
  expect(resized!.width).toBeCloseTo(316, 0);
  await page
    .getByLabel('Exploration tools')
    .getByRole('button', { name: 'Hide inspector', exact: true })
    .click();
  await expect(page.getByLabel('Exploration tools')).toBeHidden();
  await page.getByRole('button', { name: 'Show inspector', exact: true }).click();
  await expect(page.getByLabel('Exploration tools')).toBeVisible();
  await expect(page.locator('.toolbar-comment-count')).toBeVisible();

  await page.screenshot({ path: 'docs/groot/editor-1440.png' });
  await expect(page.getByRole('button', { name: 'Controls', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByRole('button', { name: 'Next screen', exact: true })).toBeDisabled();
  await expect(page.locator('.prompt-history')).toContainText('No prompts recorded yet.');
  await writeFile(
    join(root, 'demos/spend-in-dashboard/prompts.json'),
    JSON.stringify([
      {
        prompt: 'Keep chart categories aligned with the source.',
        createdAt: '2026-10-20T10:00:00.000Z',
      },
    ]),
  );
  await expect(page.locator('.prompt-history')).toContainText(
    'Keep chart categories aligned with the source.',
  );
  const longPrompt = Array.from(
    { length: 20 },
    (_, index) => `Requirement ${index + 1}: preserve clear navigation and source spacing.`,
  ).join('\n');
  await writeFile(
    join(root, 'demos/spend-in-dashboard/prompts.json'),
    JSON.stringify([{ prompt: longPrompt, createdAt: '2026-10-23T10:00:00.000Z' }]),
  );
  const more = page
    .locator('.prompt-history')
    .getByRole('button', { name: 'See more: Prompt 1', exact: true });
  await more.click();
  const fullPrompt = page.getByRole('region', { name: 'Prompt 1 — Prompt', exact: true });
  await expect(fullPrompt).toBeVisible();
  await expect(fullPrompt).toContainText('Requirement 20');
  const disclosure = await fullPrompt.boundingBox();
  expect(disclosure!.x).toBeGreaterThanOrEqual(16);
  expect(disclosure!.x + disclosure!.width).toBeLessThanOrEqual(1424);
  expect(disclosure!.y + disclosure!.height).toBeLessThanOrEqual(1008);
  await page.screenshot({ path: test.info().outputPath('prompt-disclosure.png') });
  await page.keyboard.press('Escape');
  await expect(fullPrompt).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .locator('.variation-summary[data-current]')
    .getByRole('button', { name: 'See more: Spend.In — Dashboard', exact: true })
    .click();
  const mobilePrompt = page.locator('.variation-summary[data-current] .prompt-popover');
  await expect(mobilePrompt).toBeVisible();
  await expect
    .poll(async () => (await mobilePrompt.boundingBox())?.x ?? 0)
    .toBeGreaterThanOrEqual(16);
  const narrow = await mobilePrompt.boundingBox();
  expect(narrow!.x).toBeGreaterThanOrEqual(16);
  expect(narrow!.x + narrow!.width).toBeLessThanOrEqual(374);
  await page.keyboard.press('Escape');
  await expect(mobilePrompt).toBeHidden();
  await page.setViewportSize({ width: 1440, height: 1024 });
  await expect(page.locator('.preview-canvas')).toHaveCSS('background-color', 'rgb(31, 31, 31)');
  const toolbar = await page.getByRole('toolbar', { name: 'Preview tools' }).boundingBox();
  expect(toolbar!.height).toBeGreaterThan(toolbar!.width * 3);
  await page.getByRole('button', { name: 'Screen', exact: true }).click();
  const handoff = page.getByRole('dialog', { name: 'Add a screen' });
  await expect(handoff.getByRole('button', { name: 'Copy agent prompt' })).toBeDisabled();
  await page.getByLabel('Screen name', { exact: true }).fill('Transaction details');
  await expect(handoff.getByRole('button', { name: 'Copy agent prompt' })).toBeEnabled();
  await expect(handoff.locator('.handoff-prompt')).toContainText('Transaction details');
  await expect(handoff.locator('.handoff-prompt')).toContainText('another destination');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Open Pickolab — Design System', exact: true }).click();
  await expect(page.getByLabel('Preview screen', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next screen', exact: true }).click();
  await expect(page.getByLabel('Preview screen', { exact: true })).toHaveValue('components');
  await page.getByRole('button', { name: 'Previous screen', exact: true }).click();
  await expect(page.getByLabel('Preview screen', { exact: true })).toHaveValue('foundations');
  await expect(page.locator('.file-tab')).toHaveCount(2);
  await page
    .locator('.file-tabs')
    .getByRole('button', { name: 'Spend.In — Dashboard', exact: true })
    .click();
  await expect(page.locator('.variation-project')).toContainText('Spend.In');
  await page.getByRole('button', { name: 'Close Spend.In — Dashboard', exact: true }).click();
  await expect(page.locator('.file-tab')).toHaveCount(1);
  await page.getByLabel('Recent tabs', { exact: true }).click();
  await page
    .locator('.recent-tab-menu')
    .getByRole('button', { name: 'Spend.In — Dashboard', exact: true })
    .click();
  await expect(page.locator('.file-tab')).toHaveCount(2);
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.locator('#library-title')).toContainText('Explorations');
  await expect(
    page.getByRole('button', { name: 'Open Spend.In — Dashboard', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open Pickolab — Design System', exact: true }),
  ).toBeVisible();
});
