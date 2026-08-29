/*
  Warnings:

  - You are about to drop the `Certificado` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CertificadoModelo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Inscricao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `InscricaoProgresso` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Usuario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `modulo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `video` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MatriculaStatus" AS ENUM ('CONFIRMADA', 'CANCELADA');

-- DropForeignKey
ALTER TABLE "Certificado" DROP CONSTRAINT "Certificado_cursoId_fkey";

-- DropForeignKey
ALTER TABLE "Certificado" DROP CONSTRAINT "Certificado_modeloCertificadoId_fkey";

-- DropForeignKey
ALTER TABLE "Certificado" DROP CONSTRAINT "Certificado_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "Inscricao" DROP CONSTRAINT "Inscricao_cursoId_fkey";

-- DropForeignKey
ALTER TABLE "Inscricao" DROP CONSTRAINT "Inscricao_usuarioId_fkey";

-- DropForeignKey
ALTER TABLE "InscricaoProgresso" DROP CONSTRAINT "InscricaoProgresso_inscricaoId_fkey";

-- DropForeignKey
ALTER TABLE "cursos" DROP CONSTRAINT "cursos_certificadoModeloId_fkey";

-- DropForeignKey
ALTER TABLE "modulo" DROP CONSTRAINT "modulo_cursoId_fkey";

-- DropForeignKey
ALTER TABLE "video" DROP CONSTRAINT "video_certificadoModeloId_fkey";

-- DropForeignKey
ALTER TABLE "video" DROP CONSTRAINT "video_cursoId_fkey";

-- DropForeignKey
ALTER TABLE "video" DROP CONSTRAINT "video_moduloId_fkey";

-- DropTable
DROP TABLE "Certificado";

-- DropTable
DROP TABLE "CertificadoModelo";

-- DropTable
DROP TABLE "Inscricao";

-- DropTable
DROP TABLE "InscricaoProgresso";

-- DropTable
DROP TABLE "Usuario";

-- DropTable
DROP TABLE "modulo";

-- DropTable
DROP TABLE "video";

-- DropEnum
DROP TYPE "InscricaoStatus";

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'PARTICIPANTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modulos" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "modulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" SERIAL NOT NULL,
    "moduloId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "duracaoSegundos" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    "certificadoModeloId" INTEGER,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matriculas" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "status" "MatriculaStatus" NOT NULL DEFAULT 'CONFIRMADA',
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matriculas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matriculas_progresso" (
    "id" SERIAL NOT NULL,
    "matriculaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "segundosAssistidos" INTEGER NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cursoId" INTEGER,

    CONSTRAINT "matriculas_progresso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificados_modelo" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "lado" "CertificadoLado" NOT NULL,
    "key" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificados_modelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificados" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "modeloCertificadoId" INTEGER NOT NULL,
    "cargaHorariaMinutos" INTEGER NOT NULL,
    "numeroCertificado" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificados_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "certificados_numeroCertificado_key" ON "certificados"("numeroCertificado");

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_certificadoModeloId_fkey" FOREIGN KEY ("certificadoModeloId") REFERENCES "certificados_modelo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modulos" ADD CONSTRAINT "modulos_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "modulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_certificadoModeloId_fkey" FOREIGN KEY ("certificadoModeloId") REFERENCES "certificados_modelo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas" ADD CONSTRAINT "matriculas_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas_progresso" ADD CONSTRAINT "matriculas_progresso_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "videos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matriculas_progresso" ADD CONSTRAINT "matriculas_progresso_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados" ADD CONSTRAINT "certificados_modeloCertificadoId_fkey" FOREIGN KEY ("modeloCertificadoId") REFERENCES "certificados_modelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
