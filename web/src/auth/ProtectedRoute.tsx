import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "./useAuth"

export function ProtectedRoute() {
 
  const {
    sessao,
    loading,
    erroSessao,
    BuscarRenovacaoSessao,
  } = useAuth();

  if (loading) {
    return <p>Verificando sua sessão…</p>
  }

  if (erroSessao) {
  return (
    <div>
      <p role="alert">{erroSessao}</p>

      <button
        type="button"
        onClick={() => void BuscarRenovacaoSessao()}
      >
        Tentar novamente
      </button>
    </div>
  )
}

  if (!sessao) return <Navigate to="/login" replace />

  return <Outlet />
}
