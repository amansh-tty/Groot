import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { settingsSchema, type Settings } from '@playground/shared';
import { migrations } from './migrations.js';

export function openDatabase(dataDir: string) {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(join(dataDir, 'playground.sqlite'));
  try {
    db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL
      ) STRICT;`);
      const rows = db.prepare('SELECT version FROM schema_migrations ORDER BY version').all();
      // Refuse databases from a future release or noncontiguous migration history.
      if (rows.some((row, index) => row.version !== migrations[index]?.version)) {
        throw new Error('Unsupported database schema. Use the Playground version that created it.');
      }
      for (const migration of migrations.slice(rows.length)) {
        db.exec(migration.sql);
        db.prepare('INSERT INTO schema_migrations VALUES (?, ?, ?)').run(
          migration.version,
          migration.name,
          new Date().toISOString(),
        );
      }
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    db.close();
    throw error;
  }

  return {
    health() {
      db.prepare('SELECT 1').get();
      return migrations.length;
    },
    getSettings(): Settings {
      return settingsSchema.parse(db.prepare('SELECT accent FROM app_settings WHERE id = 1').get());
    },
    setSettings(input: Settings): Settings {
      const settings = settingsSchema.parse(input);
      db.prepare('UPDATE app_settings SET accent = ?, updated_at = ? WHERE id = 1').run(
        settings.accent,
        new Date().toISOString(),
      );
      return this.getSettings();
    },
    close() {
      db.close();
    },
  };
}
