import jwt from "jsonwebtoken";
import { LoginUsuarioDTO } from "../dtos/LoginUsuarioDTO";
import { IUserRepository } from "../repositories/IUserRepository";
import { verify } from 'argon2';

export class AutenticarUsuarioUseCase {
    
    constructor(
         private repo: IUserRepository
    ){}

    async execute(data: LoginUsuarioDTO){

         const usuario = await this.repo.findByEmail(data.email);

        if (!usuario) {
            throw new Error("Email ou senha inválidos");
        }

        const senhaValida = await verify(
            usuario.senha,
            data.senha
        );

        if (!senhaValida) {
            throw new Error("Email ou senha inválidos");
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET não configurado");
        }

        const token = jwt.sign(
            { id: usuario.id, perfil: usuario.perfil },
            jwtSecret,
            {
                expiresIn: "1h",
                algorithm: "HS256"
            }
        );

        return token;


    }
}
