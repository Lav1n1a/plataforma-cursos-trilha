import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { once } from 'node:events';
import { after, before, test } from 'node:test';
import express from 'express';
import session from 'express-session';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';

// Testa o mesmo JavaScript compilado que será iniciado por npm start.

const clientId = 'test-client';
const expectedNonce = 'nonce-da-tentativa-de-teste';
const authorizationCodes = new Map();
const servers = [];
let issuer;
let appUrl;
let signingKey;
let otherSigningKey;
let validateIdToken;
let tokenRequests = 0;
let refreshRequests = 0;
let revokedToken;
let store;
let refreshMode = 'ok';
let refreshGate;
const refreshGrants = new Map();
const user = { id: 1, nome: 'Pessoa de teste', email: 'teste@example.com', perfil: 'PARTICIPANTE' };
let userExists = true;
let identityConflict = false;

async function start(app) {
  const server = app.listen(0, '127.0.0.1');
  servers.push(server);
  await once(server, 'listening');
  return `http://127.0.0.1:${server.address().port}`;
}

async function issueToken(overrides = {}, key = signingKey) {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: issuer,
    aud: clientId,
    sub: 'test-user',
    iat: now,
    exp: now + 300,
    nonce: expectedNonce,
    email: 'teste@example.com',
    ...overrides,
  };
  for (const claim of Object.keys(claims)) {
    if (claims[claim] === undefined) delete claims[claim];
  }
  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
    .sign(key);
}

before(async () => {
  const keys = await generateKeyPair('RS256');
  signingKey = keys.privateKey;
  otherSigningKey = (await generateKeyPair('RS256')).privateKey;
  const publicJwk = { ...await exportJWK(keys.publicKey), kid: 'test-key', alg: 'RS256', use: 'sig' };

  const provider = express();
  provider.use(express.urlencoded({ extended: false }));
  provider.get('/.well-known/openid-configuration', (_req, res) => res.json({
    issuer,
    authorization_endpoint: `${issuer}/authorize`,
    token_endpoint: `${issuer}/token`,
    jwks_uri: `${issuer}/certs`,
    end_session_endpoint: `${issuer}/logout`,
    revocation_endpoint: `${issuer}/revoke`,
  }));
  provider.get('/certs', (_req, res) => res.json({ keys: [publicJwk] }));
  provider.post('/revoke', (req, res) => {
    revokedToken = req.body.token;
    refreshGrants.delete(revokedToken);
    res.sendStatus(200);
  });
  provider.post('/token', async (req, res) => {
    tokenRequests += 1;
    if (req.body.grant_type === 'refresh_token') {
      refreshRequests++;
      if (refreshMode === 'unavailable') return res.status(503).json({ error: 'temporarily_unavailable' });
      const grant = refreshGrants.get(req.body.refresh_token);
      if (!grant || refreshMode === 'invalid') return res.status(400).json({ error: 'invalid_grant' });
      refreshGrants.delete(req.body.refresh_token);
      if (refreshGate) {
        refreshGate.entered();
        await refreshGate.wait;
      }
      const rotated = randomBytes(24).toString('hex');
      refreshGrants.set(rotated, grant);
      const idClaims = { nonce: refreshMode === 'nonce' ? 'outro-nonce' : undefined,
        sub: refreshMode === 'subject' ? 'outro-usuario' : 'test-user' };
      return res.json({ access_token: 'refreshed-access-token', refresh_token: rotated,
        id_token: refreshMode === 'no-id' ? undefined : await issueToken(idClaims),
        expires_in: 300, refresh_expires_in: 1800, token_type: 'Bearer' });
    }
    const attempt = authorizationCodes.get(req.body.code);
    authorizationCodes.delete(req.body.code);
    const challenge = createHash('sha256').update(req.body.code_verifier ?? '').digest('base64url');
    if (!attempt || challenge !== attempt.challenge ||
        req.body.grant_type !== 'authorization_code' ||
        req.body.client_id !== clientId || req.body.client_secret !== 'test-secret') {
      return res.status(400).json({ error: 'invalid_grant' });
    }
    const refresh = randomBytes(24).toString('hex');
    refreshGrants.set(refresh, { nonce: attempt.nonce });
    return res.json({
      access_token: 'test-access-token',
      refresh_token: refresh,
      id_token: await issueToken({ nonce: attempt.nonce }),
      expires_in: 300,
      refresh_expires_in: 1800,
      token_type: 'Bearer',
    });
  });
  issuer = await start(provider);

  // Somente este processo de testes usa estas configurações temporárias.
  process.env.OIDC_ISSUER = issuer;
  process.env.OIDC_CLIENT_ID = clientId;
  process.env.OIDC_CLIENT_SECRET = 'test-secret';
  process.env.OIDC_REDIRECT_URI = 'http://localhost:3333/auth/callback';
  process.env.SESSION_SECRET = randomBytes(32).toString('hex');
  process.env.NODE_ENV = 'test';

  ({ validateIdToken } = await import('../dist/oidc/validate-id-token.js'));
  const { createApp } = await import('../dist/app.js');
  const { AuthError } = await import('../dist/auth/errors.js');
  const users = {
    resolveIdentity: async () => {
      if (identityConflict) throw new AuthError(409, 'Email já cadastrado.');
      return user;
    },
    findById: async () => userExists ? { ...user } : null,
    list: async () => [{ ...user }],
  };
  store = new session.MemoryStore();
  const app = express();
  app.use(createApp(store, users));
  appUrl = await start(app);
});

