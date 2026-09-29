import express, { type ErrorRequestHandler } from 'express';
import cors from 'cors';
import type session from 'express-session';
import { createOidcSession } from './middlewares/oidc-session';
import { serializeSession } from './auth/session-lock';
import type { AuthUsers } from './auth/users';
import { AuthError } from './auth/errors';
import { createOidcRoutes } from './rotas/oidc.routes';
import { createUsuarioRoutes } from './rotas/usuario.routes';

export function createApp(store: session.Store, users: AuthUsers) {

  const app = express();

  app.disable('x-powered-by');

  if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

  app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:5173', credentials: true,
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'], methods: ['GET', 'POST', 'OPTIONS'] }));

  app.use(express.json({ limit: '16kb' }));

  app.use(express.urlencoded({ extended: false, limit: '16kb' }));

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  app.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  app.use(createOidcSession(store));

  app.use(serializeSession());

  app.use(createOidcRoutes(users));

  app.use(createUsuarioRoutes(users));

  app.use((_req, res) => res.status(404).json({ message: 'Rota não encontrada.' }));

  const onError: ErrorRequestHandler = (error, req, res, _next) => {

  const status = error instanceof AuthError ? error.status : error?.type === 'entity.parse.failed' ? 400 : 500;
    // Não registra o objeto de erro: respostas do provedor podem conter tokens.
    if (status === 500) req.log?.error({ event: 'request_failed', errorType: error?.name }, 'Falha interna');
    res.status(status).json({ message: error instanceof AuthError ? error.message : status === 400 ? 'JSON inválido.' : 'Erro interno no servidor.' });
  };

  app.use(onError);
  
  return app;
}
