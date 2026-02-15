import prisma from "@/lib/prisma";
import {
  generateReadableCode,
  signDeliveryQrPayload,
} from "@/lib/delivery-codes";

type AcceptRequestInput = {
  requestId: string;
  donorUserId: string;
  pharmacyId: string;
};

type AcceptRequestResult = {
  donorCode: string;
  requesterCode: string;
  donorQrPayload: string;
  requesterQrPayload: string;
  farmacia: {
    id: string;
    nombre: string;
    direccion: string;
  };
};

async function generateUniqueSolicitudCode(prefix: "DON" | "RET") {
  let attempts = 0;
  while (attempts < 15) {
    const candidate = generateReadableCode(prefix);
    const existing = await prisma.solicitud.findFirst({
      where: {
        OR: [
          { codigoEntregaDonante: candidate },
          { codigoRetiroSolicitante: candidate },
          { codigoComprobante: candidate },
          { codigo: candidate },
        ],
      },
      select: { id: true },
    });

    if (!existing) return candidate;
    attempts += 1;
  }

  throw new Error("No se pudo generar un código único");
}

export async function acceptRequestWithDeliveryCodes(
  input: AcceptRequestInput,
): Promise<AcceptRequestResult> {
  const { requestId, donorUserId, pharmacyId } = input;

  const solicitud = await prisma.solicitud.findUnique({
    where: { id: requestId },
    include: {
      usuarioComun: {
        select: { nombre: true, email: true },
      },
      medicamentos: {
        include: {
          medicamento: {
            select: { nombre: true },
          },
        },
      },
    },
  });

  if (!solicitud) {
    throw new Error("Solicitud no encontrada");
  }

  if (solicitud.estado !== "APROBADA") {
    throw new Error("Solo se pueden aceptar solicitudes aprobadas");
  }

  if (solicitud.donanteAsignadoId) {
    throw new Error("Esta solicitud ya ha sido asignada a otro donante");
  }

  if (solicitud.usuarioComunId === donorUserId) {
    throw new Error("No puedes aceptar tu propia solicitud");
  }

  const farmacia = await prisma.farmacia.findUnique({
    where: { id: pharmacyId },
    select: { id: true, nombre: true, direccion: true },
  });

  if (!farmacia) {
    throw new Error("Farmacia no encontrada");
  }

  const donorCode = await generateUniqueSolicitudCode("DON");
  const requesterCode = await generateUniqueSolicitudCode("RET");

  await prisma.solicitud.update({
    where: { id: requestId },
    data: {
      estado: "EN_PROCESO",
      donanteAsignadoId: donorUserId,
      assignedDate: new Date(),
      farmaciaEntregaId: pharmacyId,
      codigoComprobante: donorCode, // compatibilidad temporal
      codigoEntregaDonante: donorCode,
      codigoRetiroSolicitante: requesterCode,
      tipoRechazo: null,
      motivoRechazoFarmacia: null,
    },
  });

  const medicamentoNombre =
    solicitud.medicamentos[0]?.medicamento?.nombre || "medicamento";

  await prisma.notificacion.create({
    data: {
      userId: solicitud.usuarioComunId,
      type: "MATCH_DONATION",
      title: "¡Donante encontrado!",
      message: `Un donante aceptó tu solicitud de ${medicamentoNombre}. Retira en ${farmacia.nombre} con código ${requesterCode}.`,
      link: "/dashboard/requests",
    },
  });

  await prisma.notificacion.create({
    data: {
      userId: donorUserId,
      type: "SYSTEM",
      title: "Entrega confirmada",
      message: `Entrega ${medicamentoNombre} en ${farmacia.nombre} con código ${donorCode}.`,
      link: "/dashboard/donations",
    },
  });

  const donorQrPayload = await signDeliveryQrPayload({
    solicitudId: solicitud.id,
    pharmacyId: farmacia.id,
    code: donorCode,
    role: "DONOR_DELIVERY",
  });

  const requesterQrPayload = await signDeliveryQrPayload({
    solicitudId: solicitud.id,
    pharmacyId: farmacia.id,
    code: requesterCode,
    role: "REQUESTER_PICKUP",
  });

  return {
    donorCode,
    requesterCode,
    donorQrPayload,
    requesterQrPayload,
    farmacia: {
      id: farmacia.id,
      nombre: farmacia.nombre,
      direccion: farmacia.direccion,
    },
  };
}
