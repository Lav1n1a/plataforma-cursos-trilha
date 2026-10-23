import { Router } from 'express';
import type { IUserRepository } from '../usuarios/repositories/IUserRepository';
import { BuscarUsuarioPorEmailUseCase } from '../usuarios/useCases/BuscarUsuarioPorEmail';
import { BuscarUsuarioPorEmailController } from '../usuarios/controllers/BuscarUsuarioPorEmailController';

export function criarUsuarioRoutes(users: IUserRepository) {

    const router = Router();

    const buscar = new BuscarUsuarioPorEmailController(new BuscarUsuarioPorEmailUseCase(users));

    router.get('/', (req, res) => buscar.handle(req, res));

    router.get('/me', (req, res) => res.json(req.user));
    
    return router;
}
