
export async function requisicaoProtegida(
  caminho: string,
  accessToken: string,
  opcoes: RequestInit = {},
) {
  const headers = new Headers(opcoes.headers)
  headers.set("Authorization", `Bearer ${accessToken}`)

  const resposta = await fetch(`/api${caminho}`, {
    ...opcoes,
    headers,
  })

  return resposta
}
