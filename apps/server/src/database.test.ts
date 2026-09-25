import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { expect, it } from 'vitest';
import { openDatabase } from './database.js';
import { readConfig } from './config.js';

it('refuses a newer database without modifying its migration history', () => {
  const dir = mkdtempSync(join(tmpdir(), 'playground-migrations-'));
  try {
    openDatabase(dir).close();
    const future = new DatabaseSync(join(dir, 'playground.sqlite'));
    future.exec("INSERT INTO schema_migrations VALUES (99, 'future', '2026-09-23')");
    future.close();
    expect(() => openDatabase(dir)).toThrow('Unsupported database schema');
    const check = new DatabaseSync(join(dir, 'playground.sqlite'));
    expect(check.prepare('SELECT COUNT(*) AS total FROM schema_migrations').get()?.total).toBe(2);
    check.close();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

it('validates server config and forbids relative data locations', () => {
  expect(() => readConfig({ PLAYGROUND_PORT: 'not-a-port' })).toThrow();
  expect(() => readConfig({ PLAYGROUND_DATA_DIR: '../other' })).toThrow('absolute path');
  expect(readConfig({ PLAYGROUND_DATA_DIR: tmpdir(), PLAYGROUND_PORT: '4321' }).port).toBe(4321);
});
