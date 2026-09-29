import { timingSafeEqual } from 'node:crypto';
import type { RequestHandler } from 'express';
import { AuthError } from './errors';


export const requireCsrf: RequestHandler = (req, _res, next) => {
  const expected = req.session.auth?.csrfToken;
  if (!expected) return next(new AuthError(401, 'Entre novamente.'));
  const received = req.get('x-csrf-token') ?? req.body?._csrf;
  const allowed = [new URL(process.env.OIDC_REDIRECT_URI!).origin, process.env.FRONTEND_URL ?? 'http://localhost:5173'];
  const origin = req.get('origin');
  if ((origin && !allowed.includes(origin)) || typeof received !== 'string' ||
      Buffer.byteLength(received) !== Buffer.byteLength(expected) ||
      !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
    return next(new AuthError(403, 'Proteção CSRF: requisição recusada.'));
  }
  next();
};
