import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

import LoginPage from "./login/page"

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" />
        <Route path="/portal" />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}