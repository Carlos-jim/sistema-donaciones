-- Sync DB schema with prisma/schema.prisma
-- Several tables, columns, enums and FKs declared in the schema were missing
-- in the live database, causing P2022 ("column does not exist") errors when
-- running dashboard queries (e.g. prisma.medicamento.findMany on /dashboard).

-- CreateEnum
CREATE TYPE "TiempoEspera" AS ENUM ('BAJO', 'MEDIO', 'ALTO');

-- AlterEnum
ALTER TYPE "EstadoDonacion" ADD VALUE 'RECIBIDA';

-- DropForeignKey
ALTER TABLE "solicitud_medicamentos" DROP CONSTRAINT "solicitud_medicamentos_donacionMedicamentoId_fkey";

-- AlterTable
ALTER TABLE "donaciones" ADD COLUMN     "codigo" TEXT,
ADD COLUMN     "direccion" JSONB,
ADD COLUMN     "donationPhotoUrl" TEXT;

-- AlterTable
ALTER TABLE "farmacias" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "password" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "medicamentos" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "categoriaId" TEXT;

-- AlterTable
ALTER TABLE "solicitud_medicamentos" ADD COLUMN     "fechaModificacionPrioridad" TIMESTAMP(3),
ADD COLUMN     "prioridadModificadaPorId" TEXT,
ADD COLUMN     "prioridadOriginal" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "solicitudes" ADD COLUMN     "approvalDate" TIMESTAMP(3),
ADD COLUMN     "approvalInstitution" TEXT,
ADD COLUMN     "aprobadoPorEnteId" TEXT,
ADD COLUMN     "assignedDate" TIMESTAMP(3),
ADD COLUMN     "codigo" TEXT,
ADD COLUMN     "deliveryConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "direccion" JSONB,
ADD COLUMN     "donanteAsignadoId" TEXT,
ADD COLUMN     "farmaciaConfirmada" BOOLEAN,
ADD COLUMN     "farmaciaEntregaId" TEXT,
ADD COLUMN     "pickupConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "receptionConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "recipePhotoUrl" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "requiresPrescription" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tiempoEspera" "TiempoEspera" NOT NULL DEFAULT 'BAJO';

-- AlterTable
ALTER TABLE "usuarios_comunes" DROP COLUMN "direccion",
ADD COLUMN     "direccion" JSONB;

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_medicamentos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "icono" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "categorias_medicamentos_nombre_key" ON "categorias_medicamentos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "donaciones_codigo_key" ON "donaciones"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "farmacias_email_key" ON "farmacias"("email");

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_codigo_key" ON "solicitudes"("codigo");

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios_comunes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_aprobadoPorEnteId_fkey" FOREIGN KEY ("aprobadoPorEnteId") REFERENCES "entes_salud"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_donanteAsignadoId_fkey" FOREIGN KEY ("donanteAsignadoId") REFERENCES "usuarios_comunes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitudes" ADD CONSTRAINT "solicitudes_farmaciaEntregaId_fkey" FOREIGN KEY ("farmaciaEntregaId") REFERENCES "farmacias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicamentos" ADD CONSTRAINT "medicamentos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_medicamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_medicamentos" ADD CONSTRAINT "solicitud_medicamentos_donacionMedicamentoId_fkey" FOREIGN KEY ("donacionMedicamentoId") REFERENCES "donacion_medicamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solicitud_medicamentos" ADD CONSTRAINT "solicitud_medicamentos_prioridadModificadaPorId_fkey" FOREIGN KEY ("prioridadModificadaPorId") REFERENCES "entes_salud"("id") ON DELETE SET NULL ON UPDATE CASCADE;
