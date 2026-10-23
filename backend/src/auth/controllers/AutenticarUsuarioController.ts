import { Request, Response } from 'express';
import { AutenticarUsuarioUseCase } from "../useCases/AutenticarUsuario";
import { refreshCookieOptions } from "../http/refreshCookie";

export class AutenticarUsuarioController {

    constructor(
        private useCase: AutenticarUsuarioUseCase
    ) {}

    async handle(req: Request, res: Response) {

        const data = { email: req.body?.email, senha: req.body?.senha };

        const { accessToken, refreshToken, user } = await this.useCase.execute(data);

        res.cookie('refresh_token', refreshToken, refreshCookieOptions());
        
        res.setHeader('Cache-Control', 'no-store');

        return res.status(200).json({ accessToken, user });

    }


}
