import 'dotenv/config';

const issuer = process.env.OIDC_ISSUER;

if (!issuer) {
  throw new Error('Configure OIDC_ISSUER no backend/.env');
}

const response = await fetch(`${issuer}/.well-known/openid-configuration`, {
  signal: AbortSignal.timeout(5000),
});

if (!response.ok) {
  throw new Error(`Falha ao consultar o Keycloak: HTTP ${response.status}`);
}

export const oidcConfig = await response.json() as {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  end_session_endpoint?: string;
  revocation_endpoint?: string;
};

if (oidcConfig.issuer !== issuer || typeof oidcConfig.authorization_endpoint !== 'string' ||
    typeof oidcConfig.token_endpoint !== 'string' || typeof oidcConfig.jwks_uri !== 'string') {
  throw new Error('A configuração recebida não corresponde ao realm esperado');
}

for (const endpoint of [oidcConfig.issuer, oidcConfig.authorization_endpoint, oidcConfig.token_endpoint,
  oidcConfig.jwks_uri, oidcConfig.end_session_endpoint, oidcConfig.revocation_endpoint]) {
  if (endpoint === undefined) continue;
  const url = new URL(endpoint);
  const localHttp = process.env.NODE_ENV !== 'production' && url.protocol === 'http:' &&
    ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if (url.protocol !== 'https:' && !localHttp) throw new Error('OIDC exige HTTPS fora do desenvolvimento local.');
}
