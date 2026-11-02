import { Router } from "./Router"
import { Toaster } from "sonner"
import { AuthProvider } from "./auth/AuthProvider"


function App() {

  return (
    <AuthProvider>
      <Router />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  )
}

export default App
