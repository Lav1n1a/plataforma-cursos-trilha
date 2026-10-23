import { Router } from 'express';
import type { IUserRepository } from '../usuarios/repositories/IUserRepository';
import type { IAuthRepository } from '../auth/repositories/IAuthRepository';
import { AuthMiddleware } from '../auth/middlewares/auth';
import { criarAuthRoutes } from './auth.routes';
import { criarPublicRoutes } from './public.routes';
import { criarUsuarioRoutes } from './usuario.routes';

export function criarRotas(users: IUserRepository, auth: IAuthRepository) {

    const router = Router();

    router.use('/auth', criarAuthRoutes(users, auth));

    router.use(criarPublicRoutes(users));

    router.use(new AuthMiddleware(users).execute);

    router.use('/usuarios', criarUsuarioRoutes(users));
    
    return router;
}
