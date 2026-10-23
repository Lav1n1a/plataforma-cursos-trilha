import BaseRepository from '../../../data/repositories/BaseRepository';
import type { IAuthRepository } from '../IAuthRepository';
import type { SalvarRefreshTokenDTO } from '../../dtos/SalvarRefreshTokenDTO';

export class PrismaAuthRepository extends BaseRepository implements IAuthRepository {
    async saveRefreshToken(data: SalvarRefreshTokenDTO): Promise<void> {
        await this.prisma.refreshTokens.create({ data });
    }

    findRefreshToken(tokenHash: string) {
        return this.prisma.refreshTokens.findUnique({ where: { token_hash: tokenHash } });
    }

    async rotateRefreshToken(tokenHash: string, data: SalvarRefreshTokenDTO): Promise<boolean> {
        const result = await this.prisma.refreshTokens.updateMany({
            where: { token_hash: tokenHash, usuarioId: data.usuarioId, expiradoEm: { gt: new Date() } },
            data,
        });
        return result.count === 1;
    }

    async deleteRefreshToken(tokenHash: string): Promise<void> {
        await this.prisma.refreshTokens.deleteMany({ where: { token_hash: tokenHash } });
    }
}
