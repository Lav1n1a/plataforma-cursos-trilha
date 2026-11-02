import { createContext, type Dispatch, type SetStateAction } from "react"
import type { Sessao } from "./types"

type AuthContextValue = {
  sessao: Sessao | null
  setSessao: Dispatch<SetStateAction<Sessao | null>>;
  loading: boolean,
  erroSessao: string | null
  BuscarRenovacaoSessao: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
