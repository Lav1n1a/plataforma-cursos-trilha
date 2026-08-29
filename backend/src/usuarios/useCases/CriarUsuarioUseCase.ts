import { hash, verify } from 'argon2';
import { CriarUsuarioDTO } from "../dtos/CriarUsuarioDTO"
import { IUserRepository } from '../repositories/IUserRepository';

export class CriarUsuarioUseCase {

    constructor(
        private repo: IUserRepository
    ) {}

    async execute(data: CriarUsuarioDTO) {

        try {

            if(!data.senha || !data.email) throw new Error("Senha e email são obrigatórios");

            const senhaCriptografada = await hash(data.senha);

            await this.repo.createUser({nome: data.nome, email: data.email, senha: senhaCriptografada})

        }catch(err){
            
            throw new Error("Nao foi possivel criar o usuario!");
        }

    }

}
