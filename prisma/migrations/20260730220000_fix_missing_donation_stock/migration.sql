-- Repair: migration 20260730120000_add_donation_stock was marked applied in
-- _prisma_migrations but its ALTER TABLE statements never landed in the live
-- database, causing P2022 "column does not exist" on any query that selects
-- DonacionMedicamento (e.g. prisma.donacion.findMany({ include: { medicamentos } })).
-- This migration is idempotent and safe on tables that already contain the
-- target columns.

-- 1) DonacionMedicamento.cantidadDisponible (NOT NULL, backfilled from cantidad)
ALTER TABLE "donacion_medicamentos"
  ADD COLUMN IF NOT EXISTS "cantidadDisponible" INTEGER;

UPDATE "donacion_medicamentos"
  SET "cantidadDisponible" = "cantidad"
  WHERE "cantidadDisponible" IS NULL;

ALTER TABLE "donacion_medicamentos"
  ALTER COLUMN "cantidadDisponible" SET NOT NULL;

-- 2) SolicitudMedicamento.donacionMedicamentoId (nullable, indexed, FK to donacion_medicamentos)
ALTER TABLE "solicitud_medicamentos"
  ADD COLUMN IF NOT EXISTS "donacionMedicamentoId" TEXT;

ALTER TABLE "solicitud_medicamentos"
  ADD COLUMN IF NOT EXISTS "reservaActiva" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "solicitud_medicamentos_donacionMedicamentoId_idx"
  ON "solicitud_medicamentos"("donacionMedicamentoId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'solicitud_medicamentos_donacionMedicamentoId_fkey'
  ) THEN
    ALTER TABLE "solicitud_medicamentos"
      ADD CONSTRAINT "solicitud_medicamentos_donacionMedicamentoId_fkey"
      FOREIGN KEY ("donacionMedicamentoId") REFERENCES "donacion_medicamentos"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
