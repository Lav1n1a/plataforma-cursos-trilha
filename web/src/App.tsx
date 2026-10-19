import { Router } from "./Router"
import { Toaster } from "sonner"


function App() {

  return (
    <>
      <Router />
      <Toaster position="top-right" richColors />
    </>
  )
}

export default App
