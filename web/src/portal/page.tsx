import { BookOpen, CircleCheck } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { useAuth } from "@/auth/useAuth"

export default function PortalPage() {
  const { sessao } = useAuth()
  
  if (!sessao) return null

  return (
    <div className="auth-page-background min-h-svh w-full px-6 py-8 text-left md:px-12">
      <header className="mx-auto flex max-w-3xl items-center gap-3 border-b pb-6">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BookOpen className="size-5" aria-hidden="true" />
        </div>
        <span className="font-medium text-foreground">Trilha</span>
        <span className="ml-auto text-sm text-foreground/60">Minha área</span>
      </header>

      <main className="mx-auto max-w-3xl py-14 md:py-20">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
          <CircleCheck className="size-4" aria-hidden="true" />
          Login realizado com sucesso
        </div>
        <h1 className="!mt-0 !mb-4 !text-3xl !tracking-tight md:!text-4xl">
          Olá, {sessao.user.nome}!
        </h1>
        <p className="max-w-lg text-foreground/70">
          Bem-vindo à Trilha. Este é o seu espaço para aprender e dar os próximos passos.
        </p>

        <Card className="mt-8">
          <CardContent>
            <h2 className="!mb-4 !text-lg">Sua conta</h2>
            <dl className="grid gap-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-foreground/60">Nome</dt>
                <dd className="mt-1 font-medium text-foreground">{sessao.user.nome}</dd>
              </div>
              <div>
                <dt className="text-foreground/60">Email</dt>
                <dd className="mt-1 break-all font-medium text-foreground">{sessao.user.email}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