after(async () => {
  await Promise.all(servers.map(server => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeIdleConnections();
  })));
});

test('aceita assinatura, claims e nonce correspondentes à tentativa', async () => {
  const claims = await validateIdToken(await issueToken(), expectedNonce);
  assert.equal(claims.sub, 'test-user');
  assert.equal(claims.nonce, expectedNonce);
});

for (const claim of ['iss', 'sub', 'aud', 'exp', 'iat', 'nonce']) {
  test(`rejeita ID token sem ${claim}`, async () => {
    await assert.rejects(validateIdToken(await issueToken({ [claim]: undefined }), expectedNonce));
  });
}

const invalidClaims = [
  ['nonce diferente', { nonce: 'nonce-de-outro-login' }],
  ['nonce com tipo inválido', { nonce: 123 }],
  ['emissor diferente', { iss: 'https://outro-emissor.example' }],
  ['destinatário diferente', { aud: 'outro-client' }],
  ['sub vazio', { sub: '' }],
  ['sub com tipo inválido', { sub: 123 }],
  ['exp com tipo inválido', { exp: 'amanha' }],
  ['iat com tipo inválido', { iat: 'ontem' }],
  ['token expirado', { exp: Math.floor(Date.now() / 1000) - 60 }],
  ['emissão no futuro', { iat: Math.floor(Date.now() / 1000) + 3600 }],
  ['nbf no futuro', { nbf: Math.floor(Date.now() / 1000) + 3600 }],
  ['azp de outro client', { azp: 'outro-client' }],
  ['vários destinatários sem azp', { aud: [clientId, 'outro-client'] }],
];
for (const [name, claims] of invalidClaims) {
  test(`rejeita ${name}`, async () => {
    await assert.rejects(validateIdToken(await issueToken(claims), expectedNonce));
  });
}

test('aceita azp correspondente ao client', async () => {
  const token = await issueToken({ azp: clientId });
  assert.equal((await validateIdToken(token, expectedNonce)).sub, 'test-user');
});

test('rejeita assinatura feita por uma chave não confiável', async () => {
  await assert.rejects(validateIdToken(await issueToken({}, otherSigningKey), expectedNonce));
});

test('rejeita algoritmo fora da lista permitida', async () => {
  const token = await new SignJWT({ nonce: expectedNonce })
    .setProtectedHeader({ alg: 'HS256' }).sign(randomBytes(32));
  await assert.rejects(validateIdToken(token, expectedNonce));
});

test('rejeita chamada sem nonce esperado', async () => {
  await assert.rejects(validateIdToken(await issueToken(), ''), /Nonce/);
});

