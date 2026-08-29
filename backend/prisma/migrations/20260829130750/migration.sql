-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ATIVO', 'INATIVO');

-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('ADMIN', 'PARTICIPANTE', 'INSTRUTOR');

-- CreateEnum
CREATE TYPE "InscricaoStatus" AS ENUM ('CONFIRMADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "CertificadoLado" AS ENUM ('FRENTE', 'VERSO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'PARTICIPANTE',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'ATIVO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificadoModeloId" INTEGER,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modulo" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,

    CONSTRAINT "modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video" (
    "id" SERIAL NOT NULL,
    "moduloId" INTEGER NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "duracaoSegundos" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL,
    "certificadoModeloId" INTEGER,

    CONSTRAINT "video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscricao" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "status" "InscricaoStatus" NOT NULL DEFAULT 'CONFIRMADA',
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inscricao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscricaoProgresso" (
    "id" SERIAL NOT NULL,
    "inscricaoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "videoId" INTEGER NOT NULL,
    "segundosAssistidos" INTEGER NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InscricaoProgresso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificadoModelo" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "lado" "CertificadoLado" NOT NULL,
    "key" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CertificadoModelo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificado" (
    "id" SERIAL NOT NULL,
    "cursoId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "modeloCertificadoId" INTEGER NOT NULL,
    "cargaHorariaMinutos" INTEGER NOT NULL,
    "numeroCertificado" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Certificado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_numeroCertificado_key" ON "Certificado"("numeroCertificado");

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_certificadoModeloId_fkey" FOREIGN KEY ("certificadoModeloId") REFERENCES "CertificadoModelo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modulo" ADD CONSTRAINT "modulo_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_moduloId_fkey" FOREIGN KEY ("moduloId") REFERENCES "modulo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_certificadoModeloId_fkey" FOREIGN KEY ("certificadoModeloId") REFERENCES "CertificadoModelo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscricao" ADD CONSTRAINT "Inscricao_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscricao" ADD CONSTRAINT "Inscricao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoProgresso" ADD CONSTRAINT "InscricaoProgresso_inscricaoId_fkey" FOREIGN KEY ("inscricaoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_cursoId_fkey" FOREIGN KEY ("cursoId") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_modeloCertificadoId_fkey" FOREIGN KEY ("modeloCertificadoId") REFERENCES "CertificadoModelo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
