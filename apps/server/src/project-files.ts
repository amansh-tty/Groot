import { lstat, mkdir, readdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/);
const sourceUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
    } catch {
      return false;
    }
  }, 'Use an http or https URL without credentials.');
export const projectFileInput = z
  .object({
    title: z.string().trim().min(1).max(100),
    kind: z.enum(['design', 'plan', 'presentation', 'note']),
    description: z.string().trim().max(300).default(''),
    url: sourceUrl.default(''),
    body: z.string().max(12000).default(''),
    relatedDemoIds: z.array(id).max(20).default([]),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.kind === 'design' && !value.url)
      ctx.addIssue({ code: 'custom', message: 'A design source needs its original file URL.' });
    if (new Set(value.relatedDemoIds).size !== value.relatedDemoIds.length)
      ctx.addIssue({ code: 'custom', message: 'Related exploration IDs must be unique.' });
  });
const missing = (error: unknown) => (error as NodeJS.ErrnoException)?.code === 'ENOENT';

/** Project-owned documents only. Never accepts a filesystem path from the browser. */
export class ProjectFiles {
  constructor(readonly directory: string) {}
  private async folder(create = false) {
    const root = await realpath(this.directory);
    const folder = join(root, 'project-files');
    if (create) await mkdir(folder, { recursive: true });
    try {
      const info = await lstat(folder);
      if (!info.isDirectory() || info.isSymbolicLink() || (await realpath(folder)) !== folder)
        throw new Error('Project files must use a normal directory inside the workspace.');
    } catch (error) {
      if (!missing(error) || create) throw error;
    }
    return folder;
  }
  async list() {
    const folder = await this.folder();
    const files: (z.infer<typeof projectFileInput> & { id: string; createdAt: string })[] = [];
    const warnings: string[] = [];
    let entries;
    try {
      entries = await readdir(folder, { withFileTypes: true });
    } catch (error) {
      if (missing(error)) return { files, warnings };
      throw error;
    }
    if (entries.length > 200) throw new Error('Project files exceed the 200-file limit.');
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!/^[a-z0-9][a-z0-9-]{0,79}\.json$/.test(entry.name)) continue;
      try {
        const path = join(folder, entry.name);
        const info = await lstat(path);
        if (!info.isFile() || info.isSymbolicLink() || info.size > 32000)
          throw new Error('Expected an ordinary JSON file under 32 KB.');
        const raw = JSON.parse(await readFile(path, 'utf8'));
        const { id: documentId, createdAt, ...content } = raw;
        const file = {
          ...projectFileInput.parse(content),
          id: id.parse(documentId),
          createdAt: z.string().datetime().parse(createdAt),
        };
        if (file.id + '.json' !== entry.name) throw new Error('File ID must match its filename.');
        files.push(file);
      } catch (error) {
        warnings.push(
          entry.name + ': ' + (error instanceof Error ? error.message : 'Cannot read this file.'),
        );
      }
    }
    return { files: files.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), warnings };
  }
  async create(input: unknown) {
    const value = projectFileInput.parse(input);
    const folder = await this.folder(true);
    if ((await readdir(folder)).length >= 200)
      throw new Error('Project files exceed the 200-file limit.');
    const slug =
      value.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'file';
    const file = {
      ...value,
      id: slug + '-' + randomUUID().slice(0, 8),
      createdAt: new Date().toISOString(),
    };
    const content = JSON.stringify(file, null, 2) + '\n';
    if (Buffer.byteLength(content) > 32000)
      throw new Error('Project file exceeds 32 KB. Shorten its content.');
    await writeFile(join(folder, file.id + '.json'), content, { flag: 'wx' });
    return file;
  }
}
