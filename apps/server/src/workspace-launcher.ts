import { lstat, readFile, realpath, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { projectSchema } from './project.js';

function pathError(path: string, message: string) {
  return new Error(`${message}: ${path}`);
}

export async function validateDesignerWorkspace(workspacePath: string) {
  if (!workspacePath.trim()) throw new Error('Workspace path is required.');
  const requestedPath = resolve(workspacePath);
  let workspaceInfo;
  try {
    workspaceInfo = await stat(requestedPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      throw pathError(requestedPath, 'Workspace does not exist');
    throw error;
  }
  if (!workspaceInfo.isDirectory()) throw pathError(requestedPath, 'Workspace is not a directory');

  const path = await realpath(requestedPath);
  const projectPath = join(path, 'project.json');
  let projectInfo;
  try {
    projectInfo = await lstat(projectPath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      throw pathError(projectPath, 'Workspace is missing project.json');
    throw error;
  }
  if (!projectInfo.isFile() || projectInfo.isSymbolicLink())
    throw pathError(projectPath, 'Workspace project.json must be a normal file');
  try {
    const project = projectSchema.parse(JSON.parse(await readFile(projectPath, 'utf8')));
    return { path, project };
  } catch {
    throw pathError(projectPath, 'Workspace project.json is invalid');
  }
}

export async function prepareStudioLaunch(
  workspacePath: string,
  options: {
    repoRoot: string;
    environment?: NodeJS.ProcessEnv;
    packageManagerPath?: string;
  },
) {
  const workspace = await validateDesignerWorkspace(workspacePath);
  const packageManagerPath = options.packageManagerPath;
  if (!packageManagerPath)
    throw new Error('Cannot locate pnpm. Run this command through pnpm groot open.');
  return {
    workspace,
    command: process.execPath,
    args: [packageManagerPath, 'dev'],
    options: {
      cwd: options.repoRoot,
      env: {
        ...(options.environment ?? process.env),
        PLAYGROUND_EXTERNAL_WORKSPACE_ROOT: workspace.path,
      },
      stdio: 'inherit' as const,
    },
  };
}
