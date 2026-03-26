import "server-only";

import { EstadoDonacion, EstadoSolicitud, Prisma, TiempoEspera } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSessionForRole } from "@/lib/auth/server-session";

const ACTIVE_REQUEST_STATES: EstadoSolicitud[] = [
  "EN_PROCESO",
  "RECIBIDA",
  "LISTA_PARA_RETIRO",
];

const pharmacyArgs = Prisma.validator<Prisma.FarmaciaDefaultArgs>()({
  select: {
    id: true,
    nombre: true,
    direccion: true,
    telefono: true,
    horario: true,
    email: true,
    latitude: true,
    longitude: true,
    activo: true,
  },
});

const inventoryReceiptArgs = Prisma.validator<Prisma.DonacionDefaultArgs>()({
  select: {
    id: true,
    codigo: true,
    descripcion: true,
    origen: true,
    createdAt: true,
    updatedAt: true,
    usuarioComun: {
      select: {
        nombre: true,
      },
    },
    enteSalud: {
      select: {
        nombre: true,
      },
    },
    medicamentos: {
      select: {
        id: true,
        cantidad: true,
        fechaExpiracion: true,
        lote: true,
        medicamento: {
          select: {
            id: true,
            nombre: true,
            presentacion: true,
            concentracion: true,
          },
        },
      },
    },
  },
});

const activeRequestArgs = Prisma.validator<Prisma.SolicitudDefaultArgs>()({
  select: {
    id: true,
    codigo: true,
    createdAt: true,
    updatedAt: true,
    estado: true,
    tiempoEspera: true,
    farmaciaConfirmada: true,
    deliveryConfirmedAt: true,
    fechaRecepcionFarmacia: true,
    fechaListaRetiro: true,
    fechaLimiteRetiro: true,
    pickupConfirmedAt: true,
    usuarioComun: {
      select: {
        nombre: true,
        telefono: true,
        cedula: true,
      },
    },
    donanteAsignado: {
      select: {
        nombre: true,
        email: true,
      },
    },
    medicamentos: {
      select: {
        id: true,
        cantidad: true,
        medicamento: {
          select: {
            nombre: true,
            presentacion: true,
          },
        },
      },
    },
  },
});

export type AuthenticatedPharmacy = Prisma.FarmaciaGetPayload<typeof pharmacyArgs>;
export type PharmacyInventoryReceipt = Prisma.DonacionGetPayload<typeof inventoryReceiptArgs>;
export type PharmacyActiveRequest = Prisma.SolicitudGetPayload<typeof activeRequestArgs>;

export type PharmacyInventoryMedication = {
  medicamentoId: string;
  nombre: string;
  presentacion: string | null;
  concentracion: string | null;
  totalCantidad: number;
  donationCount: number;
  lastReceivedAt: Date;
  origins: string[];
};

type InventorySummary = {
  receivedDonationsCount: number;
  uniqueMedicationCount: number;
  totalUnits: number;
  lastReceivedAt: Date | null;
};

type ActiveRequestSummary = {
  inProcessCount: number;
  receivedCount: number;
  readyForPickupCount: number;
  totalActiveCount: number;
  pickupConfirmedCount: number;
};

export async function getAuthenticatedPharmacy(): Promise<AuthenticatedPharmacy> {
  const session = await getSessionForRole("FARMACIA");
  const pharmacyId = session?.farmaciaId ?? session?.userId;

  if (!session || !pharmacyId) {
    throw new Error("No autorizado");
  }

  const pharmacy = await prisma.farmacia.findUnique({
    where: { id: pharmacyId },
    ...pharmacyArgs,
  });

  if (!pharmacy || !pharmacy.activo) {
    throw new Error("Farmacia no autorizada");
  }

  return pharmacy;
}

function getInventoryOriginLabel(receipt: PharmacyInventoryReceipt) {
  if (receipt.origen === "ABANDONO_RETIRO") {
    return "Abandono de retiro";
  }

  if (receipt.origen === "ENTE_SALUD") {
    return receipt.enteSalud?.nombre
      ? `Ente de salud: ${receipt.enteSalud.nombre}`
      : "Ente de salud";
  }

  return receipt.usuarioComun?.nombre
    ? `Usuario: ${receipt.usuarioComun.nombre}`
    : "Usuario";
}

function sortActiveRequests(requests: PharmacyActiveRequest[]) {
  const stateOrder: Record<EstadoSolicitud, number> = {
    RECIBIDA: 0,
    LISTA_PARA_RETIRO: 1,
    EN_PROCESO: 2,
    PENDIENTE: 3,
    APROBADA: 4,
    RECHAZADA: 5,
    COMPLETADA: 6,
    CANCELADA: 7,
    ABANDONADA: 8,
  };

  const urgencyOrder: Record<TiempoEspera, number> = {
    ALTO: 0,
    MEDIO: 1,
    BAJO: 2,
  };

  return [...requests].sort((left, right) => {
    const stateDiff = stateOrder[left.estado] - stateOrder[right.estado];

    if (stateDiff !== 0) {
      return stateDiff;
    }

    const urgencyDiff = urgencyOrder[left.tiempoEspera] - urgencyOrder[right.tiempoEspera];

    if (urgencyDiff !== 0) {
      return urgencyDiff;
    }

    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });
}

