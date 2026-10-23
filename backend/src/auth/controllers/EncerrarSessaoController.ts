import type { Request, Response } from 'express';
import type { EncerrarSessaoUseCase } from '../useCases/EncerrarSessao';
import { clearRefreshCookieOptions, readRefreshCookie } from '../http/refreshCookie';

export class EncerrarSessaoController {
    constructor(private useCase: EncerrarSessaoUseCase) {}

    async handle(req: Request, res: Response) {

        await this.useCase.execute(readRefreshCookie(req));

        res.clearCookie('refresh_token', clearRefreshCookieOptions());

        res.setHeader('Cache-Control', 'no-store');
        
        return res.status(204).send();
    }
}
