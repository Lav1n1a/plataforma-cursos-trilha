import { Router } from 'express';
import type { AuthUsers } from '../auth/users';
import { requireAdmin, requireSession } from '../auth/require-session';

export function createUsuarioRoutes(users: AuthUsers) {
  const routes = Router();

  routes.post(['/login', '/usuarios'], (_req, res) => {
    res.status(410).json({ message: 'Use /auth/login. Cadastre os usuários no realm trilha do Keycloak.' });
  });
  routes.get('/me', requireSession(users), (req, res) => {
    res.json({ authenticated: true, user: res.locals.user, csrfToken: req.session.auth!.csrfToken });
  });
  routes.get('/admin', requireSession(users), requireAdmin, (_req, res) => {
    res.json({ message: 'Acesso administrativo autorizado.', user: res.locals.user });
  });
  routes.get('/usuarios', requireSession(users), requireAdmin, async (req, res) => {
    if (req.query.email !== undefined && typeof req.query.email !== 'string') {
      return res.status(400).json({ message: 'email deve ser uma string.' });
    }
    return res.json(await users.list(req.query.email as string | undefined));
  });
  return routes;
}
