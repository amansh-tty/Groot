import { lstat, mkdir, readdir, readFile, realpath, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { PlanningBoards } from './planning-boards.js';
import { createProject, readProject, projectSchema } from './project.js';

export const projectId = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/);
export const repositoryName = z
  .string()
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/[a-zA-Z0-9_.-]{1,100}$/)
  .refine((value) => !value.endsWith('/.') && !value.endsWith('/..'));
const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT';

export class Projects {
  constructor(readonly directory: string) {}
  private async folder(create = false) {
    const root = await realpath(this.directory);
    const path = join(root, 'projects');
    if (create) await mkdir(path, { recursive: true });
    try {
      const info = await lstat(path);
      if (!info.isDirectory() || info.isSymbolicLink() || (await realpath(path)) !== path)
        throw new Error('Projects must use a normal workspace directory.');
    } catch (error) {
      if (!missing(error) || create) throw error;
    }
    return path;
  }
  async resolve(id: string) {
    projectId.parse(id);
    const path = join(await this.folder(), id);
    const info = await lstat(path);
    if (
      !info.isDirectory() ||
      info.isSymbolicLink() ||
      (await realpath(path)) !== path ||
      !(await readProject(path))
    )
      throw new Error('Project is unavailable.');
    return path;
  }
  async list() {
    const folder = await this.folder();
    try {
      const entries = await readdir(folder, { withFileTypes: true });
      if (entries.length > 100) throw new Error('This workspace supports up to 100 projects.');
      const projects: { id: string; directory: string }[] = [];
      const warnings: string[] = [];
      for (const entry of entries) {
        if (!projectId.safeParse(entry.name).success) continue;
        try {
          projects.push({ id: entry.name, directory: await this.resolve(entry.name) });
        } catch {
          warnings.push(`Cannot open project ${entry.name}. Its files were preserved.`);
        }
      }
      return { projects, warnings };
    } catch (error) {
      if (missing(error)) return { projects: [], warnings: [] };
      throw error;
    }
  }
  async create(input: unknown) {
    input = projectSchema.parse(input);
    const folder = await this.folder(true);
    if ((await readdir(folder)).length >= 100)
      throw new Error('This workspace supports up to 100 projects.');
    const name = z.object({ name: z.string().trim().min(1).max(100) }).parse(input).name;
    const slug =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) || 'project';
    const id = slug + '-' + randomUUID().slice(0, 8);
    const path = join(folder, id);
    await mkdir(path);
    await createProject(path, input);
    for (const child of ['demos', 'context', 'data', 'packages/design-system', '.console'])
      await mkdir(join(path, child), { recursive: true });
    return { id, directory: path };
  }
}

// Bounded metadata only: no project agents, watchers or prototype execution on Home.
export async function projectSummary(id: string, directory: string, fallback?: string) {
  const project = await readProject(directory);
  if (!project && !fallback) return null;
  let modified = project ? (await stat(join(directory, 'project.json'))).mtime.toISOString() : '';
  let latestPrompt: { prompt: string; createdAt: string } | null = null;
  const demos: { id: string; title: string; platform: 'web' | 'mobile'; modified: string }[] = [];
  const folder = join(directory, 'demos');
  try {
    if ((await lstat(folder)).isSymbolicLink()) throw new Error('Demos must not be a link.');
    for (const entry of (await readdir(folder, { withFileTypes: true })).slice(0, 200)) {
      if (!entry.isDirectory() || !projectId.safeParse(entry.name).success) continue;
      const demoPath = join(folder, entry.name);
      const safeJson = async (file: string) => {
        const path = join(demoPath, file);
        const info = await lstat(path);
        if (!info.isFile() || info.isSymbolicLink() || info.size > 32000)
          throw new Error('Invalid metadata.');
        return JSON.parse(await readFile(path, 'utf8'));
      };
      try {
        const meta = z
          .object({
            id: projectId,
            title: z.string().max(200),
            platform: z.enum(['web', 'mobile']).default('web'),
          })
          .parse(await safeJson('meta.json'));
        if (meta.id !== entry.name) continue;
        const updated = (await stat(join(demoPath, 'src/App.tsx'))).mtime.toISOString();
        demos.push({ ...meta, modified: updated });
        if (updated > modified) modified = updated;
        try {
          const prompts = z
            .array(
              z.object({ prompt: z.string().min(1).max(12000), createdAt: z.string().datetime() }),
            )
            .max(100)
            .parse(await safeJson('prompts.json'));
          for (const prompt of prompts)
            if (!latestPrompt || prompt.createdAt > latestPrompt.createdAt) latestPrompt = prompt;
        } catch {
          /* Missing or malformed history is never invented. */
        }
      } catch {
        /* Invalid prototypes remain available through project diagnostics. */
      }
    }
  } catch (error) {
    if (!missing(error)) throw error;
  }
  if (!project && !demos.length) return null;
  let boardCount: number | null;
  try {
    const list = await new PlanningBoards(directory).list();
    boardCount = list.boards.length;
    for (const board of list.boards) if (board.modified > modified) modified = board.modified;
  } catch {
    boardCount = null;
  }
  demos.sort((a, b) => b.modified.localeCompare(a.modified));
  return {
    id,
    name: project?.name ?? fallback!,
    description: project?.description ?? '',
    repository: project?.repository ?? '',
    modified,
    latestPrompt,
    prototypeCount: demos.length,
    boardCount,
    cover: demos[0] ?? null,
  };
}
