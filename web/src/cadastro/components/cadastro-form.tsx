import { Link } from "react-router-dom"

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
import { z } from "zod"
import { cadastrarUsuario } from "@/services/usuarios"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

const createUserFormSchema = z
  .object({
    nome: z.string().trim().min(1, "Nome é obrigatório"),
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
    confirmeSenha: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.senha === data.confirmeSenha, {
    path: ["confirmeSenha"],
    message: "As senhas não coincidem",
  })

type cadastroUsuario = z.infer<typeof createUserFormSchema>

export function CadastroForm() {

  const { register, handleSubmit, formState: { errors } } = useForm<cadastroUsuario>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      nome: "",
      email: "",
      senha: "",
      confirmeSenha: "",
    },
  })

  const onSubmit = async (data: cadastroUsuario) => {
    try {
      await cadastrarUsuario(data)
      toast.success("Conta criada com sucesso!")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível realizar o cadastro."
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crie sua conta</CardTitle>
        <CardDescription>Preencha seus dados para se cadastrar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nome">Nome</FieldLabel>
              <Input
                id="nome"
                placeholder="Ex: Maria Luiza"
                aria-invalid={!!errors.nome}
                {...register("nome")}
              />
              <FieldError errors={[errors.nome]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="senha">Senha</FieldLabel>
              <Input
                id="senha"
                type="password"
                aria-invalid={!!errors.senha}
                {...register("senha")}
              />
              <FieldError errors={[errors.senha]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirmeSenha">Confirmar senha</FieldLabel>
              <Input
                id="confirmeSenha"
                type="password"
                aria-invalid={!!errors.confirmeSenha}
                {...register("confirmeSenha")}
              />
              <FieldError errors={[errors.confirmeSenha]} />
            </Field>
            <Field>
              <Button type="submit">Criar conta</Button>
              <FieldDescription className="text-center">
                Já possui uma conta? <Link to="/login">Entrar</Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
