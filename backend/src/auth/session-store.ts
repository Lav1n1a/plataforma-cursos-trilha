import session from 'express-session';
import type { Prisma } from '@prisma/client';
import { prisma } from '../data/prisma';

export class PrismaSessionStore extends session.Store {
  get(sid: string, callback: (error: unknown, value?: session.SessionData | null) => void) {
    prisma.authSession.findUnique({ where: { sid } }).then(async (row) => {
      if (!row || row.expiresAt <= new Date()) {
        if (row) await prisma.authSession.deleteMany({ where: { sid, expiresAt: { lte: new Date() } } });
        return callback(null, null);
      }
      callback(null, row.data as unknown as session.SessionData);
    }).catch(callback);
  }
  set(sid: string, value: session.SessionData, callback: (error?: unknown) => void = () => {}) {
    const data = JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
    const expiresAt = new Date(value.cookie.expires ?? Date.now() + 60 * 60 * 1000);
    prisma.authSession.upsert({ where: { sid }, create: { sid, data, expiresAt }, update: { data, expiresAt } })
      .then(() => callback()).catch(callback);
  }
  destroy(sid: string, callback: (error?: unknown) => void = () => {}) {
    prisma.authSession.deleteMany({ where: { sid } }).then(() => callback()).catch(callback);
  }
  touch(sid: string, value: session.SessionData, callback: (error?: unknown) => void = () => {}) {
    const expiresAt = new Date(value.cookie.expires ?? Date.now() + 60 * 60 * 1000);
    prisma.authSession.updateMany({ where: { sid }, data: { expiresAt } }).then(() => callback()).catch(callback);
  }
  async prune() {
    await prisma.authSession.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  }
}
