import { watch, type FSWatcher } from 'node:fs';
import {
  cp,
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  rename,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { join, relative, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import {
  demoMetaSchema,
  designerSchema,
  feedbackSchema,
  feedbackActionSchema,
  controlsSchema,
  type Feedback,
} from '@playground/shared';
import { createHash } from 'node:crypto';
import { compilePrototype } from './prototype-compiler.js';

export class Workbench {
  revision = Date.now();
  private watchers: FSWatcher[] = [];
  private cache = new Map<
    string,
    { revision: number; html: string; fingerprint: string; frameRevision: number }
  >();
  private root = '';
  private writes: Promise<unknown> = Promise.resolve();
  private hash(value: string) {
    return createHash('sha256').update(value).digest('hex');
  }
  constructor(
    readonly directory: string,
    readonly workspaceLayout: 'legacy' | 'external' = 'legacy',
  ) {}
  async start() {
    this.root = await realpath(this.directory);
    const designSystemFolder =
      this.workspaceLayout === 'external' ? 'design-system' : 'packages/design-system';
    for (const folder of ['demos', 'context', 'data', designSystemFolder, '.console']) {
      const path = join(this.root, folder);
      let parent = this.root;
      for (const segment of folder.split('/')) {
        parent = join(parent, segment);
        await mkdir(parent, { recursive: true });
        await this.safe(parent);
      }
      await this.safe(path);
      const watcher = watch(path, { recursive: true }, (_event, name) => {
        if (
          name &&
          !String(name).includes('node_modules') &&
          !String(name)
            .split(/[\\/]/)
            .some((part) => part.startsWith('.'))
        )
          this.revision++;
      });
      watcher.on('error', () => {
        this.revision++;
      });
      this.watchers.push(watcher);
    }
  }
  close() {
    this.watchers.forEach((watcher) => watcher.close());
  }
  private async safe(path: string) {
    const actual = await realpath(path);
    const rel = relative(this.root, actual);
    if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Path is outside the workspace.');
    return actual;
  }
  private async text(path: string) {
    const safe = await this.safe(path);
    if ((await stat(safe)).size > 512_000) throw new Error('File is too large (maximum 512 KB).');
    return readFile(safe, 'utf8');
  }
  async designer() {
    try {
      return designerSchema.parse(
        JSON.parse(await this.text(join(this.root, '.console/config.json'))),
      );
    } catch {
      return { name: 'Local designer', slug: 'local-designer' };
    }
  }
  async list() {
    const demos = [];
    const warnings: string[] = [];
    for (const dir of await readdir(join(this.root, 'demos'), { withFileTypes: true })) {
      if (!dir.isDirectory() || !/^[a-z0-9][a-z0-9-]*$/.test(dir.name)) continue;
      try {
        const path = join(this.root, 'demos', dir.name);
        const meta = demoMetaSchema.parse(JSON.parse(await this.text(join(path, 'meta.json'))));
        if (meta.id !== dir.name) throw new Error('ID must match its folder name.');
        const files = await this.files(path);
        const modified = Math.max(
          ...(await Promise.all(files.map(async (f) => (await stat(f)).mtimeMs))),
        );
        demos.push({ ...meta, modified: new Date(modified).toISOString() });
      } catch (error) {
        warnings.push(dir.name + ': ' + (error instanceof Error ? error.message : 'Invalid demo.'));
      }
    }
    return { demos, warnings, revision: this.revision, designer: await this.designer() };
  }
  private async files(directory: string): Promise<string[]> {
    await this.safe(directory);
    const result: string[] = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const path = join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Demo folders cannot contain symbolic links.');
      if (entry.isDirectory()) result.push(...(await this.files(path)));
      else if (entry.isFile()) result.push(path);
      if (result.length > 200) throw new Error('Demo has too many files (maximum 200).');
    }
    return result;
  }
  async detail(id: string) {
    if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(id)) throw new Error('Invalid demo ID.');
    const path = join(this.root, 'demos', id);
    const meta = demoMetaSchema.parse(JSON.parse(await this.text(join(path, 'meta.json'))));
    if (meta.id !== id) throw new Error('ID must match its folder name.');
    let readme = '';
    let feedback: ReturnType<typeof feedbackSchema.parse> = [];
    try {
      readme = await this.text(join(path, 'README.md'));
    } catch {
      /* optional */
    }
    try {
      feedback = feedbackSchema.parse(
        JSON.parse(await this.text(join(path, 'feedback/feedback.json'))),
      );
    } catch {
      /* optional */
    }
    return { meta, readme, feedback, path };
  }
  async context() {
    const result = [];
    for (const name of [
      'PRODUCT',
      'USERS',
      'PRINCIPLES',
      'CONSTRAINTS',
      'TERMINOLOGY',
      'DECISIONS',
    ]) {
      try {
        result.push({ name, content: await this.text(join(this.root, 'context', name + '.md')) });
      } catch {
        /* optional context */
      }
    }
    return result;
  }
  async feedback(id: string) {
    const { path } = await this.detail(id);
    let raw = '[]\n';
    try {
      raw = await this.text(join(path, 'feedback/feedback.json'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    // Malformed external edits must never be silently replaced with an empty list.
    return { items: feedbackSchema.parse(JSON.parse(raw)), version: this.hash(raw) };
  }
  async changeFeedback(id: string, version: string, input: unknown) {
    const action = feedbackActionSchema.parse(input);
    const operation = this.writes
      .catch(() => undefined)
      .then(async () => {
        const current = await this.feedback(id);
        if (current.version !== version)
          throw new Error('Feedback changed externally. Reload feedback, then retry your change.');
        let items = current.items;
        if (action.action === 'create') {
          items.push({
            ...action.target,
            id: randomUUID(),
            prototype: id,
            comment: action.comment,
            status: 'open',
            createdAt: new Date().toISOString(),
            resolvedAt: null,
          });
        } else {
          const item = items.find((f) => f.id === action.id);
          if (!item) throw new Error('Feedback no longer exists. Reload feedback.');
          if (action.action === 'delete') items = items.filter((f) => f.id !== action.id);
          else if (action.action === 'edit') item.comment = action.comment;
          else {
            item.status = action.status;
            item.resolvedAt = action.status === 'resolved' ? new Date().toISOString() : null;
          }
        }
        await this.writeFeedback(id, feedbackSchema.parse(items));
        return this.feedback(id);
      });
    this.writes = operation;
    return operation;
  }
  private async writeFeedback(id: string, items: Feedback[]) {
    const contents = JSON.stringify(items, null, 2) + '\n';
    if (Buffer.byteLength(contents) > 512_000)
      throw new Error(
        'Feedback exceeds the 512 KB file limit. Archive older comments before adding more.',
      );
    const { path } = await this.detail(id);
    if ((await lstat(path)).isSymbolicLink())
      throw new Error('Demo directory cannot be a symbolic link.');
    const directory = join(path, 'feedback');
    await mkdir(directory, { recursive: true });
    if ((await lstat(directory)).isSymbolicLink())
      throw new Error('Feedback directory cannot be a symbolic link.');
    await this.safe(directory);
    const target = join(directory, 'feedback.json');
    try {
      if ((await lstat(target)).isSymbolicLink())
        throw new Error('Feedback file cannot be a symbolic link.');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    const temporary = join(directory, '.feedback-' + randomUUID() + '.tmp');
    try {
      await writeFile(temporary, contents, { flag: 'wx' });
      await rename(temporary, target);
    } finally {
      await rm(temporary, { force: true });
    }
    this.revision++;
  }
  async controls(id: string) {
    const { path } = await this.detail(id);
    const raw = await this.text(join(path, 'controls.json'));
    return { document: controlsSchema.parse(JSON.parse(raw)), version: this.hash(raw) };
  }
  async changeControls(id: string, version: string, values: Record<string, number>) {
    const operation = this.writes
      .catch(() => undefined)
      .then(async () => {
        const current = await this.controls(id);
        if (current.version !== version)
          throw new Error('Controls changed externally. Reload controls before saving.');
        if (Object.keys(values).some((key) => !current.document.controls.some((c) => c.id === key)))
          throw new Error('Only declared controls can be changed.');
        const document = controlsSchema.parse({
          ...current.document,
          controls: current.document.controls.map((c) => ({
            ...c,
            value: values[c.id] ?? c.value,
          })),
        });
        const { path } = await this.detail(id);
        if ((await lstat(path)).isSymbolicLink())
          throw new Error('Demo directory cannot be a symbolic link.');
        const target = join(path, 'controls.json');
        if ((await lstat(target)).isSymbolicLink())
          throw new Error('Controls cannot be a symbolic link.');
        await this.safe(target);
        const temporary = join(path, '.controls-' + randomUUID() + '.tmp');
        try {
          await writeFile(temporary, JSON.stringify(document, null, 2) + '\n', { flag: 'wx' });
          await rename(temporary, target);
        } finally {
          await rm(temporary, { force: true });
        }
        this.revision++;
        return this.controls(id);
      });
    this.writes = operation;
    return operation;
  }
  async fork(id: string, title: string, description?: string, rationale = '') {
    const { meta, path } = await this.detail(id);
    const files = await this.files(path);
    if (files.some((f) => !/\.(tsx?|jsx?|json|md|css|svg|png|jpe?g|webp)$/i.test(f)))
      throw new Error('Demo contains unsupported files. Copy it manually after reviewing them.');
    const total = (await Promise.all(files.map(async (f) => (await lstat(f)).size))).reduce(
      (a, b) => a + b,
      0,
    );
    if (total > 5_000_000) throw new Error('Demo exceeds the 5 MB alternative limit.');
    const newId = id.slice(0, 50) + '-alt-' + randomUUID().slice(0, 8);
    const staging = join(this.root, 'demos', '.draft-' + newId);
    const target = join(this.root, 'demos', newId);
    try {
      await cp(path, staging, {
        recursive: true,
        filter: (source) =>
          !relative(path, source)
            .split(/[\\/]/)
            .some((s) => s.startsWith('.') || s === 'node_modules'),
      });
      const designer = await this.designer();
      await writeFile(
        join(staging, 'meta.json'),
        JSON.stringify(
          {
            ...meta,
            id: newId,
            title,
            description: description ?? meta.description,
            rationale,
            parentId: id,
            author: designer.name,
            authorSlug: designer.slug,
          },
          null,
          2,
        ) + '\n',
      );
      // Feedback belongs to the original exploration, not a copied alternative.
      await mkdir(join(staging, 'feedback'), { recursive: true });
      await writeFile(join(staging, 'feedback/feedback.json'), '[]\n');
      await rename(staging, target);
      this.revision++;
      return newId;
    } catch (error) {
      await rm(staging, { recursive: true, force: true });
      throw error;
    }
  }
  async preview(id: string) {
    const detail = await this.detail(id);
    const revision = this.revision;
    const cached = this.cache.get(id);
    if (cached?.revision === revision) return { html: cached.html, revision: cached.frameRevision };
    try {
      const { html, fingerprint } = await compilePrototype(this.root, detail.path);
      if (cached?.fingerprint === fingerprint) {
        cached.revision = revision;
        return { html: cached.html, revision: cached.frameRevision };
      }
      this.cache.set(id, { revision, html, fingerprint, frameRevision: revision });
      return { html, revision };
    } catch (error) {
      const failure = error as {
        errors?: { text: string; location?: { file: string; line: number } }[];
      };
      return {
        revision,
        error:
          failure.errors
            ?.map((e) => (e.location ? e.location.file + ':' + e.location.line + ' ' : '') + e.text)
            .join('\n') ?? 'Preview could not compile. Check the demo source.',
      };
    }
  }
}
