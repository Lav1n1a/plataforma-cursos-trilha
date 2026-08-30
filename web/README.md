# Frontend Web — Plataforma de Cursos

Frontend da Plataforma de Cursos — Trilha. A aplicação será utilizada por administradores e participantes para acessar cursos, acompanhar o progresso, realizar matrículas e consultar certificados.

## Tecnologias

- **React 19** — construção da interface
- **TypeScript** — tipagem estática
- **Vite** — desenvolvimento e build da aplicação
- **React Router DOM** — gerenciamento de rotas
- **TanStack React Query** — gerenciamento de requisições e dados assíncronos
- **React Hook Form** — gerenciamento de formulários
- **Zod** — validação de dados
- **Tailwind CSS v4** — estilização
- **shadcn/ui** — componentes de interface reutilizáveis
- **Base UI** — biblioteca base dos componentes do shadcn/ui
- **Lucide** — ícones da interface
- **JWT Decode** — leitura de informações do token JWT
- **ESLint** — análise e padronização do código

## Pré-requisitos

- [Node.js](https://nodejs.org/) — versão compatível com o projeto
- npm

## Instalação

A partir da raiz do repositório, entre na pasta do frontend:

```bash
cd web
```

Instale as dependências:

```bash
npm install
```

## Desenvolvimento

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O Vite exibirá no terminal o endereço local da aplicação, normalmente `http://localhost:5173`.

## Scripts disponíveis

```bash
npm run dev      # inicia o servidor de desenvolvimento
npm run build    # verifica o TypeScript e gera o build de produção
npm run lint     # executa o ESLint
npm run preview  # visualiza localmente o build de produção
```

## Shadcn/ui

O projeto utiliza o preset **Nova**, Tailwind CSS v4 e componentes baseados em **Base UI**. A configuração está no arquivo `components.json`.

Para adicionar um novo componente:

```bash
npx shadcn@latest add button
```

Os componentes são criados em `src/components/ui`.

## Alias de importação

O alias `@` aponta para a pasta `src`, permitindo imports mais simples:

```tsx
import { Button } from '@/components/ui/button'
```

Essa configuração está definida no `tsconfig.json`, `tsconfig.app.json` e `vite.config.ts`.

## Estrutura principal

```text
web/
├── public/              # arquivos públicos
├── src/
│   ├── assets/          # imagens e demais recursos
│   ├── components/      # componentes reutilizáveis
│   ├── App.tsx          # componente principal
│   ├── index.css        # estilos globais e Tailwind
│   └── main.tsx         # ponto de entrada da aplicação
├── components.json      # configuração do shadcn/ui
├── package.json
├── tsconfig.json
└── vite.config.ts
```
