import { Router } from 'express';
import type { IUserRepository } from '../usuarios/repositories/IUserRepository';
import type { IAuthRepository } from '../auth/repositories/IAuthRepository';
import { AutenticarUsuarioController } from '../auth/controllers/AutenticarUsuarioController';
import { AtualizarSessaoController } from '../auth/controllers/AtualizarSessaoController';
import { EncerrarSessaoController } from '../auth/controllers/EncerrarSessaoController';
import { AutenticarUsuarioUseCase } from '../auth/useCases/AutenticarUsuario';
import { AtualizarSessaoUseCase } from '../auth/useCases/AtualizarSessao';
import { EncerrarSessaoUseCase } from '../auth/useCases/EncerrarSessao';

export function criarAuthRoutes(users: IUserRepository, auth: IAuthRepository) {

    const router = Router();

    const login = new AutenticarUsuarioController(new AutenticarUsuarioUseCase(users, auth));

    const refresh = new AtualizarSessaoController(new AtualizarSessaoUseCase(users, auth));

    const logout = new EncerrarSessaoController(new EncerrarSessaoUseCase(auth));

    router.post('/login', (req, res) => login.handle(req, res));
    router.post('/refresh', (req, res) => refresh.handle(req, res));
    router.post('/logout', (req, res) => logout.handle(req, res));
    
    return router;
}
