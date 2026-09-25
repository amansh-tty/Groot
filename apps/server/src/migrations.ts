// Append migrations. Never change an already released migration.
export const migrations = [
  {
    version: 1,
    name: 'application_settings',
    sql: `CREATE TABLE app_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      accent TEXT NOT NULL CHECK (accent IN ('neutral', 'sage', 'blue')),
      updated_at TEXT NOT NULL
    ) STRICT;
    INSERT INTO app_settings (id, accent, updated_at)
    VALUES (1, 'neutral', strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));`,
  },
] as const;
