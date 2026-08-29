import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { BadRequestError } from "@/helpers/api-erros";
import { IUserRepository } from "../usuarios/repositories/IUserRepository";

export class AuthMiddleware {
  constructor(private repo: IUserRepository) {}

  public execute = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;

    console.log(authorization)

    if (!authorization) {
      throw new BadRequestError("Não possui autorização");
    }

    const token = authorization.split(" ")[1];
    const jwtSecret = process.env.JWT_SECRET;

    console.log(token)

    if (!jwtSecret) {
      throw new Error("JWT_SECRET não configurado");
    }

    const { id } = jwt.verify(token, jwtSecret) as JwtPayload;

     console.log(id)

    const user = await this.repo.findById(id);

    if (!user) {
      throw new BadRequestError("Usuário não encontrado!");
    }

    req.user = {
      id: id,
      role: user.role,
    };

    next();
  };
}