async function beginLogin(invalidNonce = false) {
  const response = await fetch(`${appUrl}/auth/login`, { redirect: 'manual' });
  assert.equal(response.status, 302);
  const cookie = response.headers.get('set-cookie').split(';')[0];
  const params = new URL(response.headers.get('location')).searchParams;
  const code = randomBytes(16).toString('hex');
  authorizationCodes.set(code, {
    challenge: params.get('code_challenge'),
    nonce: invalidNonce ? 'nonce-de-outro-login' : params.get('nonce'),
  });
  const url = `${appUrl}/auth/callback?${new URLSearchParams({ code, state: params.get('state') })}`;
  return { cookie, url };
}

async function assertAttemptConsumed(cookie) {
  const value = await readSession(cookie);
  assert.equal(Boolean(value?.state || value?.nonce || value?.codeVerifier), false);
}

test('callback autentica, troca o cookie, consome a tentativa e mantém tokens no servidor', async () => {
  const { cookie, url } = await beginLogin();
  const response = await fetch(url, { headers: { cookie }, redirect: 'manual' });
  assert.equal(response.status, 303);
  assert.equal(response.headers.get('location'), '/me');
  const newCookie = response.headers.get('set-cookie').split(';')[0];
  assert.notEqual(newCookie, cookie);
  assert.match(response.headers.get('set-cookie'), /HttpOnly/);
  assert.match(response.headers.get('set-cookie'), /SameSite=Lax/);
  const me = await fetch(`${appUrl}/me`, { headers: { cookie: newCookie } });
  const body = await me.json();
  assert.equal(body.authenticated, true);
  assert.equal(body.user.id, 1);
  assert.equal(body.user.perfil, 'PARTICIPANTE');
  assert.ok(body.csrfToken);
  assert.equal(JSON.stringify(body).includes('test-access-token'), false);
  await assertAttemptConsumed(cookie);
  assert.equal((await fetch(url, { headers: { cookie } })).status, 400);
});

test('callback retorna 401 para token com nonce de outro login e limpa a tentativa', async () => {
  const { cookie, url } = await beginLogin(true);
  const response = await fetch(url, { headers: { cookie } });
  assert.equal(response.status, 401);
  await assertAttemptConsumed(cookie);
});

test('callback sem nonce na sessão retorna 400 sem pedir tokens', async () => {
  const { cookie, url } = await beginLogin();
  await mutateSession(cookie, data => { delete data.nonce; });
  const requestsBefore = tokenRequests;
  assert.equal((await fetch(url, { headers: { cookie } })).status, 400);
  assert.equal(tokenRequests, requestsBefore);
  await assertAttemptConsumed(cookie);
});

function sidOf(cookie) {
  return decodeURIComponent(cookie.split('=')[1]).slice(2).split('.')[0];
}
function readSession(cookie) {
  return new Promise((resolve, reject) => store.get(sidOf(cookie), (error, value) => error ? reject(error) : resolve(value)));
}
async function mutateSession(cookie, mutate) {
  const value = await readSession(cookie);
  mutate(value);
  await new Promise((resolve, reject) => store.set(sidOf(cookie), value, error => error ? reject(error) : resolve()));
}
async function login() {
  const attempt = await beginLogin();
  const response = await fetch(attempt.url, { headers: { cookie: attempt.cookie }, redirect: 'manual' });
  assert.equal(response.status, 303);
  const cookie = response.headers.get('set-cookie').split(';')[0];
  const data = await readSession(cookie);
  return { cookie, auth: data.auth, csrf: data.auth.csrfToken };
}

test('sem cookie, ou somente com Bearer antigo, /me retorna 401', async () => {
  for (const headers of [{}, { authorization: 'Bearer jwt-local-antigo' }, { cookie: 'trilha.sid=invalido' }]) {
    assert.equal((await fetch(`${appUrl}/me`, { headers })).status, 401);
  }
});

test('rotas antigas de senha não emitem mais tokens', async () => {
  assert.equal((await fetch(`${appUrl}/login`, { method: 'POST' })).status, 410);
  assert.equal((await fetch(`${appUrl}/usuarios`, { method: 'POST' })).status, 410);
});

