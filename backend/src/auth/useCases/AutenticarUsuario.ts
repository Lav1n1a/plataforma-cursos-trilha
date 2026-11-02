import { verify } from "argon2";
import { BadRequestError, UnauthorizedError } from "../../helpers/api-erros";
import { LoginUsuarioDTO } from "../dtos/LoginUsuarioDTO";
import { IUserRepository } from "../../usuarios/repositories/IUserRepository";
import { IAuthRepository } from "../repositories/IAuthRepository";
import { criarSessao, hashRefreshToken, REFRESH_TTL_MS } from "../services/tokens";


export class AutenticarUsuarioUseCase {
    constructor(private repo: IUserRepository, private authRepo: IAuthRepository) {}

    async execute(data: LoginUsuarioDTO) {
        
        if (typeof data.email !== "string" || !data.email.trim() ||
            typeof data.senha !== "string" || !data.senha) {
            throw new BadRequestError("Senha e email são obrigatórios");
        }

        const usuario = await this.repo.findByEmail(data.email);

        if (!usuario || !await verify(usuario.senha, data.senha)) {
            throw new UnauthorizedError("Email ou senha inválidos");
        }

        const sessao = criarSessao(usuario);

        await this.authRepo.saveRefreshToken({
            usuarioId: usuario.id,
            token_hash: hashRefreshToken(sessao.refreshToken),
            expiradoEm: new Date(Date.now() + REFRESH_TTL_MS),
        });

        return sessao;
    }
}
