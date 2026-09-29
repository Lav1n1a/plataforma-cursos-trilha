ALTER TABLE "usuarios" ALTER COLUMN "senha" DROP NOT NULL;
ALTER TABLE "usuarios" ADD COLUMN "oidcIssuer" TEXT, ADD COLUMN "oidcSub" TEXT;
CREATE UNIQUE INDEX "usuarios_oidcIssuer_oidcSub_key" ON "usuarios"("oidcIssuer", "oidcSub");
CREATE TABLE "auth_sessions" (
  "sid" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX "auth_sessions_expiresAt_idx" ON "auth_sessions"("expiresAt");
