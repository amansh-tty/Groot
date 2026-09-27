import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { join, relative, isAbsolute } from 'node:path';
import { demoMetaSchema } from '@playground/shared';
import { compilePrototype } from './prototype-compiler.js';

/** Builds from the current source, without preview caches, watchers or a running server. */
export async function exportPrototype(root: string, id: string, outputDirectory: string) {
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(id)) throw new Error('Invalid exploration ID.');
  const canonical = await realpath(root);
  const demo = await realpath(join(canonical, 'demos', id));
  const rel = relative(canonical, demo);
  if (rel.startsWith('..') || isAbsolute(rel))
    throw new Error('Exploration is outside the workspace.');
  const metadataPath = await realpath(join(demo, 'meta.json'));
  if (relative(demo, metadataPath) !== 'meta.json') throw new Error('Metadata must not be a link.');
  const meta = demoMetaSchema.parse(JSON.parse(await readFile(metadataPath, 'utf8')));
  if (meta.id !== id) throw new Error('Metadata ID must match the exploration folder.');
  const { html } = await compilePrototype(canonical, demo, true);
  const bytes = Buffer.byteLength(html);
  if (bytes > 20_000_000) throw new Error('Portable artifact exceeds the 20 MB limit.');
  await mkdir(outputDirectory, { recursive: true });
  const output = join(await realpath(outputDirectory), 'prototype.html');
  // Never overwrite existing exports or follow an existing output-file symlink.
  await writeFile(output, html, { flag: 'wx' });
  return { path: output, bytes, exploration: meta.id };
}
