import type { Request, Response } from 'express';
import { UnauthorizedError } from '../../helpers/api-erros';
import type { AtualizarSessaoUseCase } from '../useCases/AtualizarSessao';
import { clearRefreshCookieOptions, readRefreshCookie, refreshCookieOptions } from '../http/refreshCookie';

export class AtualizarSessaoController {
    constructor(private useCase: AtualizarSessaoUseCase) {}

    async handle(req: Request, res: Response) {

        try {
            const { accessToken, refreshToken, user } = await this.useCase.execute(readRefreshCookie(req));

            res.cookie('refresh_token', refreshToken, refreshCookieOptions());

            res.setHeader('Cache-Control', 'no-store');

            return res.json({ accessToken, user });

        } catch (error) {
            
            if (error instanceof UnauthorizedError) {
                res.clearCookie('refresh_token', clearRefreshCookieOptions());
            }
            throw error;
        }
    }
}
