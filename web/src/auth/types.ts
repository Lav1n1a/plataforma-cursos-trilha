export type Sessao = {
  accessToken: string;
  user: {
    id: number;
    nome: string;
    email: string;
    perfil: "ADMIN" | "PARTICIPANTE" | "INSTRUTOR";
  };
};

