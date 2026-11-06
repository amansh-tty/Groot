import { mkdir, realpath, readFile, writeFile, rename, unlink, stat } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { z } from 'zod';

export const projectSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).default(''),
    repository: z
      .string()
      .trim()
      .regex(/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/[a-zA-Z0-9_.-]{1,100}$/)
      .refine((value) => !['.', '..'].includes(value.split('/')[1]!))
      .optional(),
  })
  .strict();

// Fixed local location, never a path supplied by the browser.
export async function userWorkspace(root: string) {
  const canonical = await realpath(root);
  const directory = join(canonical, 'workspace');
  await mkdir(directory, { recursive: true });
  if ((await realpath(directory)) !== directory) throw new Error('Workspace must not be a link.');
  return directory;
}

// Explicit external mode uses the supplied designer workspace itself.
export async function directUserWorkspace(directory: string) {
  return realpath(directory);
}

export async function readProject(directory: string) {
  try {
    const path = join(directory, 'project.json');
    if ((await realpath(path)) !== path) throw new Error('Project metadata must not be a link.');
    if ((await stat(path)).size > 32000) throw new Error('Project metadata exceeds 32 KB.');
    return projectSchema.parse(JSON.parse(await readFile(path, 'utf8')));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new Error('Cannot read workspace/project.json. Correct the file and retry.', {
      cause: error,
    });
  }
}

export async function createProject(directory: string, input: unknown) {
  const project = projectSchema.parse(input);
  // Exclusive creation preserves an existing project, including malformed metadata.
  await writeFile(join(directory, 'project.json'), JSON.stringify(project, null, 2) + '\n', {
    flag: 'wx',
  });
  return project;
}

const revision = (content: string) => createHash('sha256').update(content).digest('hex');
export async function projectRepository(directory: string) {
  const project = await readProject(directory);
  if (!project) throw new Error('Create a project before linking its repository.');
  const raw = await readFile(join(directory, 'project.json'), 'utf8');
  return { repository: project.repository ?? '', version: revision(raw) };
}
const repositoryWrites = new Map<string, Promise<unknown>>();
export async function setProjectRepository(directory: string, input: unknown) {
  const data = z
    .object({ repository: z.string().trim().max(140), version: z.string().regex(/^[a-f0-9]{64}$/) })
    .strict()
    .parse(input);
  const path = join(await realpath(directory), 'project.json');
  const pending = (repositoryWrites.get(path) ?? Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const project = await readProject(directory);
      if (!project || (await projectRepository(directory)).version !== data.version)
        throw new Error('Project settings changed. Reload them before saving.');
      const next = projectSchema.parse({ ...project, repository: data.repository || undefined });
      const temporary = join(directory, '.project-' + randomUUID() + '.tmp');
      await writeFile(temporary, JSON.stringify(next, null, 2) + '\n', { flag: 'wx' });
      try {
        if ((await projectRepository(directory)).version !== data.version)
          throw new Error('Project settings changed. Your draft was preserved.');
        await rename(temporary, path);
      } finally {
        await unlink(temporary).catch(() => {});
      }
      return projectRepository(directory);
    });
  repositoryWrites.set(path, pending);
  try {
    return await pending;
  } finally {
    if (repositoryWrites.get(path) === pending) repositoryWrites.delete(path);
  }
}
