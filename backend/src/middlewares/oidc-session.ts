import session from 'express-session';
import type { Request } from 'express';

export interface Authentication {
  userId: number;
  subject: string;
  nonce: string;
  authTime?: number;
  absoluteExpiresAt: number;
  csrfToken: string;
  accessToken: string;
  accessExpiresAt: number;
  refreshToken?: string;
  refreshExpiresAt?: number;
  idToken: string;
}

declare module 'express-session' {
  interface SessionData {
    codeVerifier?: string;
    state?: string;
    nonce?: string;
    loginStartedAt?: number;
    auth?: Authentication;
  }
}

export const sessionCookieName = 'trilha.sid';
export const cookieOptions = {
  httpOnly: true, sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production', path: '/',
};

export function createOidcSession(store: session.Store) {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET deve ter pelo menos 32 caracteres aleatórios.');
  return session({
    name: sessionCookieName, secret, store, resave: false, saveUninitialized: false,
    rolling: true, cookie: { ...cookieOptions, maxAge: 60 * 60 * 1000 },
  });
}

export const saveSession = (req: Request) => new Promise<void>((resolve, reject) => {
  req.session.save(error => error ? reject(error) : resolve());
});
export const destroySession = (req: Request) => new Promise<void>((resolve, reject) => {
  req.session.destroy(error => error ? reject(error) : resolve());
});
export const regenerateSession = (req: Request) => new Promise<void>((resolve, reject) => {
  req.session.regenerate(error => error ? reject(error) : resolve());
});
