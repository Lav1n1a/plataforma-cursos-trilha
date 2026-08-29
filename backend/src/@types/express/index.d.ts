import type { AuthUserDTO } from "../../usuarios/dtos/Auth";

declare global {
    namespace Express {
        interface Request {
            user?: AuthUserDTO;
        }
    }
}

export {};