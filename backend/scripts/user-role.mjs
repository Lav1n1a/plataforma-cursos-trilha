import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const [email, perfil] = process.argv.slice(2);
if (!email || !['ADMIN', 'INSTRUTOR', 'PARTICIPANTE'].includes(perfil)) {
  console.error('Uso: npm run user:role -- email@exemplo.com ADMIN|INSTRUTOR|PARTICIPANTE');
  process.exit(1);
}
const prisma = new PrismaClient();
try {
  const user = await prisma.usuario.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user?.oidcSub) throw new Error('Faça primeiro o login OIDC desse usuário.');
  const updated = await prisma.usuario.update({ where: { id: user.id }, data: { perfil },
    select: { id: true, nome: true, perfil: true } });
  console.log(updated);
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Falha ao alterar perfil.');
  process.exitCode = 1;
} finally { await prisma.$disconnect(); }
