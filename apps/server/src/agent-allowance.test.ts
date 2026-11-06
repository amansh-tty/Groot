import { describe, expect, it, vi, afterEach } from 'vitest';
import { PassThrough } from 'node:stream';
import { EventEmitter } from 'node:events';
vi.mock('node:child_process', () => ({ spawn: vi.fn() }));
import { spawn } from 'node:child_process';
import { allowanceWindows, readCodexAllowance, createAllowanceReader } from './agent-allowance.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.useRealTimers();
});
function transport(respond = true) {
  const child = Object.assign(new EventEmitter(), {
    stdin: new PassThrough(),
    stdout: new PassThrough(),
    kill: vi.fn(),
  });
  const sent: { id?: number; method: string }[] = [];
  child.stdin.on('data', (chunk) => {
    const message = JSON.parse(String(chunk));
    sent.push(message);
    if (!respond) return;
    queueMicrotask(() => {
      if (message.id === 1) child.stdout.write(JSON.stringify({ id: 1, result: {} }) + '\n');
      if (message.id === 2)
        child.stdout.write(
          JSON.stringify({
            id: 2,
            result: {
              rateLimits: {
                primary: { usedPercent: 24, windowDurationMins: 300, resetsAt: 1800000000 },
                secondary: { usedPercent: 66, windowDurationMins: 10080, resetsAt: 1800003600 },
              },
              account: 'never-return-this',
            },
          }) + '\n',
        );
    });
  });
  vi.mocked(spawn).mockReturnValue(child as unknown as ReturnType<typeof spawn>);
  return { child, sent };
}
describe('local allowance', () => {
  it('uses only initialization and read-only limits RPC, removes account data and stops the child', async () => {
    const { child, sent } = transport();
    const result = await readCodexAllowance();
    expect(sent.map((message) => message.method)).toEqual([
      'initialize',
      'initialized',
      'account/rateLimits/read',
    ]);
    expect(result.windows.map((window) => window.remainingPercent)).toEqual([76, 34]);
    expect(JSON.stringify(result)).not.toContain('never-return-this');
    expect(child.kill).toHaveBeenCalledOnce();
    expect(vi.mocked(spawn).mock.calls[0]?.[2]).toMatchObject({ shell: false, windowsHide: true });
  });
  it('shares concurrent reads and caches the same checked timestamp for one minute', async () => {
    transport();
    const read = createAllowanceReader();
    const [first, second] = await Promise.all([read(), read()]);
    expect(first).toEqual(second);
    expect(await read()).toEqual(first);
    expect(spawn).toHaveBeenCalledOnce();
  });
  it('times out, closes the process, and returns a useful error', async () => {
    vi.useFakeTimers();
    const { child } = transport(false);
    const result = expect(readCodexAllowance()).rejects.toThrow('did not respond');
    await vi.advanceTimersByTimeAsync(12000);
    await result;
    expect(child.kill).toHaveBeenCalledOnce();
  });
  it('prefers the Codex bucket and rejects invalid percentages without inventing a window', () => {
    expect(
      allowanceWindows({
        rateLimitsByLimitId: { codex: { primary: { usedPercent: 100, windowDurationMins: 300 } } },
      }),
    ).toEqual([{ remainingPercent: 0, windowMinutes: 300, resetsAt: null }]);
    expect(allowanceWindows({ rateLimits: null })).toEqual([]);
    expect(() =>
      allowanceWindows({ rateLimits: { primary: { usedPercent: -1, windowDurationMins: 300 } } }),
    ).toThrow();
  });
});
