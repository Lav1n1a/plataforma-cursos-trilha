import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
} from 'jose';
import { oidcConfig } from './discover';

export interface IdTokenClaims extends JWTPayload {
  sub: string;
  nonce?: string;
  email?: string;
  name?: string;
}

const clientId = process.env.OIDC_CLIENT_ID;

if (!clientId) {
  throw new Error('Configure OIDC_CLIENT_ID no backend/.env');
}

const keycloakPublicKeys = createRemoteJWKSet(
  new URL(oidcConfig.jwks_uri),
);

export async function validateIdToken(
  idToken: string,
): Promise<IdTokenClaims> {
  const { payload } = await jwtVerify<IdTokenClaims>(
    idToken,
    keycloakPublicKeys,
    {
      issuer: oidcConfig.issuer,
      audience: clientId,
      algorithms: ['RS256'],
    },
  );

  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new Error('ID token sem identificador do usuário');
  }

  return payload;
}
