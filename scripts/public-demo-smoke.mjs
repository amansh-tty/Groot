/* global document -- Runs in the isolated browser verification context. */
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

const root = fileURLToPath(new URL('../dist/client/', import.meta.url));
const requests = [];
const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  requests.push(pathname);
  const path = resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
  if (!path.startsWith(resolve(root) + sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const content = await readFile(path);
    res.setHeader(
      'Content-Type',
      {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.md': 'text/plain',
      }[extname(path)] ?? 'application/octet-stream',
    );
    res.end(content);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const url = `http://127.0.0.1:${server.address().port}`;
  const captures = fileURLToPath(new URL('../docs/project-home/', import.meta.url));
  await mkdir(captures, { recursive: true });
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'Projects', exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open project NOVA Dental', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Open project Spend.In', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.studio-bar')).toHaveCount(0);
  await expect(
    page.getByText('Explore the bundled projects. Your own work stays local.', { exact: true }),
  ).toHaveCount(0);
  await expect(page.locator('.projects-home-filter > span')).toHaveCount(0);
  await expect(
    page.frameLocator('iframe[title="Spend.In — Dashboard thumbnail"]').locator('body'),
  ).toContainText('Spend.In');
  await expect(
    page.frameLocator('iframe[title="Emergency Booking — Current thumbnail"]').locator('body'),
  ).toContainText('NOVA');
  await expect(page.locator('.thumbnail-loading')).toHaveCount(0);
  await page.screenshot({ path: resolve(captures, 'home.png') });
  await page.getByRole('button', { name: 'New project', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy setup prompt', exact: true })).toBeVisible();
  const setup = page.getByRole('dialog', { name: 'Use Groot with your project' });
  await setup.getByLabel('Computer OS', { exact: true }).selectOption('windows');
  await setup.getByLabel('Your agent', { exact: true }).selectOption('claude');
  await page.screenshot({ path: resolve(captures, 'setup.png') });
  await setup.getByText('Manual steps and setup brief', { exact: true }).click();
  await expect(setup.getByLabel('Local setup prompt', { exact: true })).toContainText(
    'Windows with Claude Code',
  );
  await expect(setup.locator('.setup-details pre').first()).toContainText('pnpm.cmd groot setup');
  await expect(setup.locator('.setup-details pre').first()).toContainText(
    'git clone --branch main',
  );
  await setup.getByLabel('Computer OS', { exact: true }).selectOption('macos');
  await setup.getByLabel('Your agent', { exact: true }).selectOption('codex');
  await expect(setup.getByLabel('Local setup prompt', { exact: true })).toContainText(
    'macOS with Codex',
  );
  await expect(setup.locator('.setup-details pre').first()).not.toContainText('pnpm.cmd');
  await setup.getByLabel('Computer OS', { exact: true }).selectOption('linux');
  await setup.getByLabel('Your agent', { exact: true }).selectOption('other');
  await expect(setup.getByLabel('Local setup prompt', { exact: true })).toContainText(
    'Linux with a compatible local MCP client',
  );
  await setup.getByText('Manual steps and setup brief', { exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 390));
  await page.screenshot({ path: resolve(captures, 'setup-mobile.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Planning board', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Allowance', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Read local allowance', exact: true })).toHaveCount(
    0,
  );
  await page.getByRole('button', { name: 'Use my local allowance', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copy setup prompt', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Open project NOVA Dental', exact: true }).click();
  await page
    .getByRole('button', { name: 'View prototype Emergency Booking — Current', exact: true })
    .click();
  const viewer = page.getByRole('dialog', { name: 'Emergency Booking — Current', exact: true });
  await expect(viewer.locator('iframe[title="Prototype viewer"]')).toBeVisible();
  await expect(viewer.getByRole('button', { name: 'Next prototype screen' })).toBeEnabled();
  await viewer.getByRole('button', { name: 'Next prototype screen' }).click();
  await expect(viewer.locator('.viewer-footer')).toContainText('2 of 7 screens');
  await viewer.getByRole('button', { name: 'Previous prototype screen' }).click();
  await page.screenshot({ path: resolve(captures, 'viewer.png') });
  await viewer.getByRole('button', { name: 'Open workspace', exact: true }).click();
  await expect(page.locator('iframe[title="Interactive prototype"]')).toHaveAttribute(
    'sandbox',
    'allow-scripts',
  );
  await expect(
    page
      .frameLocator('iframe[title="Interactive prototype"]')
      .getByText('NOVA', { exact: false })
      .first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Open project Spend.In', exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 390));
  await page
    .getByRole('button', { name: 'Open project NOVA Dental', exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.frameLocator('iframe[title="Emergency Booking — Current thumbnail"]').locator('body'),
  ).toContainText('NOVA');
  await page
    .getByRole('button', { name: 'Open project Spend.In', exact: true })
    .scrollIntoViewIfNeeded();
  await expect(
    page.frameLocator('iframe[title="Spend.In — Dashboard thumbnail"]').locator('body'),
  ).toContainText('Spend.In');
  await expect(page.locator('.thumbnail-loading')).toHaveCount(0);
  await page.locator('.projects-home-bar').scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(captures, 'home-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(url + '/?project=local#demo=spend-in-dashboard');
  await expect(
    page
      .frameLocator('iframe[title="Interactive prototype"]')
      .getByText('Your balance', { exact: false })
      .first(),
  ).toBeVisible();
  await page.goto(url + '/?example=nova#page=start');
  await page.getByRole('button', { name: 'Project files', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Project files', exact: true })).toBeVisible();
  const skill = await fetch(url + '/setup/SKILL.md');
  assert.equal(skill.status, 200);
  assert.match(await skill.text(), /groot setup/);
  assert.equal(
    requests.some((path) => path.startsWith('/api')),
    false,
    'Public app must make no backend API requests',
  );
  assert.deepEqual(errors, []);
  console.log(
    'Public static demo passed: global project Home, mobile layout, spacious viewer, declared screens, sandbox, local-only setup/allowance, isolated project links and no backend requests.',
  );
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
