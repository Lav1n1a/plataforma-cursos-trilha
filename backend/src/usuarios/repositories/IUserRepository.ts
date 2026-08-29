import { Usuario } from "@prisma/client";
import { CriarUsuarioDTO } from "../dtos/CriarUsuarioDTO"
import { UsuarioDTO } from "../dtos/UsuarioDTO";

export interface IUserRepository {

    createUser(data: CriarUsuarioDTO): Promise<UsuarioDTO>;
    
    findByEmail(email: string): Promise<Usuario | null> ;

    findById(id: number): Promise<Usuario | null> ;
}