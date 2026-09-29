import { oidcConfig } from './discover';
import { AuthError } from '../auth/errors';

export interface TokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in: number;
  refresh_expires_in?: number;
  token_type: string;
}

function credentials() {
  const client_id = process.env.OIDC_CLIENT_ID;
  const client_secret = process.env.OIDC_CLIENT_SECRET;
  if (!client_id || !client_secret) throw new Error('Configuração OIDC incompleta');
  return { client_id, client_secret };
}

async function requestTokens(parameters: Record<string, string>): Promise<TokenResponse> {
  let response: Response;
  try {
    response = await fetch(oidcConfig.token_endpoint, {
      method: 'POST', signal: AbortSignal.timeout(5000),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ ...parameters, ...credentials() }),
    });
  } catch { throw new AuthError(503, 'Keycloak indisponível. Tente novamente em instantes.'); }
  const raw: unknown = await response.json().catch(() => null);
  const body = raw && typeof raw === 'object' ? raw as Record<string, unknown> : null;
  if (!response.ok) {
    if (response.status === 400 && body?.error === 'invalid_grant') {
      throw new AuthError(401, 'Autorização expirada ou revogada. Entre novamente.');
    }
    throw new AuthError(response.status >= 500 ? 503 : 502, 'Não foi possível obter tokens do Keycloak.');
  }
  if (!body || typeof body.access_token !== 'string' || !body.access_token ||
      typeof body.token_type !== 'string' || body.token_type.toLowerCase() !== 'bearer' ||
      typeof body.expires_in !== 'number' || !Number.isFinite(body.expires_in) || body.expires_in <= 0 ||
      (body.refresh_token !== undefined && (typeof body.refresh_token !== 'string' || !body.refresh_token)) ||
      (body.id_token !== undefined && (typeof body.id_token !== 'string' || !body.id_token)) ||
      (body.refresh_expires_in !== undefined && (typeof body.refresh_expires_in !== 'number' ||
        !Number.isFinite(body.refresh_expires_in) || body.refresh_expires_in < 0))) {
    throw new AuthError(502, 'Resposta de tokens inválida.');
  }
  return body as unknown as TokenResponse;
}

export async function exchangeCodeForTokens(code: string, codeVerifier: string) {
  const redirect_uri = process.env.OIDC_REDIRECT_URI;
  if (!redirect_uri) throw new Error('Configure OIDC_REDIRECT_URI');
  const tokens = await requestTokens({ grant_type: 'authorization_code', code, code_verifier: codeVerifier, redirect_uri });
  if (!tokens.id_token) throw new AuthError(502, 'Resposta de login sem ID token.');
  return { ...tokens, id_token: tokens.id_token };
}

export const refreshTokens = (refreshToken: string) => requestTokens({ grant_type: 'refresh_token', refresh_token: refreshToken });

export async function revokeRefreshToken(token: string) {
  if (!oidcConfig.revocation_endpoint) return;
  const response = await fetch(oidcConfig.revocation_endpoint, {
    method: 'POST', signal: AbortSignal.timeout(5000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ ...credentials(), token, token_type_hint: 'refresh_token' }),
  });
  if (!response.ok) throw new Error('Revogação indisponível');
}
