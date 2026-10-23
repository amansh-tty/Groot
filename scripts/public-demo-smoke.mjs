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
  await page.goto(url);
  await expect(page.locator('iframe[title="Interactive prototype"]')).toBeVisible();
  const frame = page.frameLocator('iframe[title="Interactive prototype"]');
  await expect(frame.getByText('Your balance', { exact: false }).first()).toBeVisible();
  assert.equal(
    await page.locator('iframe[title="Interactive prototype"]').getAttribute('sandbox'),
    'allow-scripts',
  );
  await mkdir(fileURLToPath(new URL('../docs/public-demo/', import.meta.url)), { recursive: true });
  await page.screenshot({
    path: fileURLToPath(new URL('../docs/public-demo/demo.png', import.meta.url)),
  });
  await page.getByRole('button', { name: 'Use my own project', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copy setup prompt', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Start a new exploration', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByText('Spend.In — Dashboard', { exact: true }).first()).toBeVisible();
  await page.goto(url + '/?example=nova#demo=emergency-booking');
  await expect(page.locator('iframe[title="Interactive prototype"]')).toBeVisible();
  await expect(
    page
      .frameLocator('iframe[title="Interactive prototype"]')
      .getByText('NOVA', { exact: false })
      .first(),
  ).toBeVisible();
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
    'Public static demo passed: default Spend.In, sandbox, setup handoff, Home, isolated NOVA, setup skill, no backend requests.',
  );
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
