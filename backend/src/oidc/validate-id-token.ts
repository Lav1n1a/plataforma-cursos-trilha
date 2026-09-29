import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from 'jose';
import { oidcConfig } from './discover';

export interface IdTokenClaims extends JWTPayload {
  sub: string;
  nonce?: string;
  exp: number;
  iat: number;
  email?: string;
  name?: string;
  auth_time?: number;
}

const clientId = process.env.OIDC_CLIENT_ID;

if (!clientId) {
  throw new Error('Configure OIDC_CLIENT_ID no backend/.env');
}

const keycloakPublicKeys = createRemoteJWKSet(
  new URL(oidcConfig.jwks_uri),
);

const clockToleranceSeconds = 5;

export async function validateIdToken(
  idToken: string,
  expectedNonce: string,
  requireNonce = true,
): Promise<IdTokenClaims> {
  if (typeof expectedNonce !== 'string' || !expectedNonce) {
    throw new Error('Nonce da tentativa de login não encontrado');
  }

  const { payload } = await jwtVerify<IdTokenClaims>(
    idToken,
    keycloakPublicKeys,
    {
      issuer: oidcConfig.issuer,
      audience: clientId,
      algorithms: ['RS256'],
      // Além de conferir os valores, exige que essas claims existam.
      requiredClaims: ['iss', 'sub', 'aud', 'exp', 'iat', ...(requireNonce ? ['nonce'] : [])],
      clockTolerance: clockToleranceSeconds,
    },
  );

  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('ID token sem identificador do usuário');
  }

  if (payload.iat > Math.floor(Date.now() / 1000) + clockToleranceSeconds) {
    throw new Error('ID token com data de emissão no futuro');
  }

  if (payload.auth_time !== undefined && (typeof payload.auth_time !== 'number' || !Number.isFinite(payload.auth_time))) {
    throw new Error('auth_time inválido');
  }

  // Com vários destinatários, azp identifica o client autorizado.
  if (Array.isArray(payload.aud) && payload.aud.length > 1 && !payload.azp) {
    throw new Error('ID token com múltiplos destinatários sem azp');
  }

  if (payload.azp !== undefined && payload.azp !== clientId) {
    throw new Error('ID token emitido para outro client autorizado');
  }

  // Liga o token assinado à tentativa que começou neste navegador.
  if ((requireNonce || payload.nonce !== undefined) && payload.nonce !== expectedNonce) {
    throw new Error('Nonce do ID token não corresponde à tentativa de login');
  }

  return payload;
}