function buildInventorySummary(receipts: PharmacyInventoryReceipt[]) {
  const medicationMap = new Map<string, PharmacyInventoryMedication>();
  let totalUnits = 0;
  let lastReceivedAt: Date | null = null;

  for (const receipt of receipts) {
    if (!lastReceivedAt || receipt.updatedAt > lastReceivedAt) {
      lastReceivedAt = receipt.updatedAt;
    }

    const originLabel = getInventoryOriginLabel(receipt);

    for (const medicationLine of receipt.medicamentos) {
      totalUnits += medicationLine.cantidad;

      const current = medicationMap.get(medicationLine.medicamento.id);

      if (current) {
        current.totalCantidad += medicationLine.cantidad;
        current.donationCount += 1;
        current.lastReceivedAt =
          receipt.updatedAt > current.lastReceivedAt
            ? receipt.updatedAt
            : current.lastReceivedAt;

        if (!current.origins.includes(originLabel)) {
          current.origins.push(originLabel);
        }
      } else {
        medicationMap.set(medicationLine.medicamento.id, {
          medicamentoId: medicationLine.medicamento.id,
          nombre: medicationLine.medicamento.nombre,
          presentacion: medicationLine.medicamento.presentacion,
          concentracion: medicationLine.medicamento.concentracion,
          totalCantidad: medicationLine.cantidad,
          donationCount: 1,
          lastReceivedAt: receipt.updatedAt,
          origins: [originLabel],
        });
      }
    }
  }

  const medications = [...medicationMap.values()].sort((left, right) => {
    if (right.lastReceivedAt.getTime() !== left.lastReceivedAt.getTime()) {
      return right.lastReceivedAt.getTime() - left.lastReceivedAt.getTime();
    }

    return right.totalCantidad - left.totalCantidad;
  });

  const summary: InventorySummary = {
    receivedDonationsCount: receipts.length,
    uniqueMedicationCount: medications.length,
    totalUnits,
    lastReceivedAt,
  };

  return { medications, summary };
}

function buildActiveRequestSummary(requests: PharmacyActiveRequest[]) {
  const summary: ActiveRequestSummary = {
    inProcessCount: 0,
    receivedCount: 0,
    readyForPickupCount: 0,
    totalActiveCount: requests.length,
    pickupConfirmedCount: 0,
  };

  for (const request of requests) {
    if (request.estado === "EN_PROCESO") {
      summary.inProcessCount += 1;
    }

    if (request.estado === "RECIBIDA") {
      summary.receivedCount += 1;
    }

    if (request.estado === "LISTA_PARA_RETIRO") {
      summary.readyForPickupCount += 1;

      if (request.pickupConfirmedAt) {
        summary.pickupConfirmedCount += 1;
      }
    }
  }

  return summary;
}

async function getInventoryReceiptsByPharmacyId(pharmacyId: string) {
  return prisma.donacion.findMany({
    where: {
      farmaciaId: pharmacyId,
      estado: EstadoDonacion.RECIBIDA,
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
    ...inventoryReceiptArgs,
  });
}

async function getActiveRequestsByPharmacyId(pharmacyId: string) {
  const requests = await prisma.solicitud.findMany({
    where: {
      farmaciaEntregaId: pharmacyId,
      estado: {
        in: ACTIVE_REQUEST_STATES,
      },
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
    ...activeRequestArgs,
  });

  return sortActiveRequests(requests);
}

export async function getPharmacyInventoryData() {
  const pharmacy = await getAuthenticatedPharmacy();
  const receipts = await getInventoryReceiptsByPharmacyId(pharmacy.id);
  const { medications, summary } = buildInventorySummary(receipts);

  return {
    pharmacy,
    receipts,
    medications,
    summary,
  };
}

export async function getPharmacyActiveRequestsData() {
  const pharmacy = await getAuthenticatedPharmacy();
  const requests = await getActiveRequestsByPharmacyId(pharmacy.id);
  const summary = buildActiveRequestSummary(requests);

  return {
    pharmacy,
    requests,
    summary,
  };
}

export async function getPharmacyDashboardData() {
  const pharmacy = await getAuthenticatedPharmacy();

  const [receipts, requests] = await Promise.all([
    getInventoryReceiptsByPharmacyId(pharmacy.id),
    getActiveRequestsByPharmacyId(pharmacy.id),
  ]);

  const inventory = buildInventorySummary(receipts);
  const activeRequests = buildActiveRequestSummary(requests);

  return {
    pharmacy,
    inventory: {
      receipts,
      medications: inventory.medications,
      summary: inventory.summary,
    },
    requests: {
      requests,
      summary: activeRequests,
    },
  };
}
