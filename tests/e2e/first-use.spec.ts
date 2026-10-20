import { test, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

test('empty project, creation recovery, agent handoff and isolated example', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Start your project', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Open Emergency Booking/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Start your project', exact: true }).click();
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByLabel('Project name', { exact: true })).toBeFocused();
  await page.getByLabel('Project name', { exact: true }).fill('Acorn');
  await page.getByLabel('Description (optional)').fill('A reading list for small teams');
  await page.route('**/api/workspace?scope=user', async (route) => {
    if (route.request().method() === 'POST')
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: { message: 'Local storage unavailable. Try again.' } }),
      });
    else await route.continue();
  });
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Local storage unavailable');
  await expect(page.getByLabel('Project name', { exact: true })).toHaveValue('Acorn');
  await page.unroute('**/api/workspace?scope=user');
  await page.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your first exploration starts here.' }),
  ).toBeVisible();
  const root = join(process.env.PLAYGROUND_E2E_ROOT!, 'workspace');
  expect(JSON.parse(await readFile(join(root, 'project.json'), 'utf8')).name).toBe('Acorn');
  const trigger = page.getByRole('button', { name: 'New exploration', exact: true });
  await trigger.click();
  const dialog = page.getByRole('dialog', { name: 'Start a new exploration' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Agent prompt')).toHaveValue(/workspace\/demos/);
  await dialog.getByRole('button', { name: 'Copy agent prompt', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close dialog', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Start Here', exact: true }).click();
  await expect(page.locator('.folder-path code')).toHaveText(process.env.PLAYGROUND_E2E_ROOT!);
  await expect(page.getByRole('heading', { name: 'Acorn', exact: true })).toBeVisible();
  await page.getByText('Project files and setup', { exact: true }).click();
  await expect(page.getByText('Built-in workspace', { exact: true })).toBeVisible();
  await expect(page.getByText(/pnpm groot create/)).toBeVisible();
  await page.getByRole('button', { name: 'Design System', exact: true }).click();
  await expect(page.getByText('A design system is optional.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Continue without a design system' }).click();
  await page.getByRole('link', { name: 'NOVA · Example Project', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open Emergency Booking — Simplified', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Design System', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'NOVA design system' })).toBeVisible();
  await page.getByRole('button', { name: 'Explorations', exact: true }).click();
  await page.getByRole('link', { name: 'Back to your workspace' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your first exploration starts here.' }),
  ).toBeVisible();
  const demo = join(root, 'demos/reading-list');
  await mkdir(join(demo, 'src'), { recursive: true });
  await writeFile(
    join(demo, 'meta.json'),
    JSON.stringify({ id: 'reading-list', title: 'Reading list', platform: 'web' }),
  );
  await writeFile(
    join(demo, 'src/App.tsx'),
    'import {useState} from "react"; export default function App(){const [done,set]=useState(false);return <button onClick={()=>set(true)}>{done?"Added to list":"Add book"}</button>}',
  );
  await page.getByRole('button', { name: 'Open Reading list', exact: true }).click();
  const preview = page.frameLocator('iframe[title="Interactive prototype"]');
  await preview.getByRole('button', { name: 'Add book' }).click();
  await expect(preview.getByRole('button', { name: 'Added to list' })).toBeVisible();
  await page.reload();
  await expect(preview.getByRole('button', { name: 'Add book' })).toBeVisible();
  await expect(page.getByText('NOVA DENTAL', { exact: true })).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Comment', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: test.info().outputPath('first-use-narrow.png'), fullPage: true });
});
