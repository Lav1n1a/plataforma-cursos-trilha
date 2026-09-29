import { Prisma } from '@prisma/client';
import { prisma } from '../data/prisma';
import type { IdTokenClaims } from '../oidc/validate-id-token';
import { AuthError } from './errors';

export const publicUserFields = { id: true, nome: true, email: true, perfil: true } as const;
export type PublicUser = Prisma.UsuarioGetPayload<{ select: typeof publicUserFields }>;

export interface AuthUsers {
  resolveIdentity(claims: IdTokenClaims): Promise<PublicUser>;
  findById(id: number): Promise<PublicUser | null>;
  list(email?: string): Promise<PublicUser[]>;
}

export const authUsers: AuthUsers = {
  async resolveIdentity(claims) {
    const identity = { oidcIssuer: claims.iss!, oidcSub: claims.sub };
    const existing = await prisma.usuario.findUnique({
      where: { oidcIssuer_oidcSub: identity }, select: publicUserFields,
    });
    if (existing) return existing;
    if (typeof claims.email !== 'string' || !claims.email.trim().includes('@')) {
      throw new AuthError(400, 'Cadastre um email no usuário do Keycloak e entre novamente.');
    }
    const email = claims.email.trim().toLowerCase();
   
    const collision = await prisma.usuario.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
    if (collision) throw new AuthError(409, 'Já existe uma conta com esse email. O administrador precisa conferir o vínculo.');
    try {
      return await prisma.usuario.create({ data: {
        ...identity, email,
        nome: typeof claims.name === 'string' && claims.name.trim() ? claims.name.trim() : email,
        perfil: 'PARTICIPANTE',
      }, select: publicUserFields });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const concurrent = await prisma.usuario.findUnique({ where: { oidcIssuer_oidcSub: identity }, select: publicUserFields });
        if (concurrent) return concurrent;
        throw new AuthError(409, 'Email já cadastrado. O administrador precisa conferir o vínculo.');
      }
      throw error;
    }
  },
  findById: (id) => prisma.usuario.findUnique({ where: { id }, select: publicUserFields }),
  list: (email) => prisma.usuario.findMany({
    where: email ? { email: { equals: email, mode: 'insensitive' } } : undefined,
    select: publicUserFields, orderBy: { id: 'asc' }, take: 100,
  }),
};
