/*
  Warnings:

  - You are about to drop the column `oidcIssuer` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `oidcSub` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the `auth_sessions` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `senha` on table `usuarios` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "usuarios_oidcIssuer_oidcSub_key";

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "oidcIssuer",
DROP COLUMN "oidcSub",
ALTER COLUMN "senha" SET NOT NULL;

-- DropTable
DROP TABLE "auth_sessions";
