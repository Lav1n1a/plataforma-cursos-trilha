import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../../helpers/api-erros';
import { IUserRepository } from '../../usuarios/repositories/IUserRepository';

export class AuthMiddleware {
    constructor(private repo: IUserRepository) {}

    public execute = async (req: Request, _res: Response, next: NextFunction) => {

        const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? '');

        if (!match) throw new UnauthorizedError('Não possui autorização');

        const secret = process.env.JWT_SECRET;

        if (!secret) throw new Error('JWT_SECRET não configurado');

        let id: number;

        try {
            const payload = jwt.verify(match[1], secret, { algorithms: ['HS256'] });

            if (typeof payload === 'string' || !Number.isSafeInteger(payload.id) || payload.id <= 0) {
                throw new Error('Payload inválido');
            }

            id = payload.id;

        } catch {

            throw new UnauthorizedError('Access token inválido ou expirado');

        }
        const usuario = await this.repo.findById(id);

        if (!usuario) throw new UnauthorizedError('Usuário não encontrado');

        req.user = { id: usuario.id, perfil: usuario.perfil };
        
        next();
    };
}
