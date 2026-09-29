import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { createPkce } from '../oidc/pkce';
import { oidcConfig } from '../oidc/discover';
import { exchangeCodeForTokens, revokeRefreshToken } from '../oidc/exchange-code';
import { validateIdToken } from '../oidc/validate-id-token';
import { regenerateSession, saveSession } from '../middlewares/oidc-session';
import { applyTokens, endLocalSession, requireSession } from '../auth/require-session';
import { requireCsrf } from '../auth/csrf';
import { AuthError } from '../auth/errors';
import type { AuthUsers } from '../auth/users';

export function createOidcRoutes(users: AuthUsers) {
  const routes = Router();
  const clientId = process.env.OIDC_CLIENT_ID;
  const redirectUri = process.env.OIDC_REDIRECT_URI;
  if (!clientId || !redirectUri) throw new Error('Configure OIDC_CLIENT_ID e OIDC_REDIRECT_URI.');

  routes.get('/auth/login', async (req, res) => {
    const { codeVerifier, codeChallenge } = createPkce();
    req.session.codeVerifier = codeVerifier;
    req.session.state = randomBytes(32).toString('base64url');
    req.session.nonce = randomBytes(32).toString('base64url');
    req.session.loginStartedAt = Date.now();
    const url = new URL(oidcConfig.authorization_endpoint);
    url.search = new URLSearchParams({
      client_id: clientId, redirect_uri: redirectUri, response_type: 'code',
      scope: 'openid profile email', code_challenge: codeChallenge, code_challenge_method: 'S256',
      state: req.session.state, nonce: req.session.nonce,
    }).toString();
    await saveSession(req);
    res.redirect(url.toString());
  });

  routes.get('/auth/callback', async (req, res) => {
    const { code, state, error, iss } = req.query;
    if (typeof state !== 'string' || !req.session.state || state !== req.session.state) {
      throw new AuthError(400, 'Tentativa de login inválida. Comece em /auth/login.');
    }
    const { codeVerifier, nonce, loginStartedAt } = req.session;
    delete req.session.state;
    delete req.session.codeVerifier;
    delete req.session.nonce;
    delete req.session.loginStartedAt;
 
    await saveSession(req);
    if (error !== undefined || typeof code !== 'string' || !code || !codeVerifier || !nonce ||
        !loginStartedAt || Date.now() - loginStartedAt > 10 * 60_000 ||
        (iss !== undefined && iss !== oidcConfig.issuer)) {
      throw new AuthError(400, 'Login incompleto ou expirado. Comece em /auth/login.');
    }
    const tokens = await exchangeCodeForTokens(code, codeVerifier);
    let claims;
    try { claims = await validateIdToken(tokens.id_token, nonce); }
    catch { throw new AuthError(401, 'ID token inválido. Entre novamente.'); }
    const user = await users.resolveIdentity(claims);

    await regenerateSession(req);
    req.session.auth = {
      userId: user.id, subject: claims.sub, nonce, authTime: claims.auth_time,
      csrfToken: randomBytes(32).toString('base64url'), absoluteExpiresAt: Date.now() + 8 * 60 * 60_000,
      accessToken: tokens.access_token, accessExpiresAt: 0, idToken: tokens.id_token,
    };
    applyTokens(req.session.auth!, tokens);
    await saveSession(req);
    res.redirect(303, '/me');
  });

  routes.post('/auth/refresh', requireCsrf, requireSession(users), (req, res) => {
    res.json({ authenticated: true, accessExpiresAt: req.session.auth!.accessExpiresAt });
  });

  routes.get('/auth/logout', (req, res) => {
    if (!req.session.auth) return res.redirect('/auth/logged-out');
    res.setHeader('Content-Security-Policy', "default-src 'none'; form-action 'self'; frame-ancestors 'none'");
    res.type('html').send(`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Sair</title>
      <h1>Encerrar sessão</h1><form method="post" action="/auth/logout">
      <input type="hidden" name="_csrf" value="${req.session.auth.csrfToken}"><button>Sair da plataforma e do Keycloak</button></form></html>`);
  });

  routes.post('/auth/logout', requireCsrf, async (req, res) => {
    const auth = req.session.auth!;
  
    await endLocalSession(req, res);
    let revoked = true;
    if (auth.refreshToken) {
      try { await revokeRefreshToken(auth.refreshToken); } catch { revoked = false; }
    }
    if (!oidcConfig.end_session_endpoint) {
      return res.json({ authenticated: false, providerLogout: false, refreshRevoked: revoked });
    }
    const url = new URL(oidcConfig.end_session_endpoint);
    url.search = new URLSearchParams({
      client_id: clientId, id_token_hint: auth.idToken,
      post_logout_redirect_uri: process.env.OIDC_POST_LOGOUT_REDIRECT_URI ?? new URL('/auth/logged-out', redirectUri).href,
    }).toString();
    return res.redirect(303, url.toString());
  });
  routes.get('/auth/logged-out', (_req, res) => res.json({ message: 'Fluxo de logout concluído. Para entrar, acesse /auth/login.' }));
  return routes;
}
