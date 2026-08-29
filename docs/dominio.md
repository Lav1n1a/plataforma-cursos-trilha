# Regras de negócio - Plataforma de cursos

### Cursos
- Admin ou instrutor cria e gerencia os cursos.
- Curso é composto por Módulos, e cada Módulo contém Vídeos, em ordem sequencial.
- Usuário pode se matricular em um curso.
- Progresso é registrado por vídeo assistido (ProgressoVideo).
- Certificado só é emitido quando todos os vídeos do curso estão concluídos
  para aquela matrícula.
- Carga horária do certificado é calculada pela soma da duração dos vídeos,
  não digitada manualmente.

  ### Perfis de acesso 
- Todo cadastro no portal nasce com role `PARTICIPANTE`, sem exceção — o
  valor de perfil nunca é aceito vindo do cliente no cadastro.
- `ADMIN` gerencia usuários e cursos.
- `INSTRUTOR` [decisão pendente: gerencia qualquer curso, ou só os que
  ele mesmo criou?]
- Promoção de um usuário para `INSTRUTOR` ou `ADMIN` só pode ser feita
  por um `ADMIN` já existente, via rota administrativa — nunca por
  autopromoção no cadastro.
  -Controle de acesso via perfil, mesma aplicacao.
