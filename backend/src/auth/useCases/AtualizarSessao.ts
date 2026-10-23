import { UnauthorizedError } from '../../helpers/api-erros';
import type { IUserRepository } from '../../usuarios/repositories/IUserRepository';
import type { IAuthRepository } from '../repositories/IAuthRepository';
import { criarSessao, hashRefreshToken, REFRESH_TTL_MS } from '../services/tokens';

export class AtualizarSessaoUseCase {
    constructor(private users: IUserRepository, private auth: IAuthRepository) {}

    async execute(refreshToken?: string) {

        if (!refreshToken) throw new UnauthorizedError('Refresh token inválido ou expirado');

        const tokenHash = hashRefreshToken(refreshToken);

        const registro = await this.auth.findRefreshToken(tokenHash);

        if (!registro?.expiradoEm || registro.expiradoEm.getTime() <= Date.now()) {
            throw new UnauthorizedError('Refresh token inválido ou expirado');
        }

        const usuario = await this.users.findById(registro.usuarioId);

        if (!usuario) throw new UnauthorizedError('Sessão inválida');

        const sessao = criarSessao(usuario);

        const atualizou = await this.auth.rotateRefreshToken(tokenHash, {
            usuarioId: usuario.id,
            token_hash: hashRefreshToken(sessao.refreshToken),
            expiradoEm: new Date(Date.now() + REFRESH_TTL_MS),
        });

        if (!atualizou) throw new UnauthorizedError('Refresh token inválido ou expirado');
        
        return sessao;
    }
}
