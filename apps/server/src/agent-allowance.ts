import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { tmpdir } from 'node:os';
import { z } from 'zod';

const windowSchema = z.object({
  usedPercent: z.number().min(0).max(100),
  windowDurationMins: z.number().int().positive(),
  resetsAt: z.number().nonnegative().nullable().optional(),
});
const bucketSchema = z.object({
  primary: windowSchema.nullable().optional(),
  secondary: windowSchema.nullable().optional(),
});

export function allowanceWindows(result: unknown) {
  const response = z
    .object({
      rateLimits: bucketSchema.nullable().optional(),
      rateLimitsByLimitId: z.record(z.string(), bucketSchema).nullable().optional(),
    })
    .parse(result);
  const bucket = response.rateLimitsByLimitId?.codex ?? response.rateLimits;
  return [bucket?.primary, bucket?.secondary]
    .filter((value) => value != null)
    .map((value) => ({
      remainingPercent: Math.round((100 - value.usedPercent) * 10) / 10,
      windowMinutes: value.windowDurationMins,
      resetsAt: value.resetsAt ?? null,
    }));
}

// Fixed, read-only RPCs. No threads, turns, tools, credentials or project files are read by Groot.
export function readCodexAllowance(executable = process.env.GROOT_CODEX_EXECUTABLE || 'codex') {
  return new Promise<{ windows: ReturnType<typeof allowanceWindows>; checkedAt: string }>(
    (resolve, reject) => {
      const child = spawn(executable, ['app-server', '--listen', 'stdio://'], {
        cwd: tmpdir(),
        windowsHide: true,
        shell: false,
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const lines = createInterface({ input: child.stdout });
      let finished = false;
      let bytes = 0;
      const timer = setTimeout(
        () =>
          finish(new Error('Codex did not respond. Check that your local Codex CLI is signed in.')),
        12000,
      );
      function finish(error?: Error, windows?: ReturnType<typeof allowanceWindows>) {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        lines.close();
        child.stdin.destroy();
        child.kill();
        if (error) reject(error);
        else resolve({ windows: windows!, checkedAt: new Date().toISOString() });
      }
      function send(message: object) {
        child.stdin.write(JSON.stringify(message) + '\n');
      }
      child.on('error', () =>
        finish(new Error('Codex CLI is unavailable. Install it and sign in locally, then retry.')),
      );
      child.on('exit', () =>
        finish(new Error('Codex closed before returning allowance information.')),
      );
      child.stdin.on('error', () =>
        finish(new Error('Could not communicate with the local Codex CLI.')),
      );
      child.stdout.on('data', (chunk: Buffer) => {
        bytes += chunk.length;
        if (bytes > 1024 * 1024)
          finish(new Error('Codex returned an unexpectedly large response.'));
      });
      lines.on('line', (line) => {
        if (finished) return;
        try {
          const message = JSON.parse(line);
          if (message.id === 1) {
            if (message.error)
              return finish(new Error('This Codex CLI could not initialize. Update it and retry.'));
            send({ method: 'initialized' });
            send({ id: 2, method: 'account/rateLimits/read' });
          } else if (message.id === 2) {
            if (message.error)
              return finish(
                new Error(
                  'Allowance is unavailable. Sign in to Codex with your ChatGPT account and retry.',
                ),
              );
            const windows = allowanceWindows(message.result);
            if (!windows.length)
              return finish(
                new Error('Codex did not report any allowance windows for this account.'),
              );
            finish(undefined, windows);
          }
        } catch {
          finish(new Error('This Codex CLI returned an unsupported allowance response.'));
        }
      });
      send({
        id: 1,
        method: 'initialize',
        params: {
          clientInfo: { name: 'groot_allowance', title: 'Groot allowance', version: '1.0.0' },
        },
      });
    },
  );
}

export function createAllowanceReader() {
  let cached: Awaited<ReturnType<typeof readCodexAllowance>> | undefined;
  let pending: ReturnType<typeof readCodexAllowance> | undefined;
  return async () => {
    if (cached && Date.now() - Date.parse(cached.checkedAt) < 60000) return cached;
    pending ??= readCodexAllowance()
      .then((value) => (cached = value))
      .finally(() => {
        pending = undefined;
      });
    return pending;
  };
}
