
export async function requisicaoProtegida(
  caminho: string,
  accessToken: string,
  opcoes: RequestInit = {},
) {
  const headers = new Headers(opcoes.headers)
  headers.set("Authorization", `Bearer ${accessToken}`)

  const resposta = await fetch(`http://localhost:3333${caminho}`, {
    ...opcoes,
    headers,
  })

  return resposta
}
