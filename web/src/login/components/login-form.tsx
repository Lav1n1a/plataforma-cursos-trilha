import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { KeyRound } from "lucide-react"
import { Link } from "react-router-dom"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

const loginUserFormSchema = z.object({
    email: z
      .string()
      .trim()
      .min(1, "O email é obrigatório")
      .email("Digite um e-mail válido"),
    senha: z
      .string()
      .min(1, "A senha é obrigatória")
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .regex(
        /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).*$/,
        "A senha deve conter maiúscula, minúscula e número"
      ),
  });

type LoginUser = z.infer<typeof loginUserFormSchema>

export function LoginForm() {

  const { register, handleSubmit, formState: { errors } } = useForm<LoginUser>({
    resolver: zodResolver(loginUserFormSchema),
    defaultValues: {
      email: "",
      senha: "",
    },
  })

  const onSubmit = async (data: LoginUser) => {
     
    }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Entre com a sua conta</CardTitle>
          <CardDescription>
            Entre com email e senha ou escolha um provedor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                 <Input
                    id="email"
                    type="email"
                    placeholder="exemplo@email.com"
                    aria-invalid={!!errors.email}
                    {...register("email")}
                  />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Senha</FieldLabel>
                      <Input
                      id="senha"
                      type="password"
                      aria-invalid={!!errors.senha}
                      {...register("senha")}
                    />
                </div>
                <Input id="password" type="password" required />
              </Field>
              <Field>
                <Button type="submit">Login</Button>
                <FieldDescription className="text-center">
                  Não possui uma conta? <Link to="/cadastro">Cadastre-se</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
          <div className="my-6 flex items-center gap-3" aria-hidden="true">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">ou continue com</span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid gap-3">
            <Button type="button" variant="outline" className="h-10 w-full gap-3">
              <GoogleIcon />
              <span>Continuar com Google</span>
            </Button>
            <Button type="button" variant="outline" className="h-10 w-full gap-3">
              <KeyRound aria-hidden="true" className="size-4" />
              <span>Continuar com Keycloak</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-4">
      <path fill="#4285F4" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.655 29.28 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.05 0 19.5-7.5 19.5-20 0-1.341-.138-2.651-.389-3.917z" />
      <path fill="#34A853" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#FBBC05" d="M24 44c5.184 0 9.538-1.713 12.717-4.65l-5.869-4.962C29.238 35.786 26.891 36 24 36c-5.258 0-9.713-3.535-11.291-8.294l-6.57 5.062C9.286 39.348 16.02 44 24 44z" />
      <path fill="#EA4335" d="M43.611 20.083H42V20H24v8h11.303a12.045 12.045 0 0 1-4.455 5.388l5.869 4.962C40.535 34.755 43.5 29.8 43.5 24c0-1.341-.138-2.651-.389-3.917z" />
    </svg>
  )
}
