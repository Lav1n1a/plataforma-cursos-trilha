import type { CookieOptions, Request } from 'express';
import { REFRESH_TTL_MS } from '../services/tokens';

export function refreshCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/auth',
        maxAge: REFRESH_TTL_MS,
    };
}

export function readRefreshCookie(req: Request): string | undefined {

    const value = req.headers.cookie?.split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith('refresh_token='))
        ?.slice('refresh_token='.length);
        
    return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
}

export function clearRefreshCookieOptions(): CookieOptions {
    const { maxAge, ...options } = refreshCookieOptions();
    return options;
}
