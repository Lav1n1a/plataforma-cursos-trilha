# Plataforma de Cursos — Trilha (Em desenvolvimento)

A Plataforma de Cursos — Trilha tem como objetivo disponibilizar um ambiente para gestão e realização de cursos online, permitindo o gerenciamento de cursos, usuários, matrículas, progresso e certificados.

A plataforma é composta por uma área administrativa, destinada ao gerenciamento do sistema, e um portal destinado aos participantes, onde é possível visualizar cursos, realizar matrículas, acompanhar o progresso das aulas e acessar os certificados obtidos.

# Backend API

Backend desenvolvido em **Node.js + TypeScript**, utilizando **Express** para construção da API e **Prisma** para comunicação com o banco de dados.

## Tecnologias

* **Node.js**
* **TypeScript**
* **Express 5**
* **Prisma ORM**
* **JWT** — autenticação baseada em tokens
* **Argon2** — hashing de senhas
* **CORS**
* **Dotenv**
* **TSX** — execução do TypeScript em desenvolvimento


## Pré-requisitos

Antes de começar, você precisa ter instalado:

* [Node.js](https://nodejs.org/)
* npm
* Um banco de dados compatível com o Prisma

## Instalação

Entre na pasta do projeto:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:


## Banco de dados

Após configurar o `DATABASE_URL`, execute as migrações do Prisma:

```bash
npx prisma migrate dev
```

Para gerar o Prisma Client:

```bash
npx prisma generate
```

## Executando o projeto

### Desenvolvimento

Para iniciar o servidor em modo de desenvolvimento:

```bash
npm run dev
```

O projeto utiliza `tsx watch`, portanto alterações no código reiniciam o servidor automaticamente.

### Build

Para compilar o projeto TypeScript:

```bash
npm run build
```

Os arquivos compilados serão gerados na pasta `dist`.

### Produção

Após realizar o build:

```bash
npm start
```

## Scripts

| Comando         | Descrição                             |
| --------------- | ------------------------------------- |
| `npm run dev`   | Executa o servidor em desenvolvimento |
| `npm run build` | Compila o TypeScript                  |
| `npm start`     | Executa a versão compilada            |

## Estrutura do projeto

```text
backend/
├── src/
│   ├── server.ts
│   └── ...
├── prisma/
│   └── schema.prisma
├── .env
├── .gitignore
├── package.json
└── tsconfig.json
```
