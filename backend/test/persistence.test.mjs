import assert from 'node:assert/strict';
import { after, test, mock as tracker } from 'node:test';
import { Prisma } from '@prisma/client';
import { prisma } from '../dist/data/prisma.js';
import { authUsers } from '../dist/auth/users.js';
import { PrismaSessionStore } from '../dist/auth/session-store.js';

// Prisma expõe métodos por Proxy, sem descritor de método para mock.method.
const restorers = [];
const mock = {
  method(target, name, implementation) {
    const original = target[name];
    const replacement = tracker.fn(implementation);
    target[name] = replacement;
    restorers.push(() => { target[name] = original; });
    return replacement;
  },
  restoreAll() { while (restorers.length) restorers.pop()(); },
};

after(() => prisma.$disconnect());
const identity = { iss: 'https://identity.example/realms/trilha', sub: 'subject-123',
  email: 'Pessoa@Example.com', name: 'Pessoa', iat: 1, exp: 9999999999 };
const publicUser = { id: 1, nome: 'Pessoa', email: 'pessoa@example.com', perfil: 'PARTICIPANTE' };

test('primeiro login persiste issuer/sub, normaliza email e nunca cria admin ou senha', async () => {
  mock.method(prisma.usuario, 'findUnique', async () => null);
  mock.method(prisma.usuario, 'findFirst', async () => null);
  let saved;
  mock.method(prisma.usuario, 'create', async (args) => { saved = args; return publicUser; });
  try {
    assert.deepEqual(await authUsers.resolveIdentity({ ...identity, perfil: 'ADMIN' }), publicUser);
    assert.deepEqual(saved.data, { oidcIssuer: identity.iss, oidcSub: identity.sub,
      email: 'pessoa@example.com', nome: 'Pessoa', perfil: 'PARTICIPANTE' });
    assert.equal(saved.data.senha, undefined);
    assert.equal(saved.select.senha, undefined);
  } finally { mock.restoreAll(); }
});

test('identidade já vinculada usa conta existente sem sobrescrever seu perfil', async () => {
  mock.method(prisma.usuario, 'findUnique', async (args) => {
    assert.deepEqual(args.where, { oidcIssuer_oidcSub: { oidcIssuer: identity.iss, oidcSub: identity.sub } });
    return { ...publicUser, perfil: 'ADMIN' };
  });
  try { assert.equal((await authUsers.resolveIdentity(identity)).perfil, 'ADMIN'); }
  finally { mock.restoreAll(); }
});

test('email já usado não vincula silenciosamente uma identidade nova', async () => {
  mock.method(prisma.usuario, 'findUnique', async () => null);
  mock.method(prisma.usuario, 'findFirst', async () => ({ id: 2, email: identity.email }));
  const create = mock.method(prisma.usuario, 'create', async () => assert.fail('Não deveria criar conta'));
  try {
    await assert.rejects(authUsers.resolveIdentity(identity), error => error.status === 409);
    assert.equal(create.mock.callCount(), 0);
  } finally { mock.restoreAll(); }
});

test('login sem email não cria usuário incompleto', async () => {
  mock.method(prisma.usuario, 'findUnique', async () => null);
  try { await assert.rejects(authUsers.resolveIdentity({ ...identity, email: undefined }), error => error.status === 400); }
  finally { mock.restoreAll(); }
});

test('criação concorrente da mesma identidade recupera o usuário que ganhou a corrida', async () => {
  let reads = 0;
  mock.method(prisma.usuario, 'findUnique', async () => ++reads === 1 ? null : publicUser);
  mock.method(prisma.usuario, 'findFirst', async () => null);
  mock.method(prisma.usuario, 'create', async () => {
    throw new Prisma.PrismaClientKnownRequestError('Duplicate', { code: 'P2002', clientVersion: 'test' });
  });
  try { assert.deepEqual(await authUsers.resolveIdentity(identity), publicUser); }
  finally { mock.restoreAll(); }
});

test('Store salva JSON, relê em outra instância, atualiza prazo e invalida sessão expirada', async () => {
  const rows = new Map();
  mock.method(prisma.authSession, 'upsert', async ({ where, create, update }) => {
    rows.set(where.sid, rows.has(where.sid) ? { ...rows.get(where.sid), ...update } : create);
  });
  mock.method(prisma.authSession, 'findUnique', async ({ where }) => rows.get(where.sid) ?? null);
  mock.method(prisma.authSession, 'updateMany', async ({ where, data }) => {
    if (rows.has(where.sid)) Object.assign(rows.get(where.sid), data);
  });
  mock.method(prisma.authSession, 'deleteMany', async ({ where }) => {
    for (const [sid, row] of rows) {
      if ((!where.sid || sid === where.sid) && (!where.expiresAt || row.expiresAt <= where.expiresAt.lte)) rows.delete(sid);
    }
  });
  const call = (store, method, ...args) => new Promise((resolve, reject) => {
    store[method](...args, (error, value) => error ? reject(error) : resolve(value));
  });
  try {
    const store = new PrismaSessionStore();
    const session = { cookie: { expires: new Date(Date.now() + 60_000) }, auth: { userId: 1 } };
    await call(store, 'set', 'session1', session);
    const afterRestart = new PrismaSessionStore();
    assert.equal((await call(afterRestart, 'get', 'session1')).auth.userId, 1);
    const expires = new Date(Date.now() + 120_000);
    await call(afterRestart, 'touch', 'session1', { cookie: { expires } });
    assert.equal(rows.get('session1').expiresAt.getTime(), expires.getTime());
    rows.get('session1').expiresAt = new Date(1);
    assert.equal(await call(afterRestart, 'get', 'session1'), null);
    assert.equal(rows.has('session1'), false);
    await call(store, 'set', 'session2', session);
    await call(store, 'destroy', 'session2');
    assert.equal(await call(store, 'get', 'session2'), null);
  } finally { mock.restoreAll(); }
});

test('Store propaga erro de banco sem fingir que a sessão foi salva', async () => {
  mock.method(prisma.authSession, 'upsert', async () => { throw new Error('Banco indisponível'); });
  try {
    const store = new PrismaSessionStore();
    await assert.rejects(new Promise((resolve, reject) => {
      store.set('sid', { cookie: {} }, error => error ? reject(error) : resolve());
    }), /Banco indisponível/);
  } finally { mock.restoreAll(); }
});
