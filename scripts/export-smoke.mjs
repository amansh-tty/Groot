/* global window -- Browser-side Playwright evaluation callbacks only. */
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium, expect } from '@playwright/test';
import { exportPrototype } from '../apps/server/dist/prototype-export.js';

// No Playwright webServer and no Fastify: only an isolated static directory is served.
for (const port of [5173, 4310]) {
  let running = false;
  try {
    running = (
      await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(1000) })
    ).ok;
  } catch {
    /* Expected: Groot is stopped. */
  }
  assert.equal(running, false, `Stop Groot on port ${port} before running test:export.`);
}
const repo = fileURLToPath(new URL('../', import.meta.url));
const buildDir = await mkdtemp(join(tmpdir(), 'groot-export-build-'));
const isolated = await mkdtemp(join(tmpdir(), 'groot-portable-'));
const rel = relative(repo, isolated);
assert.ok(rel.startsWith('..') || isAbsolute(rel), 'Artifact must be outside the repository');
let browser;
let server;
try {
  // Optional path lets us test the exact HTML returned by the public export command.
  const result = process.argv[2]
    ? { path: resolve(process.argv[2]), bytes: (await readFile(resolve(process.argv[2]))).length }
    : await exportPrototype(repo, 'emergency-booking', buildDir);
  await copyFile(result.path, join(isolated, 'prototype.html'));
  // Build a JSX + imported PNG fixture too. Delete its entire source before opening a browser.
  const fixture = join(buildDir, 'fixture');
  const demo = join(fixture, 'demos/image/src');
  await mkdir(demo, { recursive: true });
  await writeFile(
    join(fixture, 'demos/image/meta.json'),
    JSON.stringify({ id: 'image', title: 'Image', platform: 'web' }),
  );
  await writeFile(
    join(demo, 'pixel.png'),
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
      'base64',
    ),
  );
  await writeFile(
    join(demo, 'App.jsx'),
    'import image from "./pixel.png"; export default function App(){return <img alt="Embedded image" src={image}/>;}',
  );
  const asset = await exportPrototype(fixture, 'image', join(buildDir, 'asset'));
  await copyFile(asset.path, join(isolated, 'image.html'));
  await rm(buildDir, { recursive: true, force: true });
  const harness = `<!doctype html><html><body><iframe title="Portable prototype" sandbox="allow-scripts" src="/prototype.html"></iframe><script>
    window.messages=[];
    addEventListener('message',event=>{if(event.source===document.querySelector('iframe').contentWindow)window.messages.push(event.data)});
    window.select=(screen,state)=>document.querySelector('iframe').contentWindow.postMessage({channel:'playground-host',type:'select',screen,state},'*');
  </script></body></html>`;
  await writeFile(join(isolated, 'harness.html'), harness);
  const served = [];
  server = createServer(async (request, response) => {
    const name = request.url?.slice(1);
    served.push(request.url);
    if (name === 'favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }
    if (!['prototype.html', 'image.html', 'harness.html'].includes(name)) {
      response.writeHead(404);
      response.end();
      return;
    }
    try {
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.end(await readFile(join(isolated, name)));
    } catch {
      response.writeHead(500);
      response.end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
  const page = await browser.newPage();
  const requests = [];
  const errors = [];
  page.on('request', (request) => requests.push(request.url()));
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(origin + '/prototype.html');
  await expect(page.getByRole('heading', { name: 'Book an emergency appointment' })).toBeVisible();
  await page.getByRole('button', { name: /Avery Morgan/ }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page
    .getByLabel('Reason for visit', { exact: false })
    .fill('Patient requests an urgent appointment');
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: /09:00/ }).first().click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await page.getByRole('button', { name: 'Confirm appointment', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Appointment confirmed' })).toBeVisible();
  await page.goto(origin + '/harness.html');
  await expect
    .poll(() => page.evaluate(() => window.messages.some((m) => m.type === 'ready')))
    .toBe(true);
  const config = await page.evaluate(() => window.messages.find((m) => m.type === 'ready').config);
  assert.equal(config.screens.length, 7);
  const frame = page.frameLocator('iframe');
  const headings = [
    'Patient search',
    'Urgency details',
    'Appointment type',
    'Provider',
    'Time slot',
    'Operatory',
    'Confirmation',
  ];
  for (const [index, screen] of config.screens.entries()) {
    await page.evaluate((screen) => window.select(screen, 'default'), screen.id);
    await expect(frame.getByRole('heading', { name: headings[index], exact: true })).toBeVisible();
  }
  for (const state of config.states) {
    await page.evaluate((state) => window.select('patient', state), state.id);
    if (state.id === 'error')
      await expect(frame.getByRole('alert')).toContainText('Availability could not be loaded');
    else if (state.id === 'loading') await expect(frame.getByRole('status')).toBeVisible();
    else if (state.id === 'no-provider-available')
      await expect(
        frame.getByRole('heading', { name: 'No matching providers available' }),
      ).toBeVisible();
    else if (state.id === 'confirmation')
      await expect(frame.getByRole('heading', { name: 'Appointment confirmed' })).toBeVisible();
    else
      await expect(
        frame.getByRole('heading', { name: 'Patient search', exact: true }),
      ).toBeVisible();
  }
  await page.evaluate(() => window.select('urgency', 'urgent'));
  await expect(frame.getByRole('combobox', { name: /Urgency/ })).toHaveValue('emergency');
  await page.evaluate(() => window.select('urgency', 'default'));
  await expect(frame.getByRole('combobox', { name: /Urgency/ })).toHaveValue('urgent');
  assert.deepEqual(
    await page.evaluate(() => window.messages.filter((m) => m.type === 'error')),
    [],
  );
  await page.goto(origin + '/image.html');
  await expect
    .poll(() => page.getByAltText('Embedded image').evaluate((img) => img.naturalWidth))
    .toBe(1);
  const fileURL = pathToFileURL(join(isolated, 'prototype.html')).href;
  await page.goto(fileURL);
  await expect(page.getByRole('heading', { name: 'Book an emergency appointment' })).toBeVisible();
  await page.getByRole('button', { name: /Avery Morgan/ }).click();
  await page.getByRole('button', { name: /Continue/ }).click();
  await expect(page.getByRole('heading', { name: 'Urgency details', exact: true })).toBeVisible();
  assert.deepEqual(errors, []);
  assert.ok(
    requests.every(
      (url) =>
        url === fileURL ||
        url.startsWith('data:') ||
        [
          origin + '/prototype.html',
          origin + '/harness.html',
          origin + '/image.html',
          origin + '/favicon.ico',
        ].includes(url),
    ),
    JSON.stringify(requests),
  );
  assert.ok(
    served.every((path) =>
      ['/prototype.html', '/harness.html', '/image.html', '/favicon.ico'].includes(path),
    ),
  );
  console.log(
    JSON.stringify(
      {
        exploration: 'emergency-booking',
        artifact: join(isolated, 'prototype.html'),
        bytes: result.bytes,
        screens: config.screens.length,
        states: config.states.length,
        requests,
        grootApiRequests: 0,
        result:
          'PASS: booking, declared screens/states, embedded image, HTTP and file://; no source/dependency requests',
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  // Only known temporary build inputs are cleaned. Retain isolated HTML as inspection evidence.
  await rm(buildDir, { recursive: true, force: true });
}
