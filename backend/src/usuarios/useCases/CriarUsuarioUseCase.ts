import { hash } from 'argon2';
import { CriarUsuarioDTO } from "../dtos/CriarUsuarioDTO"
import { IUserRepository } from '../repositories/IUserRepository';
import { BadRequestError } from '@/helpers/api-erros';

export class CriarUsuarioUseCase {

    constructor(
        private repo: IUserRepository
    ) {}

    async execute(data: CriarUsuarioDTO) {

        if (!data?.senha || !data.email) {
            throw new BadRequestError("Senha e email são obrigatórios");
        }

        const emailExistente = await this.repo.findByEmail(data.email);

        if (emailExistente) {
            throw new BadRequestError('Email já cadastrado!');
        }

        const senhaCriptografada = await hash(data.senha);

        await this.repo.createUser({nome: data.nome, email: data.email, senha: senhaCriptografada});

    }

}