test('state incorreto não troca código; tentativa antiga expira', async () => {
  const { cookie, url } = await beginLogin();
  const before = tokenRequests;
  const bad = new URL(url);
  bad.searchParams.set('state', 'invalido');
  assert.equal((await fetch(bad, { headers: { cookie } })).status, 400);
  await mutateSession(cookie, data => { data.loginStartedAt = Date.now() - 11 * 60_000; });
  assert.equal((await fetch(url, { headers: { cookie } })).status, 400);
  assert.equal(tokenRequests, before);
});

test('email conflitante não cria sessão autenticada', async () => {
  const { cookie, url } = await beginLogin();
  identityConflict = true;
  try {
    assert.equal((await fetch(url, { headers: { cookie }, redirect: 'manual' })).status, 409);
    assert.equal((await readSession(cookie)).auth, undefined);
  } finally { identityConflict = false; }
});

test('permissões são relidas do banco: participante recebe 403 e admin recebe 200', async () => {
  const { cookie } = await login();
  assert.equal((await fetch(`${appUrl}/admin`, { headers: { cookie } })).status, 403);
  assert.equal((await fetch(`${appUrl}/usuarios`, { headers: { cookie } })).status, 403);
  user.perfil = 'ADMIN';
  try {
    assert.equal((await fetch(`${appUrl}/admin`, { headers: { cookie } })).status, 200);
    const users = await (await fetch(`${appUrl}/usuarios`, { headers: { cookie } })).json();
    assert.deepEqual(Object.keys(users[0]).sort(), ['email', 'id', 'nome', 'perfil']);
  } finally { user.perfil = 'PARTICIPANTE'; }
  assert.equal((await fetch(`${appUrl}/admin`, { headers: { cookie } })).status, 403);
});

test('access token válido não dispara refresh; expirado é renovado e refresh token rotaciona', async () => {
  const { cookie, auth } = await login();
  const before = refreshRequests;
  assert.equal((await fetch(`${appUrl}/me`, { headers: { cookie } })).status, 200);
  assert.equal(refreshRequests, before);
  await mutateSession(cookie, data => { data.auth.accessExpiresAt = Date.now() - 1000; });
  const response = await fetch(`${appUrl}/me`, { headers: { cookie } });
  assert.equal(response.status, 200);
  assert.equal(refreshRequests, before + 1);
  const updated = await readSession(cookie);
  assert.notEqual(updated.auth.refreshToken, auth.refreshToken);
  assert.equal(updated.auth.accessToken, 'refreshed-access-token');
  assert.equal(JSON.stringify(await response.json()).includes('access-token'), false);
  // O provedor não repetiu nonce no ID token do refresh, o que é permitido pelo OIDC.
});

test('cinco requisições simultâneas renovam o token uma única vez', async () => {
  const { cookie } = await login();
  await mutateSession(cookie, data => { data.auth.accessExpiresAt = 0; });
  const before = refreshRequests;
  const responses = await Promise.all(Array.from({ length: 5 }, () => fetch(`${appUrl}/me`, { headers: { cookie } })));
  assert.deepEqual(responses.map(response => response.status), [200, 200, 200, 200, 200]);
  assert.equal(refreshRequests, before + 1);
});

test('refresh aceita resposta sem ID token', async () => {
  const { cookie } = await login();
  await mutateSession(cookie, data => { data.auth.accessExpiresAt = 0; });
  refreshMode = 'no-id';
  try { assert.equal((await fetch(`${appUrl}/me`, { headers: { cookie } })).status, 200); }
  finally { refreshMode = 'ok'; }
});

test('fechar a conexão durante refresh não libera outra renovação antes de salvar', async () => {
  const { cookie } = await login();
  await mutateSession(cookie, data => { data.auth.accessExpiresAt = 0; });
  let entered;
  const started = new Promise(resolve => { entered = resolve; });
  let release;
  const wait = new Promise(resolve => { release = resolve; });
  refreshGate = { entered, wait };
  const before = refreshRequests;
  const controller = new AbortController();
  const first = fetch(`${appUrl}/me`, { headers: { cookie }, signal: controller.signal }).catch(() => null);
  let second;
  try {
    await started;
    controller.abort();
    await first;
    second = fetch(`${appUrl}/me`, { headers: { cookie } });
    await new Promise(resolve => setTimeout(resolve, 80));
    assert.equal(refreshRequests, before + 1);
  } finally {
    refreshGate = undefined;
    release();
  }
  assert.equal((await second).status, 200);
  assert.equal(refreshRequests, before + 1);
});

