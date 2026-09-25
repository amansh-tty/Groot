import { mkdir, realpath, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';

export const projectSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).default(''),
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

export async function readProject(directory: string) {
  try {
    const path = join(directory, 'project.json');
    if ((await realpath(path)) !== path) throw new Error('Project metadata must not be a link.');
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
