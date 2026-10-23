export interface SalvarRefreshTokenDTO {
    usuarioId: number;
    token_hash: string;
    expiradoEm: Date;
}
