import type { RotateCwSquareIcon } from "lucide-react";

export type Usuario = {
    nome: string;
    email: string;
    senha: string;
}

export async function cadastrarUsuario(data: Usuario) {
  return await fetch("http://localhost:3333/cadastro", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function LoginUsuario(data: Usuario) {
   return await fetch("http://localhost:3333/auth/login", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
