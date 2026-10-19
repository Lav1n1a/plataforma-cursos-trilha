import type { ErrorRequestHandler } from 'express';
import { ApiError } from '../helpers/api-erros';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ApiError) {
        res.status(error.statusCode).json({ message: error.message });
        return;
    }

    console.error(error);
    res.status(500).json({ message: "Não foi possível realizar a operação. Tente novamente." });
};
