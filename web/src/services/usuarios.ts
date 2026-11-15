export type Usuario = {
    nome: string;
    email: string;
    senha: string;
}

export async function cadastrarUsuario(data: Usuario) {
  return await fetch("/api/cadastro", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}

export async function LoginUsuario(data: Omit<Usuario, 'nome'>) {
   return await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
