import { Request, Response } from 'express';
import { AutenticarUsuarioUseCase } from "../useCases/AutenticarUsuario";

export class AtualizarUsuarioController {

    constructor(
        private useCase: AutenticarUsuarioUseCase
    ) {}

    async handle(req: Request, res: Response) {

        const data = req.body;

        await this.useCase.execute(data);

        return res.status(200).json();
    }


}

