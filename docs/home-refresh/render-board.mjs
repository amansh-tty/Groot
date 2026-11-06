/* global document -- Browser-side comparison capture only. */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const folder = fileURLToPath(new URL('./', import.meta.url));
const template = process.argv[2];
if (!template) throw new Error('Pass the installed Mobbin board template path.');
const images = {};
for (const side of ['before', 'after'])
  images[side] =
    'data:image/png;base64,' + (await readFile(join(folder, side + '.png'))).toString('base64');
const measured = JSON.parse(await readFile(join(folder, 'measurements.json'), 'utf8'));
const data = {
  theme: 'dark',
  title: 'Groot Home: project files and explorations',
  meta: 'Web Home, project organization, local test workspace',
  panes: images,
  moves: [
    {
      n: 1,
      lead: 'Project files now have a home.',
      line: 'A file-type browser and project summary sit above the runnable explorations. The after capture includes two documents created in an isolated test workspace.',
      refs: [
        { app: 'Figma', url: 'https://mobbin.com/screens/fb25258c-2581-4c4c-a59f-da737bb4f8a8' },
        { app: 'Jitter', url: 'https://mobbin.com/screens/89cfc7d6-ef33-4997-94a0-e598e9c1fd5f' },
      ],
      after: measured.after,
    },
  ],
};
const html = (await readFile(template, 'utf8')).replace(
  /(<script type="application\/json" id="board-data">)[\s\S]*?(<\/script>)/,
  '$1\n' + JSON.stringify(data).replaceAll('</', '<\\/') + '\n$2',
);
const destination = join(folder, 'comparison.html');
await writeFile(destination, html);
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 1000 },
    deviceScaleFactor: 2,
  });
  await page.goto(pathToFileURL(destination).href);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((img) =>
        img.complete ? Promise.resolve() : new Promise((done) => (img.onload = done)),
      ),
    );
  });
  await page.locator('.board').screenshot({ path: join(folder, 'comparison.png') });
  console.log('Captured self-contained before/after comparison.');
} finally {
  await browser.close();
}
