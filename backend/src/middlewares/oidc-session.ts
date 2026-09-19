import session from 'express-session';

declare module 'express-session' {
  interface SessionData {
    codeVerifier?: string;
    state?: string;
    nonce?: string;
  }
}

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error('Configure SESSION_SECRET no backend/.env');
}

// MemoryStore é usado somente nesta etapa de desenvolvimento local.
export const oidcSession = session({
  name: 'trilha.sid',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 10 * 60 * 1000,
  },
});
