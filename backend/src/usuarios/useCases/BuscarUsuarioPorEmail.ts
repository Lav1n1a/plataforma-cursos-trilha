import { IUserRepository } from "../repositories/IUserRepository";

export class BuscarUsuarioPorEmailUseCase {

    constructor(
        private repo: IUserRepository
    ){}

    async execute(email: string): Promise<any>{

        const usuario = await this.repo.findByEmail(email);

        if (!usuario) return null;
        
        return { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil };

    }

}
