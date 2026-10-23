import type { AuthUserDTO } from "../../auth/dtos/Auth";

declare global {
    namespace Express {
        interface Request {
            user?: AuthUserDTO;
        }
    }
}

export {};
