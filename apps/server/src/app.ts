import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import { healthSchema, settingsSchema } from '@playground/shared';
import { openDatabase } from './database.js';
import { Workbench } from './workbench.js';
import { z } from 'zod';
import { userWorkspace, readProject, createProject } from './project.js';

interface AppOptions {
  dataDir: string;
  port?: number;
  development?: boolean;
  staticRoot?: string;
  workspaceRoot?: string;
}

export async function createApp(options: AppOptions) {
  const db = openDatabase(options.dataDir);
  const app = Fastify({ logger: false, bodyLimit: 16 * 1024 });
  const port = options.port ?? 4310;
  const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
  const allowedOrigins = new Set([...allowedHosts].map((host) => `http://${host}`));
  if (options.development) {
    allowedOrigins.add('http://127.0.0.1:5173');
    allowedOrigins.add('http://localhost:5173');
  }
  app.addHook('onClose', async () => db.close());
  if (options.workspaceRoot) {
    const workbench = new Workbench(options.workspaceRoot);
    await workbench.start();
    app.addHook('onClose', async () => workbench.close());
    const directory = await userWorkspace(options.workspaceRoot);
    const personal = new Workbench(directory);
    await personal.start();
    app.addHook('onClose', async () => personal.close());
    const bench = (request: { query: unknown }) =>
      (request.query as { scope?: string }).scope === 'user' ? personal : workbench;
    app.get('/api/workspace', async (_request, reply) => {
      try {
        const legacy = (await workbench.list()).demos.filter(
          (d) =>
            ![
              'emergency-booking',
              'emergency-booking-simplified',
              'emergency-booking-urgency-first',
              'patient-search',
            ].includes(d.id),
        );
        return { project: await readProject(directory), legacyCount: legacy.length };
      } catch (error) {
        return reply.code(409).send({ error: { message: (error as Error).message } });
      }
    });
    app.post('/api/workspace', async (request, reply) => {
      try {
        return await createProject(directory, request.body);
      } catch {
        return reply.code(409).send({
          error: {
            message:
              'Enter a project name (up to 100 characters) and description (up to 500). An existing project will not be overwritten.',
          },
        });
      }
    });
    app.get('/api/demos', async (request) => bench(request).list());
    app.get('/api/context', async (request) => bench(request).context());
    app.get<{ Params: { id: string } }>('/api/demos/:id/controls', async (request, reply) => {
      try {
        return await bench(request).controls(request.params.id);
      } catch {
        return reply.code(400).send({
          error: {
            message:
              'Cannot read controls.json. This exploration must declare a valid control contract.',
          },
        });
      }
    });
    app.put<{ Params: { id: string } }>('/api/demos/:id/controls', async (request, reply) => {
      const body = z
        .object({ version: z.string(), values: z.record(z.string(), z.number().finite()) })
        .strict()
        .safeParse(request.body);
      if (!body.success)
        return reply
          .code(400)
          .send({ error: { message: 'Send a controls revision and numeric values.' } });
      try {
        return await bench(request).changeControls(
          request.params.id,
          body.data.version,
          body.data.values,
        );
      } catch (error) {
        return reply.code(409).send({
          error: {
            message: error instanceof Error ? error.message : 'Controls could not be saved.',
          },
        });
      }
    });
    app.get<{ Params: { id: string } }>('/api/demos/:id/feedback', async (request, reply) => {
      try {
        return await bench(request).feedback(request.params.id);
      } catch {
        return reply.code(400).send({
          error: {
            code: 'INVALID_FEEDBACK',
            message:
              'Cannot read feedback. Check feedback/feedback.json; invalid files are never overwritten.',
          },
        });
      }
    });
    app.post<{ Params: { id: string } }>('/api/demos/:id/feedback', async (request, reply) => {
      const body = z.object({ version: z.string(), change: z.unknown() }).safeParse(request.body);
      if (!body.success)
        return reply
          .code(400)
          .send({ error: { message: 'A feedback revision and change are required.' } });
      try {
        return await bench(request).changeFeedback(
          request.params.id,
          body.data.version,
          body.data.change,
        );
      } catch (error) {
        return reply.code(409).send({
          error: {
            code: 'FEEDBACK_FAILED',
            message: error instanceof Error ? error.message : 'Feedback could not be saved.',
          },
        });
      }
    });
    app.get<{ Params: { id: string } }>('/api/demos/:id', async (request, reply) => {
      try {
        const detail = await bench(request).detail(request.params.id);
        return { meta: detail.meta, readme: detail.readme, feedback: detail.feedback };
      } catch {
        return reply.code(404).send({
          error: {
            code: 'DEMO_NOT_FOUND',
            message: 'Demo not found or invalid metadata. Check demos/<id>/meta.json.',
          },
        });
      }
    });
    app.get<{ Params: { id: string } }>('/api/demos/:id/preview', async (request, reply) => {
      try {
        return await bench(request).preview(request.params.id);
      } catch {
        return reply.code(400).send({
          error: {
            code: 'PREVIEW_ERROR',
            message: 'Cannot load this demo. Check src/App.tsx and meta.json.',
          },
        });
      }
    });
    app.get<{ Params: { id: string } }>('/api/demos/:id/frame', async (request, reply) => {
      try {
        const result = await bench(request).preview(request.params.id);
        if (!result.html) return reply.code(422).type('text/plain').send(result.error);
        const nonce = /<script nonce="([a-z0-9]+)">/.exec(result.html)?.[1];
        reply.removeHeader('X-Frame-Options');
        reply.header(
          'Content-Security-Policy',
          `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; frame-src 'none'; form-action 'none'; base-uri 'none'; sandbox allow-scripts; frame-ancestors ${[...allowedOrigins].join(' ')}`,
        );
        return reply.type('text/html').send(result.html);
      } catch {
        return reply
          .code(400)
          .type('text/plain')
          .send('Preview is unavailable. Check the source and metadata.');
      }
    });
    app.post<{ Params: { id: string } }>('/api/demos/:id/fork', async (request, reply) => {
      const parsed = z
        .object({
          title: z.string().trim().min(1).max(100),
          description: z.string().max(500).optional(),
          rationale: z.string().max(2000).optional(),
        })
        .strict()
        .safeParse(request.body);
      if (!parsed.success)
        return reply.code(400).send({
          error: {
            code: 'INVALID_TITLE',
            message: 'Enter an alternative title (1–100 characters).',
          },
        });
      try {
        return {
          id: await bench(request).fork(
            request.params.id,
            parsed.data.title,
            parsed.data.description,
            parsed.data.rationale,
          ),
        };
      } catch (error) {
        return reply.code(400).send({
          error: {
            code: 'FORK_FAILED',
            message: error instanceof Error ? error.message : 'Could not create alternative.',
          },
        });
      }
    });
  }
  app.addHook('onRequest', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'no-referrer');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Cache-Control', 'no-store');
    reply.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    );
    if (!allowedHosts.has(request.headers.host ?? '')) {
      return reply
        .code(403)
        .send({ error: { code: 'UNTRUSTED_HOST', message: 'Use the local Playground address.' } });
    }
    const origin = request.headers.origin;
    if (
      (origin !== undefined && !allowedOrigins.has(origin)) ||
      request.headers['sec-fetch-site'] === 'cross-site'
    ) {
      return reply.code(403).send({
        error: { code: 'UNTRUSTED_ORIGIN', message: 'This request must come from Playground.' },
      });
    }
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      if (!origin || !allowedOrigins.has(origin)) {
        return reply.code(403).send({
          error: { code: 'ORIGIN_REQUIRED', message: 'A local Playground origin is required.' },
        });
      }
      if (request.headers['content-type']?.split(';')[0]?.trim() !== 'application/json') {
        return reply
          .code(415)
          .send({ error: { code: 'JSON_REQUIRED', message: 'Send application/json.' } });
      }
    }
  });
  app.setErrorHandler((error, _request, reply) => {
    const code =
      error && typeof error === 'object' && 'statusCode' in error ? error.statusCode : undefined;
    const status = typeof code === 'number' && code >= 400 && code < 500 ? code : 500;
    reply.code(status).send({
      error: {
        code: status === 500 ? 'INTERNAL_ERROR' : 'INVALID_REQUEST',
        message:
          status === 500
            ? 'Local storage could not complete the request. Check disk space and restart Playground.'
            : 'The request could not be read. Check its format and size.',
      },
    });
  });
  app.get('/api/health', async () =>
    healthSchema.parse({
      status: 'ok',
      version: '0.0.1',
      phase: 'workbench',
      database: { status: 'ready', schemaVersion: db.health() },
      ai: 'external-agent',
    }),
  );
  app.get('/api/settings', async () => db.getSettings());
  app.put('/api/settings', async (request, reply) => {
    const parsed = settingsSchema.safeParse(request.body);
    if (!parsed.success)
      return reply.code(400).send({
        error: {
          code: 'INVALID_SETTINGS',
          message: 'Choose neutral, sage, or blue. Unknown settings are not accepted.',
        },
      });
    return db.setSettings(parsed.data);
  });
  try {
    if (options.staticRoot)
      await app.register(fastifyStatic, { root: options.staticRoot, index: ['index.html'] });
    app.setNotFoundHandler((_request, reply) =>
      reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'This route does not exist.' } }),
    );
    await app.ready();
    return app;
  } catch (error) {
    await app.close();
    throw error;
  }
}
