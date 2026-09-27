import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { exportPrototype } from './prototype-export.js';
import { compilePrototype } from './prototype-compiler.js';

const roots: string[] = [];
afterEach(async () => {
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'groot-export-unit-'));
  roots.push(root);
  const demo = join(root, 'demos/test');
  await mkdir(join(demo, 'src'), { recursive: true });
  await writeFile(
    join(demo, 'meta.json'),
    JSON.stringify({ id: 'test', title: 'Export test', platform: 'web' }),
  );
  return { root, demo, output: join(root, 'artifact') };
}
it('shares compilation with preview, bundles JSX, local image and CSS assets without writing source', async () => {
  const { root, demo, output } = await fixture();
  const source =
    'import image from "./dot.png"; import "./style.css"; export default function App(){return <img alt="Local dot" src={image}/>;}';
  await writeFile(join(demo, 'src/App.jsx'), source);
  await writeFile(
    join(demo, 'src/dot.png'),
    Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
      'base64',
    ),
  );
  await writeFile(join(demo, 'src/style.css'), 'body { background-image: url("./dot.png"); }');
  const preview = await compilePrototype(root, demo);
  const artifact = await exportPrototype(root, 'test', output);
  const html = await readFile(artifact.path, 'utf8');
  expect(html).toContain('data:image/png');
  expect(html).toContain('playground-host');
  expect(html.replace(/nonce-[a-z0-9]+|nonce="[a-z0-9]+"/g, 'nonce')).toBe(
    preview.html.replace(/nonce-[a-z0-9]+|nonce="[a-z0-9]+"/g, 'nonce'),
  );
  expect(await readFile(join(demo, 'src/App.jsx'), 'utf8')).toBe(source);
  await expect(exportPrototype(root, 'test', output)).rejects.toThrow();
});
it('rejects broken builds, unsupported literal asset URLs, external CSS and escaping imports', async () => {
  const { root, demo, output } = await fixture();
  const entry = join(demo, 'src/App.tsx');
  await writeFile(entry, 'export default function Broken( {');
  await expect(exportPrototype(root, 'test', output)).rejects.toThrow();
  await writeFile(entry, 'export default function App(){return <img src="/logo.png"/>}');
  await expect(exportPrototype(root, 'test', output)).rejects.toThrow('imported images');
  await writeFile(entry, 'import "./style.css"; export default function App(){return <div/>}');
  await writeFile(
    join(demo, 'src/style.css'),
    'body { background: url(https://example.com/image.png); }',
  );
  await expect(exportPrototype(root, 'test', output)).rejects.toThrow('external asset');
  await writeFile(join(root, 'secret.ts'), 'export default "private"');
  await writeFile(
    entry,
    'import secret from "../../../secret"; export default function App(){return <div>{secret}</div>}',
  );
  await expect(exportPrototype(root, 'test', output)).rejects.toThrow('outside this demo');
  await expect(exportPrototype(root, '../test', output)).rejects.toThrow('Invalid exploration ID');
});
