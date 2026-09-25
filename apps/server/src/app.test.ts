import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app.js';

describe('local application API', () => {
  let dataDir: string;
  let app: Awaited<ReturnType<typeof createApp>>;
  const headers = { host: '127.0.0.1:4310', origin: 'http://127.0.0.1:4310' };
  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'playground-api-'));
    app = await createApp({ dataDir });
  });
  afterEach(async () => {
    await app.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it('reports a live migrated database without paths or credentials', async () => {
    const response = await app.inject({ url: '/api/health', headers });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
      database: { status: 'ready', schemaVersion: 1 },
      ai: 'external-agent',
    });
    expect(response.body).not.toContain(dataDir);
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['content-security-policy']).toContain("frame-ancestors 'none'");
  });
  it('persists settings across application restart and reapplies migrations safely', async () => {
    const put = await app.inject({
      method: 'PUT',
      url: '/api/settings',
      headers,
      payload: { accent: 'sage' },
    });
    expect(put.statusCode).toBe(200);
    await app.close();
    app = await createApp({ dataDir });
    const response = await app.inject({ url: '/api/settings', headers });
    expect(response.json()).toEqual({ accent: 'sage' });
  });
  it.each([{ accent: 'unknown' }, { accent: 'blue', apiKey: 'must-not-be-stored' }, {}, null])(
    'rejects invalid or unexpected settings: %j',
    async (payload) => {
      const result = await app.inject({
        method: 'PUT',
        url: '/api/settings',
        headers: { ...headers, 'content-type': 'application/json' },
        payload: JSON.stringify(payload),
      });
      expect(result.statusCode).toBe(400);
      expect(result.body).not.toContain('must-not-be-stored');
      expect((await app.inject({ url: '/api/settings', headers })).json()).toEqual({
        accent: 'neutral',
      });
    },
  );
  it.each(['http://evil.example', 'null', 'http://127.0.0.1:4312', 'http://localhost:5173'])(
    'rejects foreign browser origins: %s',
    async (origin) => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/settings',
        headers: { ...headers, origin },
        payload: { accent: 'blue' },
      });
      expect(response.statusCode).toBe(403);
    },
  );
  it('requires origin for mutations and rejects DNS rebinding hosts', async () => {
    expect(
      (
        await app.inject({
          method: 'PUT',
          url: '/api/settings',
          headers: { host: headers.host },
          payload: { accent: 'blue' },
        })
      ).statusCode,
    ).toBe(403);
    expect(
      (await app.inject({ url: '/api/health', headers: { host: 'evil.example:4310' } })).statusCode,
    ).toBe(403);
    expect(
      (
        await app.inject({
          url: '/api/health',
          headers: { ...headers, 'sec-fetch-site': 'cross-site' },
        })
      ).statusCode,
    ).toBe(403);
  });
  it('rejects form submissions, oversized payloads and malformed JSON', async () => {
    expect(
      (
        await app.inject({
          method: 'PUT',
          url: '/api/settings',
          headers: { ...headers, 'content-type': 'text/plain' },
          payload: 'accent=blue',
        })
      ).statusCode,
    ).toBe(415);
    expect(
      (
        await app.inject({
          method: 'PUT',
          url: '/api/settings',
          headers,
          payload: { accent: 'x'.repeat(20000) },
        })
      ).statusCode,
    ).toBe(413);
    expect(
      (
        await app.inject({
          method: 'PUT',
          url: '/api/settings',
          headers: { ...headers, 'content-type': 'application/json' },
          payload: '{broken',
        })
      ).statusCode,
    ).toBe(400);
  });
  it('does not expose planned project routes or data files', async () => {
    for (const url of ['/api/projects', '/playground.sqlite', '/.env']) {
      expect((await app.inject({ url, headers })).statusCode).toBe(404);
    }
  });
  it('allows the exact development origin only in development', async () => {
    await app.close();
    app = await createApp({ dataDir, development: true });
    expect(
      (
        await app.inject({
          method: 'PUT',
          url: '/api/settings',
          headers: { ...headers, origin: 'http://127.0.0.1:5173' },
          payload: { accent: 'blue' },
        })
      ).statusCode,
    ).toBe(200);
  });
});
