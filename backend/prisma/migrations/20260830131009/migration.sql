/*
  Warnings:

  - You are about to drop the column `cursoId` on the `matriculas_progresso` table. All the data in the column will be lost.
  - You are about to drop the column `usuarioId` on the `matriculas_progresso` table. All the data in the column will be lost.
  - You are about to drop the column `certificadoModeloId` on the `videos` table. All the data in the column will be lost.
  - You are about to drop the column `cursoId` on the `videos` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "matriculas_progresso" DROP CONSTRAINT "matriculas_progresso_cursoId_fkey";

-- DropForeignKey
ALTER TABLE "videos" DROP CONSTRAINT "videos_certificadoModeloId_fkey";

-- DropForeignKey
ALTER TABLE "videos" DROP CONSTRAINT "videos_cursoId_fkey";

-- AlterTable
ALTER TABLE "matriculas_progresso" DROP COLUMN "cursoId",
DROP COLUMN "usuarioId";

-- AlterTable
ALTER TABLE "videos" DROP COLUMN "certificadoModeloId",
DROP COLUMN "cursoId";

-- AddForeignKey
ALTER TABLE "matriculas_progresso" ADD CONSTRAINT "matriculas_progresso_matriculaId_fkey" FOREIGN KEY ("matriculaId") REFERENCES "matriculas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
