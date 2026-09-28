import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { projectSchema } from './project.js';

const agents = `# Groot designer workspace

This folder is the complete designer workspace. Work only inside it; do not read or write files outside this directory.

## Explorations

Each exploration lives in \`demos/<id>/\`. The lowercase-hyphenated directory name must match \`meta.json\`'s \`id\`. Metadata requires \`id\`, \`title\`, and \`platform\` (\`web\` or \`mobile\`); it may also include \`description\`, designer-owned \`rationale\`, \`author\`, \`authorSlug\`, \`tags\`, and \`parentId\`.

Implement the experience in \`demos/<id>/src/App.tsx\` as a default React component. Groot supplies React and the preview runtime. The component may receive \`screen\`, \`state\`, and numeric \`controls\` props. Optional \`prototype.config.ts\` may declare screens, states, and a desktop or mobile viewport. Keep exploration assumptions and decisions in its \`README.md\`.

Import shared UI through \`@playground/design-system\`. Its public entry is \`design-system/src/index.tsx\`. Read relevant established product information from \`context/\`. Prototype imports must stay inside the exploration, \`data/\` when present, and \`design-system/\`; never import sibling exploration source or files outside this workspace.

## Feedback

Groot stores element feedback as a JSON array in \`demos/<id>/feedback/feedback.json\`. Read open items before addressing feedback and preserve their IDs, status, timestamps, screen/state, element ID, component, label, selector, and comment. Do not mark feedback resolved unless the designer asks. Add stable \`data-playground-id\` attributes to important elements and \`data-playground-screen\` to screen containers so comments survive source edits.

## Boundaries

Do not install dependencies or create \`package.json\`, \`node_modules/\`, \`packages/\`, or a nested \`workspace/\`. Do not copy Groot runtime, compiler, or application source into this folder. Preserve existing explorations; create alternatives as separate demo directories with unique IDs and \`parentId\` metadata.
`;

const productContext = `# Product context

## Product

Describe the product and its purpose.

## Users

Describe the people who use the product and their relevant needs.

## Problem / current focus

Describe the problem or opportunity being explored now.

## Important workflows

List the workflows that matter for this exploration.

## Constraints

Record product, business, technical, accessibility, or policy constraints.

## Additional context

Add terminology, decisions, research findings, or links that the coding agent should consider.
`;

const designSystem = `import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

export const tokens = {
  color: {
    canvas: '#f5f7fa',
    surface: '#ffffff',
    text: '#172033',
    muted: '#667085',
    border: '#dce1e8',
    accent: '#4f46e5',
    accentText: '#ffffff',
  },
  space: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radius: { sm: 6, md: 10, lg: 16 },
} as const;

export function Page({ children }: { children: ReactNode }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        padding: tokens.space.xl,
        background: tokens.color.canvas,
        color: tokens.color.text,
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
      }}
    >
      {children}
    </main>
  );
}

export function Stack({
  gap = tokens.space.md,
  style,
  ...props
}: HTMLAttributes<HTMLDivElement> & { gap?: number }) {
  return <div {...props} style={{ display: 'flex', flexDirection: 'column', gap, ...style }} />;
}

export function Card({ style, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      {...props}
      style={{
        padding: tokens.space.lg,
        border: \`1px solid \${tokens.color.border}\`,
        borderRadius: tokens.radius.lg,
        background: tokens.color.surface,
        color: tokens.color.text,
        ...style,
      }}
    />
  );
}

export function Button({ children, style, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        minHeight: 40,
        padding: \`0 \${tokens.space.md}px\`,
        border: 0,
        borderRadius: tokens.radius.md,
        background: tokens.color.accent,
        color: tokens.color.accentText,
        font: 'inherit',
        fontWeight: 600,
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
`;

async function existingKind(path: string) {
  try {
    return await lstat(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

export async function scaffoldWorkspace(
  targetDirectory: string,
  input: { name: string; description?: string },
) {
  if (!targetDirectory.trim()) throw new Error('Choose a workspace directory.');
  const project = projectSchema.parse(input);
  const target = resolve(targetDirectory);
  const directories = ['context', 'design-system', 'design-system/src', 'demos'];
  const files = new Map([
    ['project.json', JSON.stringify(project, null, 2) + '\n'],
    ['AGENTS.md', agents],
    ['context/PRODUCT.md', productContext],
    ['design-system/src/index.tsx', designSystem],
  ]);
  const existingFiles = new Set<string>();
  const conflicts: string[] = [];
  const targetInfo = await existingKind(target);
  if (targetInfo && (!targetInfo.isDirectory() || targetInfo.isSymbolicLink())) {
    throw new Error(
      'Workspace scaffold conflicts with existing content: . (target must be a normal directory). No files were changed.',
    );
  }
  for (const directory of directories) {
    if (conflicts.some((conflict) => directory.startsWith(conflict))) continue;
    const info = await existingKind(join(target, directory));
    if (info && (!info.isDirectory() || info.isSymbolicLink())) conflicts.push(directory + '/');
  }
  for (const [name, content] of files) {
    if (conflicts.some((conflict) => name.startsWith(conflict))) continue;
    const path = join(target, name);
    const info = await existingKind(path);
    if (!info) continue;
    if (!info.isFile() || info.isSymbolicLink() || (await readFile(path, 'utf8')) !== content)
      conflicts.push(name);
    else existingFiles.add(name);
  }
  if (conflicts.length)
    throw new Error(
      'Workspace scaffold conflicts with existing content: ' +
        conflicts.join(', ') +
        '. No files were changed.',
    );

  await mkdir(target, { recursive: true });
  for (const directory of directories) await mkdir(join(target, directory), { recursive: true });
  const created: string[] = [];
  for (const [name, content] of files) {
    if (existingFiles.has(name)) continue;
    await writeFile(join(target, name), content, { flag: 'wx' });
    created.push(name);
  }
  return { path: await realpath(target), project, created };
}
