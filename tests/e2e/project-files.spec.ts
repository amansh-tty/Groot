import { test, expect } from '@playwright/test';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

test('project file hub creates independent documents, links prototypes, and handles failures', async ({
  page,
}) => {
  const root = join(process.env.PLAYGROUND_E2E_ROOT!, 'workspace');
  await mkdir(root, { recursive: true });
  await cp(join(process.cwd(), 'workspace'), root, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1024 });
  await page.goto('/#page=start');
  await page.getByRole('button', { name: 'Project files', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Project files', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'New file', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'New project file' });
  await form.getByLabel('File type', { exact: true }).selectOption('plan');
  await form.getByLabel('File name', { exact: true }).fill('Dashboard planning');
  await form
    .getByLabel('Plan content', { exact: true })
    .fill('Review spending categories and preserve the source layout.');
  await form.getByLabel('Related explorations', { exact: true }).selectOption('spend-in-dashboard');
  await page.route('**/api/files?scope=user', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Temporary save failure' } }),
        })
      : route.continue(),
  );
  await form.getByRole('button', { name: 'Create file', exact: true }).click();
  await expect(form.getByRole('alert')).toContainText('Temporary save failure');
  await expect(form.getByLabel('File name', { exact: true })).toHaveValue('Dashboard planning');
  await page.unroute('**/api/files?scope=user');
  await form.getByRole('button', { name: 'Create file', exact: true }).click();
  await expect(form).toBeHidden();
  await page.getByRole('button', { name: 'Open file Dashboard planning', exact: true }).click();
  const detail = page.getByRole('dialog', { name: 'Dashboard planning', exact: true });
  await expect(detail).toContainText('preserve the source layout');
  await detail.getByRole('button', { name: 'Spend.In — Dashboard', exact: true }).click();
  await expect(page.locator('iframe[title="Interactive prototype"]')).toBeVisible();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: 'Start Here', exact: true }).click();
  await page.getByRole('button', { name: 'Project files', exact: true }).click();
  await page.getByRole('button', { name: 'New file', exact: true }).click();
  await form.getByLabel('File name', { exact: true }).fill('Figma source');
  await form
    .getByLabel('Source URL', { exact: true })
    .fill('https://www.figma.com/design/test-source');
  await form.getByRole('button', { name: 'Create file', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Project files', exact: true }).click();
  await page.getByRole('button', { name: 'Open file Figma source', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Open original source' })).toHaveAttribute(
    'href',
    'https://www.figma.com/design/test-source',
  );
  await page.keyboard.press('Escape');
  await page.getByLabel('Search project files', { exact: true }).fill('Dashboard planning');
  await expect(
    page.getByRole('button', { name: 'Open file Dashboard planning', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open file Figma source', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Clear file search', exact: true }).click();
  await page.getByRole('button', { name: /^Plans/ }).click();
  await expect(
    page.getByRole('button', { name: 'Open file Dashboard planning', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^All files/ }).click();

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole('button', { name: 'Open file Dashboard planning', exact: true }).click();
  await expect(detail).toBeVisible();
  await page.keyboard.press('Escape');
  const fileList = await page.request.get('/api/files?scope=user');
  const data = await fileList.json();
  const plan = data.files.find((file: { title: string }) => file.title === 'Dashboard planning');
  const path = join(root, 'project-files', plan.id + '.json');
  const saved = JSON.parse(await readFile(path, 'utf8'));
  saved.body = 'Changed by the external agent';
  await writeFile(path, JSON.stringify(saved));
  await page.getByRole('button', { name: 'Open file Dashboard planning', exact: true }).click();
  await expect(detail).toContainText('Changed by the external agent', { timeout: 10000 });
  await page.keyboard.press('Escape');
  const rejected = await page.request.post('/api/files?scope=example', {
    headers: { origin: 'http://127.0.0.1:4311' },
    data: { title: 'No example edits', kind: 'note' },
  });
  expect(rejected.status()).toBe(403);
});
