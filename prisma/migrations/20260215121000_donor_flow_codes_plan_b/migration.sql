-- Add new enum values and enums for donor flow / plan B
ALTER TYPE "EstadoSolicitud" ADD VALUE IF NOT EXISTS 'ABANDONADA';

DO $$
BEGIN
  CREATE TYPE "TipoRechazoSolicitud" AS ENUM ('SUPERVISOR', 'FARMACIA');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "DonacionOrigen" AS ENUM ('USUARIO', 'ENTE_SALUD', 'ABANDONO_RETIRO');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Donaciones: origen, farmacia de custodia y solicitud origen para idempotencia
ALTER TABLE "donaciones"
  ADD COLUMN IF NOT EXISTS "origen" "DonacionOrigen" NOT NULL DEFAULT 'USUARIO',
  ADD COLUMN IF NOT EXISTS "farmaciaId" TEXT,
  ADD COLUMN IF NOT EXISTS "solicitudOrigenId" TEXT;

-- Solicitudes: códigos diferenciados y trazabilidad de farmacia
ALTER TABLE "solicitudes"
  ADD COLUMN IF NOT EXISTS "codigoEntregaDonante" TEXT,
  ADD COLUMN IF NOT EXISTS "codigoRetiroSolicitante" TEXT,
  ADD COLUMN IF NOT EXISTS "fechaRecepcionFarmacia" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "fechaListaRetiro" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "fechaLimiteRetiro" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "fechaRetiro" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "tipoRechazo" "TipoRechazoSolicitud",
  ADD COLUMN IF NOT EXISTS "motivoRechazoFarmacia" TEXT;

-- Backfill: mantener continuidad con el código histórico del donante
UPDATE "solicitudes"
SET "codigoEntregaDonante" = "codigoComprobante"
WHERE "codigoComprobante" IS NOT NULL
  AND "codigoEntregaDonante" IS NULL;

-- Unique constraints / indexes
CREATE UNIQUE INDEX IF NOT EXISTS "solicitudes_codigoEntregaDonante_key"
  ON "solicitudes"("codigoEntregaDonante");

CREATE UNIQUE INDEX IF NOT EXISTS "solicitudes_codigoRetiroSolicitante_key"
  ON "solicitudes"("codigoRetiroSolicitante");

CREATE UNIQUE INDEX IF NOT EXISTS "donaciones_solicitudOrigenId_key"
  ON "donaciones"("solicitudOrigenId");

-- Foreign keys
DO $$
BEGIN
  ALTER TABLE "donaciones"
    ADD CONSTRAINT "donaciones_farmaciaId_fkey"
    FOREIGN KEY ("farmaciaId") REFERENCES "farmacias"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "donaciones"
    ADD CONSTRAINT "donaciones_solicitudOrigenId_fkey"
    FOREIGN KEY ("solicitudOrigenId") REFERENCES "solicitudes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
