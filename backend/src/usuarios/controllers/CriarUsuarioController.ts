import { Request, Response } from 'express';
import { CriarUsuarioUseCase } from "../useCases/CriarUsuarioUseCase";

export class CriarUsuarioController {

    constructor(
        private useCase: CriarUsuarioUseCase
    ) {}

    async handle(req: Request, res: Response) {

        const data = req.body;

        await this.useCase.execute(data);

        return res.status(201).json({ message: "Usuário criado com sucesso" });
    }


}