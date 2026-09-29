import type { RequestHandler } from 'express';
import { AuthError } from './errors';
import { cookieOptions, destroySession, sessionCookieName } from '../middlewares/oidc-session';

export function serializeSession(): RequestHandler {
  const pending = new Map<string, Promise<void>>();
  return async (req, res, next) => {
    const sid = req.sessionID;
    const previous = pending.get(sid) ?? Promise.resolve();
    let release!: () => void;
    const current = new Promise<void>(resolve => { release = resolve; });
    pending.set(sid, current);
    let released = false;
    const unlock = () => {
      if (released) return;
      released = true;
      release();
      if (pending.get(sid) === current) pending.delete(sid);
    };


    res.once('finish', unlock);

    let persisted = false;
    res.once('close', () => { if (persisted) unlock(); });
    const end = res.end;
    res.end = ((...args: unknown[]) => {
      const complete = (error?: unknown) => {
        persisted = true;
        res.end = end;
        if (error) {
          if (res.destroyed) return unlock();
          return next(error);
        }
        if (res.destroyed) {
          unlock();
          const callback = args.at(-1);
          if (typeof callback === 'function') callback();
          return;
        }
        Reflect.apply(end, res, args);
      };
      if (req.session?.auth || req.session?.state) req.session.save(complete);
      else complete();
      return res;
    }) as typeof res.end;
    await previous;
    if (res.destroyed) return unlock();
    try {
      const stored = await new Promise<import('express-session').SessionData | null | undefined>((resolve, reject) => {
        req.sessionStore.get(sid, (error, value) => error ? reject(error) : resolve(value));
      });
      if (stored) req.sessionStore.createSession(req, stored);
      else if (req.session.auth || req.session.state) {
        // Não ressuscita uma sessão encerrada por outra requisição.
        await destroySession(req);
        res.clearCookie(sessionCookieName, cookieOptions);
        throw new AuthError(401, 'Sessão encerrada. Entre novamente.');
      }
      next();
    } catch (error) { next(error); }
  };
}
