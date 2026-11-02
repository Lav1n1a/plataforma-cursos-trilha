import { useContext } from "react"
import { AuthContext } from "./AuthContext"

export function useAuth() {
  
  const auth = useContext(AuthContext)

  if (auth === undefined) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider")
  }

  return auth
}
