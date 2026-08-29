import { Perfil } from "@prisma/client";

export interface IUsuario {
    id: number;
    nome: string;
    email: string;
    senha: string;
    perfil: Perfil;
    criadoEm: Date
}