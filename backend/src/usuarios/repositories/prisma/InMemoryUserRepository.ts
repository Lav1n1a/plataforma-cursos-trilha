import { CriarUsuarioDTO } from "@/usuarios/dtos/CriarUsuarioDTO";
import { IUserRepository } from "../IUserRepository";
import BaseRepository from "@/data/repositories/BaseRepository";
import { UsuarioDTO } from "@/usuarios/dtos/UsuarioDTO";
import { Usuario } from "@prisma/client";

export class InMemoryUserRepository extends BaseRepository implements IUserRepository {

    async createUser(data: CriarUsuarioDTO): Promise<UsuarioDTO> {
        return this.prisma.usuario.create({
            data: {
                ...data
            }
        })

    }

    async findByEmail(email: string): Promise<Usuario | null> {
        return this.prisma.usuario.findUnique({
            where: {
                email: email
            }
        })
    }

    async findById(id: number): Promise<Usuario | null> {
        return this.prisma.usuario.findUnique({
            where: {
                id: id
            }
        })
    }

}