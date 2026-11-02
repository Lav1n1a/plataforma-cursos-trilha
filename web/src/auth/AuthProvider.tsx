import { useEffect, useState, type ReactNode } from "react"
import { AuthContext } from "./AuthContext"
import type { Sessao } from "./types"
import { renovarSessao } from "./authApi";

export function AuthProvider({ children }: { children: ReactNode }) {

  const [sessao, setSessao] = useState<Sessao | null>(null);

  const [ loading, setLoading ] = useState(false);

  const [erroSessao, setErroSessao] = useState<string | null>(null)

  const BuscarRenovacaoSessao = async () => {

    setLoading(true);
    setErroSessao(null);
    
    try {
      
      const temSessao = await renovarSessao();

      temSessao ? setSessao(temSessao) : setSessao(null);


    } catch (error) {

        setErroSessao(
          error instanceof Error
            ? error.message
            : "Não foi possível recuperar a sessão."
        )
          
    } finally {

      setLoading(false);

    }

  }

  useEffect(() => {
    BuscarRenovacaoSessao()
  }, [loading])

  return (
    <AuthContext.Provider value={{
      sessao,
      setSessao,
      loading,
      erroSessao,
      BuscarRenovacaoSessao,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
