import { homedir } from 'node:os';
import { isAbsolute, join } from 'node:path';
import { z } from 'zod';

export function defaultDataDir(env = process.env, platform = process.platform): string {
  if (platform === 'win32')
    return join(env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local'), 'Playground');
  if (platform === 'darwin') return join(homedir(), 'Library', 'Application Support', 'Playground');
  return join(env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share'), 'playground');
}

export function readConfig(env = process.env) {
  const port = z.coerce
    .number()
    .int()
    .min(1024)
    .max(65535)
    .parse(env.PLAYGROUND_PORT ?? 4310);
  const dataDir = env.PLAYGROUND_DATA_DIR || defaultDataDir(env);
  if (!isAbsolute(dataDir)) throw new Error('PLAYGROUND_DATA_DIR must be an absolute path.');
  return { port, dataDir, production: env.NODE_ENV === 'production' };
}
