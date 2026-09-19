import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { createPkce } from '../oidc/pkce';
import { oidcConfig } from '../oidc/discover';

const clientId = process.env.OIDC_CLIENT_ID;
const redirectUri = process.env.OIDC_REDIRECT_URI;

if (!clientId || !redirectUri) {
  throw new Error('Configure OIDC_CLIENT_ID e OIDC_REDIRECT_URI no backend/.env');
}

export const oidcRoutes = Router();

oidcRoutes.get('/auth/login', (req, res, next) => {
  const { codeVerifier, codeChallenge } = createPkce();
  const state = randomBytes(32).toString('base64url');
  const nonce = randomBytes(32).toString('base64url');

  req.session.codeVerifier = codeVerifier;
  req.session.state = state;
  req.session.nonce = nonce;

  const authorizationUrl = new URL(oidcConfig.authorization_endpoint);
  authorizationUrl.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    nonce,
  }).toString();

  // Aguarda a gravação antes de enviar o navegador para outro servidor.
  req.session.save((error) => {
    if (error) return next(error);

    res.setHeader('Cache-Control', 'no-store');
    return res.redirect(authorizationUrl.toString());
  });
});

oidcRoutes.get('/auth/callback', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Referrer-Policy', 'no-referrer');

  const { code, state, error } = req.query;

  if (typeof state !== 'string' || !req.session.state || state !== req.session.state) {
    return res.status(400).json({
      message: 'Tentativa de login inválida ou expirada. Comece em /auth/login.',
    });
  }

  // O state desta tentativa só pode ser usado uma vez.
  delete req.session.state;

  if (error !== undefined || typeof code !== 'string' || !code) {
    delete req.session.codeVerifier;
    delete req.session.nonce;

    return res.status(400).json({
      message: 'O login não foi concluído ou o retorno veio sem código de autorização.',
    });
  }

  // Etapa didática: a troca do código por tokens será implementada aqui.
  return res.json({
    message: 'Código de autorização recebido e state conferido.',
    codeReceived: true,
    stateValid: true,
    authenticated: false,
  });
});
