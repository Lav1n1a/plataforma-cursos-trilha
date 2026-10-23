import { Router } from 'express';
import type { IUserRepository } from '../usuarios/repositories/IUserRepository';
import { CriarUsuarioController } from '../usuarios/controllers/CriarUsuarioController';
import { CriarUsuarioUseCase } from '../usuarios/useCases/CriarUsuarioUseCase';

export function criarPublicRoutes(users: IUserRepository) {

    const router = Router();

    const cadastro = new CriarUsuarioController(new CriarUsuarioUseCase(users));

    router.post('/cadastro', (req, res) => cadastro.handle(req, res));
    
    return router;
}
