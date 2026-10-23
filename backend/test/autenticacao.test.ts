import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import test, { type TestContext } from 'node:test';
import express from 'express';
import { hash } from 'argon2';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../src/middlewares/error-handler';
import { AutenticarUsuarioController } from '../src/usuarios/controllers/AutenticarUsuarioController';
import type { SalvarRefreshTokenDTO } from '../src/usuarios/dtos/SalvarRefreshTokenDTO';
import type { IUserRepository } from '../src/usuarios/repositories/IUserRepository';
import { AutenticarUsuarioUseCase, REFRESH_TTL_MS } from '../src/usuarios/useCases/AutenticarUsuario';

const senha = 'Teste1234';
const usuario = {
    id: 1, nome: 'Maria', email: 'maria@example.com',
    senha: await hash(senha), perfil: 'PARTICIPANTE' as const, criadoEm: new Date(),
};

function configurarEnv(t: TestContext, key: string, value: string) {
    const anterior = process.env[key];
    process.env[key] = value;
    t.after(() => {
        if (anterior === undefined) delete process.env[key];
        else process.env[key] = anterior;
    });
}

function criarRepositorio(): IUserRepository {
    return {
        findByEmail: async (email) => email === usuario.email ? usuario : null,
        findById: async () => usuario,
        createUser: async () => assert.fail('Login não deve criar usuário'),
        saveRefreshToken: async () => {},
    };
}

async function login(repo: IUserRepository, body: unknown) {
    const app = express();
    const controller = new AutenticarUsuarioController(new AutenticarUsuarioUseCase(repo));
    app.use(express.json());
    app.post('/login', (req, res) => controller.handle(req, res));
    app.use(errorHandler);
    const server = app.listen(0, '127.0.0.1');
    try {
        await once(server, 'listening');
        const { port } = server.address() as AddressInfo;
        const response = await fetch(`http://127.0.0.1:${port}/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body), signal: AbortSignal.timeout(5000),
        });
        return {
            status: response.status, cookie: response.headers.get('set-cookie'),
            body: await response.json(),
        };
    } finally {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
            server.closeAllConnections();
        });
    }
}

test('login retorna JWT de 15 minutos e salva somente hash do refresh com validade de 7 dias', async (t) => {
    configurarEnv(t, 'JWT_SECRET', 'segredo-exclusivo-dos-testes');
    configurarEnv(t, 'NODE_ENV', 'production');
    const repo = criarRepositorio();
    const registros: SalvarRefreshTokenDTO[] = [];
    repo.saveRefreshToken = async (data) => { registros.push(data); };
    const inicio = Date.now();
    const response = await login(repo, { email: usuario.email, senha });

    assert.equal(response.status, 200);
    assert.deepEqual(Object.keys(response.body).sort(), ['accessToken', 'user']);
    assert.deepEqual(response.body.user, {
        id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil,
    });
    const payload = jwt.verify(response.body.accessToken, process.env.JWT_SECRET!, {
        algorithms: ['HS256'],
    }) as jwt.JwtPayload;
    assert.equal(payload.id, usuario.id);
    assert.equal(payload.perfil, usuario.perfil);
    assert.equal(payload.exp! - payload.iat!, 15 * 60);

    assert.ok(response.cookie);
    assert.match(response.cookie, /HttpOnly/);
    assert.match(response.cookie, /Secure/);
    assert.match(response.cookie, /SameSite=Lax/);
    assert.match(response.cookie, /Path=\//);
    assert.match(response.cookie, /Max-Age=604800/);
    const refresh = /^refresh_token=([a-f0-9]{64});/.exec(response.cookie)?.[1];
    assert.ok(refresh);
    assert.equal(registros.length, 1);
    assert.equal(registros[0].usuarioId, usuario.id);
    assert.equal(registros[0].token_hash, createHash('sha256').update(refresh).digest('hex'));
    assert.notEqual(registros[0].token_hash, refresh);
    assert.ok(registros[0].expiradoEm.getTime() >= inicio + REFRESH_TTL_MS);
    assert.ok(registros[0].expiradoEm.getTime() <= Date.now() + REFRESH_TTL_MS);
});

test('credenciais inválidas retornam 401 sem gravar refresh ou enviar cookie', async () => {
    const repo = criarRepositorio();
    repo.saveRefreshToken = async () => assert.fail('Não deve persistir refresh');
    for (const data of [
        { email: usuario.email, senha: 'incorreta' },
        { email: 'inexistente@example.com', senha },
    ]) {
        assert.deepEqual(await login(repo, data), {
            status: 401, cookie: null, body: { message: 'Email ou senha inválidos' },
        });
    }
});

test('dados obrigatórios ausentes ou de tipo inválido retornam 400', async () => {
    for (const data of [{}, { email: 123, senha }, { email: usuario.email, senha: [] }]) {
        assert.deepEqual(await login(criarRepositorio(), data), {
            status: 400, cookie: null, body: { message: 'Senha e email são obrigatórios' },
        });
    }
});

test('falha de persistência não envia tokens ao cliente', async (t) => {
    configurarEnv(t, 'JWT_SECRET', 'segredo-exclusivo-dos-testes');
    t.mock.method(console, 'error', () => {});
    const repo = criarRepositorio();
    repo.saveRefreshToken = async () => { throw new Error('Banco indisponível'); };
    assert.deepEqual(await login(repo, { email: usuario.email, senha }), {
        status: 500, cookie: null,
        body: { message: 'Não foi possível realizar a operação. Tente novamente.' },
    });
});

test('JWT_SECRET ausente impede emissão e persistência dos tokens', async (t) => {
    configurarEnv(t, 'JWT_SECRET', '');
    const repo = criarRepositorio();
    repo.saveRefreshToken = async () => assert.fail('Não deve persistir refresh');
    await assert.rejects(
        new AutenticarUsuarioUseCase(repo).execute({ email: usuario.email, senha }),
        /JWT_SECRET não configurado/,
    );
});
