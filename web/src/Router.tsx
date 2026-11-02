import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

import LoginPage from "./login/page"
import SignupPage from "./cadastro/page"
import PortalPage from "./portal/page"
import { ProtectedRoute } from "./auth/ProtectedRoute"

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<SignupPage />} />
        <Route path="/admin/*" />
        <Route element={<ProtectedRoute />}>
          <Route path="/portal" element={<PortalPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
