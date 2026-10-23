import type { IAuthRepository } from '../repositories/IAuthRepository';
import { hashRefreshToken } from '../services/tokens';

export class EncerrarSessaoUseCase {
    constructor(private auth: IAuthRepository) {}

    async execute(refreshToken?: string) {
        if (refreshToken) await this.auth.deleteRefreshToken(hashRefreshToken(refreshToken));
    }
}
