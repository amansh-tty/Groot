import { test, expect } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

test('empty workspace, own project, agent files, optional design system and separate NOVA', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Start your project' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Open Emergency Booking/ })).toHaveCount(0);
  await page.screenshot({ path: test.info().outputPath('first-launch.png'), fullPage: true });
  await page.getByRole('button', { name: 'Dismiss orientation' }).click();
  await page.getByRole('button', { name: 'Start your project' }).click();
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
  await page.getByRole('button', { name: 'Design System', exact: true }).click();
  await expect(page.getByText('A design system is optional.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Continue without a design system' }).click();
  await expect(page.getByLabel('Agent prompt')).toHaveValue(/workspace\/demos/);
  await page.getByRole('link', { name: 'NOVA · Example Project', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open Emergency Booking — Simplified', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Design System', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'NOVA design system' })).toBeVisible();
  await page.getByRole('link', { name: 'Back to your workspace' }).click();
  await expect(
    page.getByRole('heading', { name: 'Your first exploration starts here.' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Dismiss orientation' })).toHaveCount(0);
  // Real external-agent contract: write a prototype into the user's local files.
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
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Open Reading list', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Open Emergency Booking/ })).toHaveCount(0);
  await page.setViewportSize({ width: 640, height: 800 });
  await page.screenshot({
    path: test.info().outputPath('own-workspace-narrow.png'),
    fullPage: true,
  });
});
