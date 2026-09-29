import { Perfil } from "@prisma/client";

export interface IUsuario {
    id: number;
    nome: string;
    email: string;
    senha: string | null;
    perfil: Perfil;
    criadoEm: Date
}
