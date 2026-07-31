import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

type DatabaseClient = Prisma.TransactionClient;

const STOCK_UNAVAILABLE_ERROR = "No hay suficiente stock disponible para esta solicitud";

async function markDonationAsReservedIfExhausted(
  tx: DatabaseClient,
  donationId: string,
) {
  const remainingLines = await tx.donacionMedicamento.count({
    where: {
      donacionId: donationId,
      cantidadDisponible: { gt: 0 },
    },
  });

  if (remainingLines === 0) {
    await tx.donacion.update({
      where: { id: donationId },
      data: { estado: "RESERVADA" },
    });
  }
}

/** Reserva stock de una línea de donación sin permitir saldos negativos. */
export async function reserveDonationStock(
  tx: DatabaseClient,
  donationMedicationId: string,
  quantity: number,
) {
  const donationMedication = await tx.donacionMedicamento.findUnique({
    where: { id: donationMedicationId },
    select: {
      donacionId: true,
      medicamentoId: true,
      donacion: {
        select: {
          estado: true,
          usuarioComunId: true,
        },
      },
    },
  });

  if (!donationMedication || donationMedication.donacion.estado !== "DISPONIBLE") {
    throw new Error(STOCK_UNAVAILABLE_ERROR);
  }

  const updateResult = await tx.donacionMedicamento.updateMany({
    where: {
      id: donationMedicationId,
      cantidadDisponible: { gte: quantity },
    },
    data: {
      cantidadDisponible: { decrement: quantity },
    },
  });

  if (updateResult.count !== 1) {
    throw new Error(STOCK_UNAVAILABLE_ERROR);
  }

  await markDonationAsReservedIfExhausted(tx, donationMedication.donacionId);

  return donationMedication;
}

/**
 * Libera las reservas activas de una solicitud. Es idempotente: una reserva
 * previamente liberada no vuelve a incrementar el inventario.
 */
export async function releaseDonationStockForRequest(requestId: string) {
  await prisma.$transaction(async (tx) => {
    const reservedLines = await tx.solicitudMedicamento.findMany({
      where: {
        solicitudId: requestId,
        reservaActiva: true,
        donacionMedicamentoId: { not: null },
      },
      select: {
        id: true,
        cantidad: true,
        donacionMedicamentoId: true,
        donacionMedicamento: { select: { donacionId: true } },
      },
    });

    for (const line of reservedLines) {
      if (!line.donacionMedicamentoId || !line.donacionMedicamento) {
        continue;
      }

      await tx.donacionMedicamento.update({
        where: { id: line.donacionMedicamentoId },
        data: { cantidadDisponible: { increment: line.cantidad } },
      });
      await tx.solicitudMedicamento.update({
        where: { id: line.id },
        data: { reservaActiva: false },
      });
      await tx.donacion.updateMany({
        where: {
          id: line.donacionMedicamento.donacionId,
          estado: "RESERVADA",
        },
        data: { estado: "DISPONIBLE" },
      });
    }
  });
}

/** Reserva nuevamente una solicitud de donación pública al aprobarla. */
export async function reserveInactiveRequestStock(requestId: string) {
  await prisma.$transaction(async (tx) => {
    const inactiveLines = await tx.solicitudMedicamento.findMany({
      where: {
        solicitudId: requestId,
        reservaActiva: false,
        donacionMedicamentoId: { not: null },
      },
      select: {
        id: true,
        cantidad: true,
        donacionMedicamentoId: true,
      },
    });

    for (const line of inactiveLines) {
      if (!line.donacionMedicamentoId) {
        continue;
      }

      await reserveDonationStock(
        tx,
        line.donacionMedicamentoId,
        line.cantidad,
      );
      await tx.solicitudMedicamento.update({
        where: { id: line.id },
        data: { reservaActiva: true },
      });
    }
  });
}

export { STOCK_UNAVAILABLE_ERROR };
