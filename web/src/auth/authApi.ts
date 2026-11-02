import type { Sessao } from "./types"

export async function renovarSessao(): Promise<Sessao | null> {
  const resposta = await fetch("http://localhost:3333/auth/refresh", {
    method: "POST",
    credentials: "include", 
  })

  if (resposta.status === 401) return null

  if (!resposta.ok) {
    throw new Error("Não foi possível recuperar a sessão. Tente novamente.")
  }

  const resultado = await resposta.json()
  if (typeof resultado.accessToken !== "string" || !resultado.accessToken ||
      typeof resultado.user?.nome !== "string" || typeof resultado.user?.email !== "string") {
    throw new Error("O servidor não retornou os dados da sessão.")
  }

  return resultado
}
