import type { Request, RequestHandler, Response } from 'express';
import type { AuthUsers } from './users';
import { AuthError } from './errors';
import { refreshTokens, type TokenResponse } from '../oidc/exchange-code';
import { validateIdToken } from '../oidc/validate-id-token';
import { cookieOptions, destroySession, saveSession, sessionCookieName, type Authentication } from '../middlewares/oidc-session';

export function applyTokens(auth: Authentication, tokens: TokenResponse) {
  auth.accessToken = tokens.access_token;
  auth.accessExpiresAt = Date.now() + tokens.expires_in * 1000;
  if (tokens.refresh_token) auth.refreshToken = tokens.refresh_token;
  if (tokens.refresh_expires_in !== undefined) {
    auth.refreshExpiresAt = tokens.refresh_expires_in > 0 ? Date.now() + tokens.refresh_expires_in * 1000 : undefined;
  }
  if (tokens.id_token) auth.idToken = tokens.id_token;
}

export async function endLocalSession(req: Request, res: Response) {
  await destroySession(req);
  res.clearCookie(sessionCookieName, cookieOptions);
}

export function requireSession(users: AuthUsers): RequestHandler {
  return async (req, res, next) => {
    try {
      const auth = req.session.auth;
      if (!auth) throw new AuthError(401, 'Entre em /auth/login para continuar.');
      if (Date.now() >= auth.absoluteExpiresAt) throw new AuthError(401, 'Sessão expirada. Entre novamente.');
      const user = await users.findById(auth.userId);
      if (!user) throw new AuthError(401, 'Usuário não encontrado. Entre novamente.');

      // Renova só quando faltam 30 segundos ou menos. Não há timer no navegador.
      if (auth.accessExpiresAt <= Date.now() + 30_000) {
        if (!auth.refreshToken || (auth.refreshExpiresAt !== undefined && auth.refreshExpiresAt <= Date.now())) {
          throw new AuthError(401, 'Refresh token expirado. Entre novamente.');
        }
        const tokens = await refreshTokens(auth.refreshToken);
        if (tokens.id_token) {
          try {
            const claims = await validateIdToken(tokens.id_token, auth.nonce, false);
            if (claims.sub !== auth.subject || (claims.auth_time !== undefined && claims.auth_time !== auth.authTime)) {
              throw new Error('Identidade mudou durante o refresh');
            }
          } catch { throw new AuthError(401, 'ID token do refresh inválido. Entre novamente.'); }
        }
        applyTokens(auth, tokens);
        await saveSession(req);
      }
      req.user = user;
      res.locals.user = user;
      next();
    } catch (error) {
      if (error instanceof AuthError && error.status === 401 && req.session) {
        try { await endLocalSession(req, res); } catch (storeError) { return next(storeError); }
      }
      next(error);
    }
  };
}

export const requireAdmin: RequestHandler = (req, _res, next) => {
  if (req.user?.perfil !== 'ADMIN') return next(new AuthError(403, 'Esta rota exige perfil ADMIN.'));
  next();
};
