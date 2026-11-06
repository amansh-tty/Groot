import { test, expect } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
test('create a project and board, persist cards and connectors, recover external conflicts', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/?home=1');
  await page.getByRole('button', { name: 'New project', exact: true }).first().click();
  const create = page.getByRole('dialog', { name: 'New project', exact: true });
  await create.getByLabel('Project name', { exact: true }).fill('Planning workspace');
  await create.getByLabel('Description', { exact: true }).fill('A separate product workspace');
  await create.getByRole('button', { name: 'Create project', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Project overview', exact: true })).toContainText(
    'Planning workspace',
  );
  const projectId = new URL(page.url()).searchParams.get('project')!;
  await page.route('**/api/contributions?**', (route) =>
    route.fulfill({
      json: {
        repository: 'amansh-tty/Groot',
        pulls: [
          {
            number: 42,
            title: 'Project-specific contribution',
            html_url: 'https://github.com/amansh-tty/Groot/pull/42',
            state: 'open',
            merged_at: null,
          },
        ],
      },
    }),
  );
  await page.getByRole('button', { name: 'Start Here', exact: true }).click();
  await page.getByLabel('Project GitHub repository', { exact: true }).fill('amansh-tty/Groot');
  await page.getByRole('button', { name: 'Save repository', exact: true }).click();
  await expect(page.locator('.repository-settings').getByRole('status')).toContainText(
    'Repository linked',
  );
  await page.getByRole('button', { name: 'Project overview', exact: true }).click();
  await expect(page.getByRole('link', { name: /Project-specific contribution/ })).toBeVisible();
  await page.getByRole('button', { name: 'New board', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'New planning board', exact: true });
  await form.getByLabel('Board name', { exact: true }).fill('Opportunity map');
  await form.getByRole('button', { name: 'Create board', exact: true }).click();
  await expect(page.getByLabel('Board title')).toHaveValue('Opportunity map');
  const boardId = new URLSearchParams(new URL(page.url()).hash.slice(1)).get('board')!;
  await page.getByRole('button', { name: 'Add your first card', exact: true }).click();
  await page.getByLabel('Card 1 text', { exact: true }).fill('Goal: preserve project context');
  await page.getByRole('button', { name: 'Move card 1', exact: true }).focus();
  await page.keyboard.press('Shift+ArrowLeft');
  await page.keyboard.press('Shift+ArrowLeft');
  await page.keyboard.press('Shift+ArrowLeft');
  await page.getByRole('button', { name: 'Add text card', exact: true }).click();
  await page.getByLabel('Card 2 text', { exact: true }).fill('Assumption: a visual plan helps');
  await page.getByRole('button', { name: 'Connect cards', exact: true }).click();
  await page.getByRole('button', { name: 'Move card 1', exact: true }).click();
  await page.getByRole('button', { name: 'Move card 2', exact: true }).click();
  await expect(page.locator('.board-connectors g')).toHaveCount(1);
  await page.getByRole('button', { name: 'Save board', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Save board', exact: true })).toBeDisabled();
  await page.reload();
  await expect(page.getByLabel('Card 1 text', { exact: true })).toHaveValue(
    'Goal: preserve project context',
  );
  await expect(page.locator('.board-connectors g')).toHaveCount(1);
  await mkdir('docs/project-home', { recursive: true });
  await page.screenshot({ path: 'docs/project-home/board.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Fit planning board', exact: true }).click();
  await page.screenshot({ path: 'docs/project-home/board-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await page.getByRole('button', { name: 'Zoom in board', exact: true }).click();
  await expect(page.locator('.board-zoom')).toContainText('90%');
  await page.getByLabel('Card 1 text', { exact: true }).fill('Unsaved local draft');
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  const leave = page.getByRole('dialog', { name: 'Leave this board?', exact: true });
  await expect(leave).toBeVisible();
  await leave.getByRole('button', { name: 'Keep editing' }).click();
  await page.evaluate(() => {
    location.hash = 'page=all';
  });
  await expect(page.getByRole('alert')).toContainText('Save or discard');
  await expect(page.getByLabel('Card 1 text', { exact: true })).toHaveValue('Unsaved local draft');
  const path = join(
    process.env.PLAYGROUND_E2E_ROOT!,
    'workspace/projects',
    projectId,
    'boards',
    boardId + '.json',
  );
  const file = JSON.parse(await readFile(path, 'utf8'));
  file.nodes[0].text = 'Saved by the external agent';
  await writeFile(path, JSON.stringify(file, null, 2) + '\n');
  await page.getByRole('button', { name: 'Save board', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('changed outside Groot');
  await expect(page.getByLabel('Card 1 text', { exact: true })).toHaveValue('Unsaved local draft');
  await page.getByRole('button', { name: 'Reload saved board', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Reload saved board?', exact: true })
    .getByRole('button', { name: 'Discard changes' })
    .click();
  await expect(page.getByLabel('Card 1 text', { exact: true })).toHaveValue(
    'Saved by the external agent',
  );
  file.nodes[0].text = 'Live agent update';
  await writeFile(path, JSON.stringify(file, null, 2) + '\n');
  await expect(page.getByLabel('Card 1 text', { exact: true })).toHaveValue('Live agent update', {
    timeout: 10000,
  });
  await page.getByRole('button', { name: 'Project', exact: true }).click();
  await expect(page.getByRole('link', { name: /Opportunity map/ })).toBeVisible();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open project Planning workspace', exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator('.projects-contribution-list')
      .getByRole('link', { name: 'amansh-tty/Groot', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Search projects', { exact: true }).fill('Planning workspace');
  await expect(page.locator('.project-cover-card')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
