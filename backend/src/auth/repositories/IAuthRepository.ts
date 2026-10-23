import type { RefreshTokens } from '@prisma/client';
import type { SalvarRefreshTokenDTO } from '../dtos/SalvarRefreshTokenDTO';

export interface IAuthRepository {

    saveRefreshToken(data: SalvarRefreshTokenDTO): Promise<void>;

    findRefreshToken(tokenHash: string): Promise<RefreshTokens | null>;

    rotateRefreshToken(tokenHash: string, data: SalvarRefreshTokenDTO): Promise<boolean>;
    
    deleteRefreshToken(tokenHash: string): Promise<void>;
}
