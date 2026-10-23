import { createHash, randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Usuario } from '@prisma/client';

export const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function hashRefreshToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
}

export function criarSessao(usuario: Usuario) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET não configurado');
    return {
        accessToken: jwt.sign({ id: usuario.id, perfil: usuario.perfil }, secret, {
            expiresIn: '15m', algorithm: 'HS256',
        }),
        refreshToken: randomBytes(32).toString('hex'),
        user: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    };
}
