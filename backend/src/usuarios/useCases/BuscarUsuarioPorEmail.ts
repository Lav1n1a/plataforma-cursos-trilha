import { IUserRepository } from "../repositories/IUserRepository";

export class BuscarUsuarioPorEmailUseCase {

    constructor(
        private repo: IUserRepository
    ){}

    async execute(email: string): Promise<any>{

        return await this.repo.findByEmail(email);

    }

}