import { Request, Response } from 'express';
import { AutenticarUsuarioUseCase } from "../useCases/AutenticarUsuario";

export class AutenticarUsuarioController {

    constructor(
        private useCase: AutenticarUsuarioUseCase
    ) {}

    async handle(req: Request, res: Response) {

        const data = { email: req.body.email, senha: req.body.senha };

        const token = await this.useCase.execute(data);

        return res.json({token});

    }


}