export type Usuario = {
    nome: string;
    email: string;
    senha: string;
}

export async function cadastrarUsuario(data: Usuario) {
  const response = await fetch("http://localhost:3333/cadastro", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const dados = await response.json();

  if (!response.ok) {
    throw new Error(dados.message ?? "Não foi possível realizar o cadastro.");
  }

  return dados;
}