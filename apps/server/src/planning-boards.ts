import {
  lstat,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
const id = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/);
export const boardSchema = z
  .object({
    id,
    title: z.string().trim().min(1).max(100),
    nodes: z
      .array(
        z
          .object({
            id,
            x: z.number().min(0).max(3740),
            y: z.number().min(0).max(2840),
            text: z.string().max(2000),
          })
          .strict(),
      )
      .max(60),
    edges: z.array(z.object({ id, from: id, to: id }).strict()).max(120),
  })
  .strict()
  .superRefine((board, ctx) => {
    const nodes = new Set(board.nodes.map((node) => node.id));
    if (
      nodes.size !== board.nodes.length ||
      new Set(board.edges.map((edge) => edge.id)).size !== board.edges.length ||
      board.edges.some(
        (edge) => edge.from === edge.to || !nodes.has(edge.from) || !nodes.has(edge.to),
      )
    )
      ctx.addIssue({
        code: 'custom',
        message: 'Use unique cards and connections between existing, different cards.',
      });
  });
const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === 'ENOENT';
const hash = (content: string) => createHash('sha256').update(content).digest('hex');
const writes = new Map<string, Promise<unknown>>();
export class PlanningBoards {
  constructor(readonly directory: string) {}
  private async folder(create = false) {
    const root = await realpath(this.directory);
    const path = join(root, 'boards');
    if (create) await mkdir(path, { recursive: true });
    try {
      const info = await lstat(path);
      if (!info.isDirectory() || info.isSymbolicLink() || (await realpath(path)) !== path)
        throw new Error('Boards must use a normal project directory.');
    } catch (error) {
      if (!missing(error) || create) throw error;
    }
    return path;
  }
  async read(boardId: string) {
    id.parse(boardId);
    const folder = await this.folder();
    const path = join(folder, boardId + '.json');
    const info = await lstat(path);
    if (!info.isFile() || info.isSymbolicLink() || info.size > 128000)
      throw new Error('Expected an ordinary board file under 128 KB.');
    const content = await readFile(path, 'utf8');
    const board = boardSchema.parse(JSON.parse(content));
    if (board.id !== boardId) throw new Error('Board ID must match its filename.');
    return { board, version: hash(content) };
  }
  async list() {
    const folder = await this.folder();
    const boards: { id: string; title: string; cards: number; modified: string }[] = [];
    const warnings: string[] = [];
    let entries;
    try {
      entries = await readdir(folder);
    } catch (error) {
      if (missing(error)) return { boards, warnings };
      throw error;
    }
    if (entries.length > 100) throw new Error('The project supports up to 100 boards.');
    for (const file of entries) {
      if (!/^[a-z0-9][a-z0-9-]{0,79}\.json$/.test(file)) continue;
      try {
        const { board } = await this.read(file.slice(0, -5));
        boards.push({
          id: board.id,
          title: board.title,
          cards: board.nodes.length,
          modified: (await lstat(join(folder, file))).mtime.toISOString(),
        });
      } catch {
        warnings.push('Cannot open ' + file + '. Its content was preserved.');
      }
    }
    return { boards, warnings };
  }
  async create(input: unknown) {
    const { title } = z
      .object({ title: z.string().trim().min(1).max(100) })
      .strict()
      .parse(input);
    const folder = await this.folder(true);
    if ((await readdir(folder)).length >= 100)
      throw new Error('The project supports up to 100 boards.');
    const board = { id: 'board-' + randomUUID().slice(0, 8), title, nodes: [], edges: [] };
    await writeFile(join(folder, board.id + '.json'), JSON.stringify(board, null, 2) + '\n', {
      flag: 'wx',
    });
    return board;
  }
  async save(boardId: string, input: unknown) {
    const data = z
      .object({ board: boardSchema, version: z.string().regex(/^[a-f0-9]{64}$/) })
      .strict()
      .parse(input);
    if (data.board.id !== boardId) throw new Error('Board ID must not change.');
    const folder = await this.folder();
    const key = join(folder, boardId + '.json');
    const pending = (writes.get(key) ?? Promise.resolve())
      .catch(() => {})
      .then(async () => {
        if ((await this.read(boardId)).version !== data.version)
          throw new Error(
            'This board changed outside Groot. Your draft is preserved. Reload the saved board before editing again.',
          );
        const content = JSON.stringify(data.board, null, 2) + '\n';
        if (Buffer.byteLength(content) > 128000)
          throw new Error('Board exceeds 128 KB. Shorten its content.');
        const temporary = join(folder, '.board-' + randomUUID() + '.tmp');
        await writeFile(temporary, content, { flag: 'wx' });
        try {
          if ((await this.read(boardId)).version !== data.version)
            throw new Error('This board changed outside Groot. Your draft is preserved.');
          await rename(temporary, key);
        } finally {
          await unlink(temporary).catch(() => {});
        }
        return { board: data.board, version: hash(content) };
      });
    writes.set(key, pending);
    try {
      return await pending;
    } finally {
      if (writes.get(key) === pending) writes.delete(key);
    }
  }
}
