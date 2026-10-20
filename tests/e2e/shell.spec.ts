import { test, expect } from '@playwright/test';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

test('designer shell: source-backed gallery, search, context, keyboard, responsive and reconnect', async ({
  page,
}) => {
  const root = join(process.env.PLAYGROUND_E2E_ROOT!, 'workspace');
  await mkdir(root, { recursive: true });
  await cp(join(process.cwd(), 'workspace'), root, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const card = page.getByRole('button', { name: 'Open Spend.In — Dashboard', exact: true });
  await expect(card).toBeVisible();
  const cardSurface = page.locator('.exploration-card').filter({ has: card });
  await expect(cardSurface.locator('iframe')).toHaveAttribute('sandbox', 'allow-scripts');
  await expect(cardSurface.locator('.live-thumbnail')).toHaveAttribute('inert', '');
  const galleryFrame = page.frameLocator('iframe[title="Spend.In — Dashboard thumbnail"]');
  await expect(galleryFrame.getByText('Spending Statistics', { exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('playground-gallery.png'), fullPage: true });
  await page.getByRole('button', { name: 'List view', exact: true }).click();
  await expect(page.locator('.demo-grid')).toHaveClass(/demo-list/);
  await page.getByRole('button', { name: 'Grid view', exact: true }).click();
  await page.getByLabel('Search explorations').fill('no matching idea');
  await expect(page.getByRole('heading', { name: 'No matching explorations.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear search', exact: true }).click();
  await expect(page.getByLabel('Search explorations')).toBeFocused();
  await page.getByRole('button', { name: 'Start Here', exact: true }).click();
  await page.getByRole('button', { name: 'Design-source', exact: true }).click();
  await expect(page.locator('.context-document')).toContainText('Observed facts');
  await expect(page.locator('.context-document')).toContainText(
    'Explicit implementation decisions',
  );
  await page.getByRole('button', { name: 'Design System', exact: true }).click();
  await expect(page.getByLabel('Preview screen')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hide inspector', exact: true })).toBeVisible();
  const frame = page.frameLocator('iframe[title="Interactive prototype"]');
  await expect(frame.getByRole('heading', { name: 'Pickolab design system' })).toBeVisible();
  await page.getByLabel('Preview screen').selectOption('components');
  await frame.locator('button[data-preview-state="main"]').focus();
  await page.keyboard.press('Enter');
  await expect(frame.getByRole('status')).toHaveText('Button activations: 1');
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(card).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await expect(page.getByRole('button', { name: 'My Explorations', exact: true })).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('playground-mobile.png'), fullPage: true });
  await page.route('**/api/demos?scope=user', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: { message: 'Local connection interrupted.' } }),
    }),
  );
  await expect(page.getByRole('alert')).toContainText('Retrying automatically');
  await expect(card).toBeVisible();
  await page.unroute('**/api/demos?scope=user');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('user project loop: alternative, successful edit, failed-build recovery, feedback and isolation', async ({
  page,
}) => {
  test.setTimeout(60000);
  const root = join(process.env.PLAYGROUND_E2E_ROOT!, 'workspace');
  await mkdir(root, { recursive: true });
  await cp(join(process.cwd(), 'workspace'), root, { recursive: true });
  const originalPath = join(root, 'demos/spend-in-dashboard/src/App.tsx');
  const original = await readFile(originalPath, 'utf8');
  const novaPath = join(process.env.PLAYGROUND_E2E_ROOT!, 'demos/emergency-booking/src/App.tsx');
  const nova = await readFile(novaPath, 'utf8');
  await page.setViewportSize({ width: 1600, height: 1100 });
  await page.goto('/#demo=spend-in-dashboard');
  const preview = page.frameLocator('iframe[title="Interactive prototype"]');
  await expect(preview.getByText('Spending Statistics', { exact: true })).toBeVisible();
  const previewElement = page.locator('iframe[title="Interactive prototype"]');
  await expect(previewElement).toHaveCSS('width', '1440px');
  await preview.getByLabel('Search something here').fill('Paypal');
  await page.getByRole('button', { name: 'Fit', exact: true }).click();
  await expect(preview.locator('tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Actual size', exact: true }).click();
  await expect(preview.locator('tbody tr')).toHaveCount(1);
  await preview.getByRole('button', { name: 'Clear search', exact: true }).click();
  await page.getByRole('button', { name: 'Compare', exact: true }).click();
  await expect(page.getByLabel('Right exploration', { exact: true })).toHaveValue('');
  await expect(page.locator('iframe[title="Right interactive prototype"]')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Another direction belongs here.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Close comparison', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hide inspector', exact: true })).toBeVisible();
  await page.screenshot({
    path: test.info().outputPath('playground-workspace.png'),
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Create variation', exact: true }).click();
  const alternativeDialog = page.getByRole('dialog', { name: 'Create an independent alternative' });
  await page.getByLabel('Alternative name').fill('');
  await alternativeDialog.getByRole('button', { name: 'Create alternative', exact: true }).click();
  await expect(alternativeDialog.getByRole('alert')).toContainText('Enter an alternative name');
  await expect(page.getByLabel('Alternative name')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(alternativeDialog).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Create variation', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Create variation', exact: true }).click();
  await page.getByLabel('Alternative name').fill('Spend.In independent direction');
  await page.getByRole('button', { name: 'Create alternative', exact: true }).last().click();
  await expect(
    page.getByRole('heading', { name: 'Spend.In independent direction', exact: true }),
  ).toBeVisible();
  const id = new URLSearchParams(new URL(page.url()).hash.slice(1)).get('demo')!;
  const alternative = join(root, 'demos', id);
  const source = join(alternative, 'src/App.tsx');
  const meta = JSON.parse(await readFile(join(alternative, 'meta.json'), 'utf8'));
  expect(meta.parentId).toBe('spend-in-dashboard');
  expect(meta.authorSlug).toBe('local-designer');
  expect(JSON.parse(await readFile(join(alternative, 'feedback/feedback.json'), 'utf8'))).toEqual(
    [],
  );
  await writeFile(source, original.replaceAll('Spending Statistics', 'Spending exploration'));
  await expect(preview.getByText('Spending exploration', { exact: true })).toBeVisible({
    timeout: 15000,
  });
  await writeFile(source, 'export default function Broken( {');
  await expect(page.getByRole('alert')).toContainText('Preview needs attention', {
    timeout: 15000,
  });
  await expect(preview.getByText('Spending exploration', { exact: true })).toBeVisible();
  await writeFile(source, original.replaceAll('Spending Statistics', 'Spending exploration'));
  await expect(page.getByRole('alert')).toHaveCount(0, { timeout: 15000 });
  await page.getByRole('button', { name: 'Comment', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Preview', exact: true })).toBeVisible();
  await expect(page.getByText('Source files', { exact: true })).toBeHidden();
  await preview
    .locator('[data-playground-id="spending-chart"]')
    .click({ position: { x: 3, y: 3 } });
  await page
    .getByLabel('Feedback', { exact: true })
    .fill('Keep this chart aligned with the source.');
  await page.getByRole('button', { name: 'Save feedback', exact: true }).click();
  const feedback = join(alternative, 'feedback/feedback.json');
  await expect.poll(async () => JSON.parse(await readFile(feedback, 'utf8')).length).toBe(1);
  expect(JSON.parse(await readFile(feedback, 'utf8'))[0]).toMatchObject({
    status: 'open',
    elementId: 'spending-chart',
    screen: 'dashboard',
  });
  await page.reload();
  await page.getByRole('button', { name: /^Comments/ }).click();
  await expect(
    page.getByText('Keep this chart aligned with the source.', { exact: true }),
  ).toBeVisible();
  expect(JSON.parse(await readFile(feedback, 'utf8'))[0].status).toBe('open');
  expect(await readFile(originalPath, 'utf8')).toBe(original);
  expect(await readFile(novaPath, 'utf8')).toBe(nova);
  const iframe = page.locator('iframe[title="Interactive prototype"]');
  await expect(iframe).toHaveAttribute('sandbox', 'allow-scripts');
  await expect(preview.getByText('Spending exploration', { exact: true })).toBeVisible();
  const inner = page.frames().find((f) => f.url().includes('/frame?'))!;
  const access = await inner.evaluate(async () => {
    let parentBlocked = false;
    try {
      void window.parent.document.body;
    } catch {
      parentBlocked = true;
    }
    let networkBlocked = false;
    try {
      await fetch('/api/health');
    } catch {
      networkBlocked = true;
    }
    return { parentBlocked, networkBlocked, origin: window.origin };
  });
  expect(access).toEqual({ parentBlocked: true, networkBlocked: true, origin: 'null' });
});
