import { test, expect } from '@playwright/test';
import { cp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

test('user design system uses reusable components inside the Design System view', async ({
  page,
}) => {
  const target = join(process.env.PLAYGROUND_E2E_ROOT!, 'workspace');
  await mkdir(target, { recursive: true });
  await cp(join(process.cwd(), 'workspace'), target, { recursive: true });
  await page.goto('/');
  await page.getByRole('button', { name: 'Design System', exact: true }).click();
  const frame = page.frameLocator('iframe[title="Interactive prototype"]');
  await expect(frame.getByRole('heading', { name: 'Pickolab design system' })).toBeVisible();
  await expect(page.getByText('NOVA DENTAL', { exact: true })).toHaveCount(0);
  await expect(frame.getByRole('heading', { name: 'Conflicting definitions' })).toBeVisible();
  await page.getByLabel('Preview screen', { exact: true }).selectOption('components');
  const main = frame.locator('button[data-preview-state="main"]');
  await expect(main).toHaveCSS('background-color', 'rgb(124, 92, 252)');
  await main.click();
  await expect(frame.getByRole('status')).toHaveText('Button activations: 1');
  await expect(frame.locator('button[data-preview-state="disabled"]')).toBeDisabled();
  await main.focus();
  await main.press('Enter');
  await expect(frame.getByRole('status')).toHaveText('Button activations: 2');
  await expect(frame.locator('button[data-preview-state="hover"]')).toHaveCSS(
    'background-color',
    'rgb(94, 67, 216)',
  );
  await page.screenshot({
    path: test.info().outputPath('design-system-desktop.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(main).toBeVisible();
  await expect(frame.locator('.figma-showcase')).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('design-system-narrow.png'),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/?example=nova');
  await page.getByRole('button', { name: 'Design System', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Buttons & inputs' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Pickolab design system' })).toHaveCount(0);
});