for (const mode of ['invalid', 'nonce', 'subject']) {
  test(`refresh ${mode} encerra a sessão e retorna 401`, async () => {
    const { cookie } = await login();
    await mutateSession(cookie, data => { data.auth.accessExpiresAt = 0; });
    refreshMode = mode;
    try {
      const response = await fetch(`${appUrl}/me`, { headers: { cookie } });
      assert.equal(response.status, 401);
      assert.equal(await readSession(cookie), undefined);
    } finally { refreshMode = 'ok'; }
  });
}

test('falha temporária no Keycloak retorna 503 e preserva a sessão para tentar novamente', async () => {
  const { cookie, auth } = await login();
  await mutateSession(cookie, data => { data.auth.accessExpiresAt = 0; });
  refreshMode = 'unavailable';
  try {
    assert.equal((await fetch(`${appUrl}/me`, { headers: { cookie } })).status, 503);
    assert.equal((await readSession(cookie)).auth.refreshToken, auth.refreshToken);
  } finally { refreshMode = 'ok'; }
  assert.equal((await fetch(`${appUrl}/me`, { headers: { cookie } })).status, 200);
});

for (const expiry of ['absoluteExpiresAt', 'refreshExpiresAt']) {
  test(`${expiry} expirado exige novo login`, async () => {
    const { cookie } = await login();
    await mutateSession(cookie, data => { data.auth[expiry] = 1; data.auth.accessExpiresAt = 0; });
    assert.equal((await fetch(`${appUrl}/me`, { headers: { cookie } })).status, 401);
  });
}

test('usuário removido do banco perde o acesso', async () => {
  const { cookie } = await login();
  userExists = false;
  try { assert.equal((await fetch(`${appUrl}/me`, { headers: { cookie } })).status, 401); }
  finally { userExists = true; }
});

test('refresh e logout exigem CSRF e recusam origem estrangeira', async () => {
  const { cookie, csrf } = await login();
  for (const route of ['/auth/refresh', '/auth/logout']) {
    assert.equal((await fetch(appUrl + route, { method: 'POST', headers: { cookie } })).status, 403);
    assert.equal((await fetch(appUrl + route, { method: 'POST', headers: {
      cookie, 'x-csrf-token': csrf, origin: 'https://outro-site.example',
    } })).status, 403);
  }
  assert.equal((await fetch(`${appUrl}/auth/refresh`, { method: 'POST', headers: { cookie, 'x-csrf-token': csrf } })).status, 200);
});

test('logout limpa cookie/sessão, revoga refresh e redireciona ao Keycloak', async () => {
  const { cookie, csrf, auth } = await login();
  assert.equal((await fetch(`${appUrl}/auth/logout`, { headers: { cookie } })).status, 200);
  assert.ok((await readSession(cookie)).auth); // GET apenas mostra confirmação.
  const response = await fetch(`${appUrl}/auth/logout`, { method: 'POST', redirect: 'manual',
    headers: { cookie, 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ _csrf: csrf }) });
  assert.equal(response.status, 303);
  const location = new URL(response.headers.get('location'));
  assert.equal(location.origin, issuer);
  assert.equal(location.searchParams.get('id_token_hint'), auth.idToken);
  assert.equal(location.searchParams.get('post_logout_redirect_uri'), 'http://localhost:3333/auth/logged-out');
  assert.equal(revokedToken, auth.refreshToken);
  assert.equal(await readSession(cookie), undefined);
  assert.match(response.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  assert.equal((await fetch(`${appUrl}/me`, { headers: { cookie } })).status, 401);
});

test('CORS permite o frontend configurado com credenciais', async () => {
  const response = await fetch(`${appUrl}/me`, { method: 'OPTIONS', headers: {
    origin: 'http://localhost:5173', 'access-control-request-method': 'GET',
  } });
  assert.equal(response.headers.get('access-control-allow-origin'), 'http://localhost:5173');
  assert.equal(response.headers.get('access-control-allow-credentials'), 'true');
});
