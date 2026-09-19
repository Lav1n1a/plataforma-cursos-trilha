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
};

if (oidcConfig.issuer !== issuer || typeof oidcConfig.authorization_endpoint !== 'string') {
  throw new Error('A configuração recebida não corresponde ao realm esperado');
}
