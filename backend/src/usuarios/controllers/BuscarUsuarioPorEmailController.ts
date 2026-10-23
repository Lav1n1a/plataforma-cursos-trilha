import { Request, Response } from 'express';
import { BuscarUsuarioPorEmailUseCase } from "../useCases/BuscarUsuarioPorEmail";

export class BuscarUsuarioPorEmailController {

    constructor(
        private useCase: BuscarUsuarioPorEmailUseCase
    ){}

    async handle(req: Request, res: Response){
        
        const email = req.query.email;
        if (typeof email !== 'string' || !email) {
            return res.status(400).json({ message: 'Email é obrigatório' });
        }

       const data = await this.useCase.execute(email);

       return res.status(200).json(data)

    }
}
