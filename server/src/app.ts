import express, { type ErrorRequestHandler, type Request } from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { getClients } from './data/index.js';
import type { ErrorResponse } from './types.js';

export interface AppOptions {
  /**
   * Honour `?delay=<ms>` and `?fail=1` on API requests so the UI's loading and
   * error states can be exercised by hand. Off in production.
   */
  allowSimulation?: boolean;
  /** Directory with the built web app to serve alongside the API. */
  staticDir?: string;
}

const MAX_SIMULATED_DELAY_MS = 10_000;

function sendError(res: express.Response, status: number, code: string, message: string) {
  const body: ErrorResponse = { error: { code, message } };
  res.status(status).json(body);
}

async function simulate(req: Request): Promise<'fail' | undefined> {
  const delay = Math.min(Number(req.query.delay) || 0, MAX_SIMULATED_DELAY_MS);
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  return req.query.fail === '1' ? 'fail' : undefined;
}

export function createApp({ allowSimulation = false, staticDir }: AppOptions = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors());

  const api = express.Router();

  api.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  api.get('/clients', async (req, res) => {
    if (allowSimulation && (await simulate(req)) === 'fail') {
      sendError(res, 500, 'SIMULATED_FAILURE', 'Simulated server error');
      return;
    }
    res.set('Cache-Control', 'no-store').json(getClients());
  });

  api.use((_req, res) => sendError(res, 404, 'NOT_FOUND', 'Route not found'));

  app.use('/api', api);

  if (staticDir && existsSync(staticDir)) {
    app.use(express.static(staticDir));
    // SPA fallback for any non-API GET.
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile('index.html', { root: staticDir }));
  }

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);
    sendError(res, 500, 'INTERNAL', 'Unexpected server error');
  };
  app.use(onError);

  return app;
}
