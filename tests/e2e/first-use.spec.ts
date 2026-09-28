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
  await page.getByRole('button', { name: 'Start Here', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Acorn', exact: true })).toBeVisible();
  await expect(page.getByText('Built-in workspace', { exact: true })).toBeVisible();
  await expect(page.getByText(/pnpm groot create/)).toBeVisible();
  await expect(page.getByText(/pnpm groot open/)).toBeVisible();
  await expect(page.getByText(/PLAYGROUND_EXTERNAL_WORKSPACE_ROOT/)).toHaveCount(0);
  await expect(page.getByText('Designer project folder', { exact: true })).toHaveCount(0);
  const root = join(process.env.PLAYGROUND_E2E_ROOT!, 'workspace');
  expect(JSON.parse(await readFile(join(root, 'project.json'), 'utf8')).name).toBe('Acorn');
  await page.getByRole('button', { name: 'Design System', exact: true }).click();
  await expect(page.getByText('A design system is optional.', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Continue without a design system' }).click();
  await expect(page.getByLabel('Agent prompt')).toHaveValue(/workspace\/demos/);
  await page.getByRole('link', { name: 'NOVA · Example Project', exact: true }).click();
  await expect(page.getByText('EXAMPLE PROJECT', { exact: true })).toBeVisible();
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
  const externalPath = ['C:', 'Design Work', 'Spend.In'].join('\\');
  await page.route('**/api/workspace?scope=user', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        project: { name: 'Spend.In', description: 'External workspace' },
        legacyCount: 0,
        workspace: { mode: 'external', path: externalPath },
      }),
    }),
  );
  await page.route('**/api/demos?scope=user', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        demos: [],
        warnings: [],
        revision: 0,
        designer: { name: 'Local designer', slug: 'local-designer' },
      }),
    }),
  );
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Your first exploration starts here.' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create an exploration' })).toHaveCount(0);
  const copyFirstPrompt = page.getByRole('button', { name: 'Copy starter prompt' });
  await expect(copyFirstPrompt).toBeVisible();
  await expect(page.getByText('Open this project folder in your coding agent')).toBeVisible();
  await expect(page.getByText(externalPath, { exact: true })).toBeVisible();
  await expect(page.getByText('starting points, not requirements', { exact: false })).toBeVisible();
  await expect(
    page.getByText('You can begin before either is complete', { exact: false }),
  ).toBeVisible();
  await expect(page.getByText('Already have your own agent setup? Keep using it.')).toBeVisible();
  await expect(page.getByText('OPTIONAL STARTER PROMPT')).toBeVisible();
  await expect(page.getByText('Groot discovers it automatically', { exact: false })).toBeVisible();
  const firstPrompt = page.getByLabel('Agent prompt');
  await expect(firstPrompt).toHaveValue(
    /available project context and relevant agent instructions/,
  );
  await expect(firstPrompt).toHaveValue(/context\//);
  await expect(firstPrompt).toHaveValue(/@playground\/design-system/);
  await expect(firstPrompt).toHaveValue(/meaningful interactions and important states/);
  await expect(firstPrompt).toHaveValue(/\[EXPLORATION NAME\]/);
  await expect(firstPrompt).toHaveValue(/\[SCENARIO \/ PROBLEM\]/);
  await expect(firstPrompt).toHaveValue(/\[WHAT THE USER NEEDS TO DO\]/);
  await expect(firstPrompt).toHaveValue(/avoid unnecessary workspace-owned dependencies/);
  await expect(firstPrompt).toHaveValue(/package\.json, or node_modules/);
  await expect(firstPrompt).not.toHaveValue(/workspace\/|NOVA|Dental|Spend\.In/i);
  await copyFirstPrompt.click();
  await expect(page.locator('.first-exploration-handoff .agent-prompt [role="status"]')).toHaveText(
    /Copied|copy it manually/,
  );
  await page.getByRole('button', { name: 'Copy folder path' }).click();
  await expect(page.locator('.handoff-path-status')).toHaveText(/copied|copy it manually/i);

  await page.getByRole('button', { name: 'Start Here', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Spend.In', exact: true })).toBeVisible();
  await expect(page.getByText('Current project', { exact: true })).toBeVisible();
  await expect(page.getByText('Designer project folder', { exact: true })).toBeVisible();
  await expect(page.getByText(/pnpm groot create/)).toBeVisible();
  await expect(page.getByText(/pnpm groot open/)).toBeVisible();
  await expect(page.getByText(/PLAYGROUND_EXTERNAL_WORKSPACE_ROOT/)).toHaveCount(0);
  await expect(page.getByText(/Switch project/i)).toHaveCount(0);
  await expect(page.getByText('Designer project folder:', { exact: false })).toContainText(
    externalPath,
  );
  await expect(page.getByText('Open the designer project folder', { exact: false })).toBeVisible();
  await expect(page.getByText('Open this repository', { exact: false })).toHaveCount(0);
  const prompts = page.getByLabel('Agent prompt');
  await expect(prompts).toHaveCount(1);
  await expect(prompts).toHaveValue(/available project context/);
  await expect(prompts).toHaveValue(/demos\/<id>/);
  await expect(prompts).not.toHaveValue(/workspace\/|packages\/design-system|skills\//);
  const startHereText = await page.locator('.context-layout > article').innerText();
  expect(startHereText.indexOf('Create your first exploration')).toBeLessThan(
    startHereText.indexOf('Create another project'),
  );
  await page.getByRole('button', { name: 'Design System', exact: true }).click();
  await expect(page.getByText('design-system/src/index.tsx', { exact: true })).toBeVisible();
  await expect(page.getByText(/workspace\/packages\/design-system/)).toHaveCount(0);
  await page.getByRole('button', { name: 'All Demos', exact: false }).click();
  await expect(page.getByText('Live from', { exact: false })).toContainText('demos/');
  await expect(page.getByText('Live from', { exact: false })).not.toContainText('workspace/demos/');
  await page.unroute('**/api/demos?scope=user');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Open Reading list', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create an exploration' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy starter prompt' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open Reading list', exact: true }).click();
  await expect(page.getByText('NOVA DENTAL', { exact: true })).toHaveCount(0);
  await expect(page.getByText(/\/ Spend\.In$/)).toBeVisible();
  await page.setViewportSize({ width: 640, height: 800 });
  await page.screenshot({
    path: test.info().outputPath('own-workspace-narrow.png'),
    fullPage: true,
  });
});
