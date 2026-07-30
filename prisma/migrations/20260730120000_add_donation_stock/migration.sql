-- Stock disponible por cada línea de donación. Las filas existentes comienzan
-- con todo su contenido disponible para preservar el inventario actual.
ALTER TABLE "donacion_medicamentos"
ADD COLUMN "cantidadDisponible" INTEGER;

UPDATE "donacion_medicamentos"
SET "cantidadDisponible" = "cantidad";

ALTER TABLE "donacion_medicamentos"
ALTER COLUMN "cantidadDisponible" SET NOT NULL;

-- Una solicitud puede reservar una cantidad de una donación pública concreta.
ALTER TABLE "solicitud_medicamentos"
ADD COLUMN "donacionMedicamentoId" TEXT,
ADD COLUMN "reservaActiva" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "solicitud_medicamentos"
ADD CONSTRAINT "solicitud_medicamentos_donacionMedicamentoId_fkey"
FOREIGN KEY ("donacionMedicamentoId")
REFERENCES "donacion_medicamentos"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

CREATE INDEX "solicitud_medicamentos_donacionMedicamentoId_idx"
ON "solicitud_medicamentos"("donacionMedicamentoId");
