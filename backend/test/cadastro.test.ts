import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import express from 'express';
import { verify } from 'argon2';
import { errorHandler } from '../src/middlewares/error-handler';
import { CriarUsuarioController } from '../src/usuarios/controllers/CriarUsuarioController';
import type { IUserRepository } from '../src/usuarios/repositories/IUserRepository';
import { CriarUsuarioUseCase } from '../src/usuarios/useCases/CriarUsuarioUseCase';

const dados = { nome: 'Maria', email: 'maria@example.com', senha: 'Teste1234' };

function criarRepositorio(): IUserRepository {
    return {
        findByEmail: async () => null,
        findById: async () => null,
        saveRefreshToken: async () => {},
        createUser: async (data) => ({ id: 1, nome: data.nome, email: data.email }),
    };
}

async function cadastrar(repo: IUserRepository, body: unknown) {
    const app = express();
    const controller = new CriarUsuarioController(new CriarUsuarioUseCase(repo));
    app.use(express.json());
    app.post('/cadastro', (req, res) => controller.handle(req, res));
    app.use(errorHandler);

    const server = app.listen(0, '127.0.0.1');
    try {
        await once(server, 'listening');
        const { port } = server.address() as AddressInfo;
        const response = await fetch(`http://127.0.0.1:${port}/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(5000),
        });
        return { status: response.status, body: await response.json() };
    } finally {
        await new Promise<void>((resolve, reject) => {
            server.close((error) => error ? reject(error) : resolve());
            server.closeAllConnections();
        });
    }
}

test('cadastro responde 201 com mensagem após salvar a senha criptografada', async () => {
    const repo = criarRepositorio();
    let salvou = false;
    repo.createUser = async (data) => {
        assert.equal(await verify(data.senha, dados.senha), true);
        salvou = true;
        return { id: 1, nome: data.nome, email: data.email };
    };

    assert.deepEqual(await cadastrar(repo, dados), {
        status: 201,
        body: { message: 'Conta criada com sucesso!' },
    });
    assert.equal(salvou, true);
});

test('email existente responde 400 com a mensagem original e não cria usuário', async () => {
    const repo = criarRepositorio();
    repo.findByEmail = async () => ({
        ...dados, id: 1, perfil: 'PARTICIPANTE', criadoEm: new Date(),
    });
    repo.createUser = async () => assert.fail('Não deve salvar email duplicado');

    assert.deepEqual(await cadastrar(repo, dados), {
        status: 400,
        body: { message: 'Email já cadastrado!' },
    });
});

test('dados obrigatórios ausentes respondem 400 em JSON', async () => {
    assert.deepEqual(await cadastrar(criarRepositorio(), {}), {
        status: 400,
        body: { message: 'Senha e email são obrigatórios' },
    });
});

test('falha inesperada responde 500 sem expor detalhes internos', async (t) => {
    t.mock.method(console, 'error', () => {});
    const repo = criarRepositorio();
    repo.createUser = async () => { throw new Error('Detalhes internos do banco'); };

    assert.deepEqual(await cadastrar(repo, dados), {
        status: 500,
        body: { message: 'Não foi possível realizar a operação. Tente novamente.' },
    });
});
