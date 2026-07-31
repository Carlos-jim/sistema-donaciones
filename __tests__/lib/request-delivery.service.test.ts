import { beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { acceptRequestWithDeliveryCodes } from "@/lib/request-delivery.service";

vi.mock("@/lib/delivery-codes", () => ({
  generateReadableCode: vi.fn((prefix: "DON" | "RET") =>
    prefix === "DON" ? "DON-ABC123" : "RET-XYZ789",
  ),
  getReadableQrPayload: vi.fn((code: string) => `qr:${code}`),
}));

describe("acceptRequestWithDeliveryCodes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.solicitud.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.farmacia.findUnique).mockResolvedValue({
      id: "pharmacy-1",
      nombre: "Farmacia Central",
      direccion: "Av. Principal",
    } as any);
  });

  it("allows the owner of a reserved public donation to prepare its delivery", async () => {
    vi.mocked(prisma.solicitud.findUnique).mockResolvedValue({
      id: "request-1",
      estado: "APROBADA",
      usuarioComunId: "requester-1",
      donanteAsignadoId: "donor-1",
      medicamentos: [
        {
          id: "line-1",
          medicamentoId: "med-1",
          cantidad: 3,
          prioridad: 1,
          medicamento: {
            nombre: "Crema",
          },
          donacionMedicamento: {
            donacion: {
              usuarioComunId: "donor-1",
            },
          },
        },
      ],
    } as any);

    const result = await acceptRequestWithDeliveryCodes({
      requestId: "request-1",
      donorUserId: "donor-1",
      pharmacyId: "pharmacy-1",
    });

    expect(prisma.solicitud.update).toHaveBeenCalledWith({
      where: { id: "request-1" },
      data: expect.objectContaining({
        estado: "EN_PROCESO",
        donanteAsignadoId: "donor-1",
        farmaciaEntregaId: "pharmacy-1",
        codigoEntregaDonante: "DON-ABC123",
        codigoRetiroSolicitante: "RET-XYZ789",
      }),
    });
    expect(result).toEqual(
      expect.objectContaining({
        donorCode: "DON-ABC123",
        requesterCode: "RET-XYZ789",
      }),
    );
  });

  it("recovers a legacy reservation that did not store the assigned donor", async () => {
    vi.mocked(prisma.solicitud.findUnique).mockResolvedValue({
      id: "request-legacy",
      estado: "APROBADA",
      usuarioComunId: "requester-1",
      donanteAsignadoId: null,
      medicamentos: [
        {
          id: "line-1",
          medicamentoId: "med-1",
          cantidad: 3,
          prioridad: 1,
          medicamento: {
            nombre: "Crema",
          },
          donacionMedicamento: {
            donacion: {
              usuarioComunId: "donor-1",
            },
          },
        },
      ],
    } as any);

    await acceptRequestWithDeliveryCodes({
      requestId: "request-legacy",
      donorUserId: "donor-1",
      pharmacyId: "pharmacy-1",
    });

    expect(prisma.solicitud.update).toHaveBeenCalledWith({
      where: { id: "request-legacy" },
      data: expect.objectContaining({
        donanteAsignadoId: "donor-1",
        codigoEntregaDonante: "DON-ABC123",
      }),
    });
  });

  it("does not allow another donor to take an already reserved delivery", async () => {
    vi.mocked(prisma.solicitud.findUnique).mockResolvedValue({
      id: "request-1",
      estado: "APROBADA",
      usuarioComunId: "requester-1",
      donanteAsignadoId: "donor-1",
      medicamentos: [
        {
          id: "line-1",
          medicamentoId: "med-1",
          cantidad: 3,
          prioridad: 1,
          donacionMedicamento: {
            donacion: {
              usuarioComunId: "donor-1",
            },
          },
        },
      ],
    } as any);

    await expect(
      acceptRequestWithDeliveryCodes({
        requestId: "request-1",
        donorUserId: "other-donor",
        pharmacyId: "pharmacy-1",
      }),
    ).rejects.toThrow("Esta solicitud ya ha sido asignada a otro donante");

    expect(prisma.solicitud.update).not.toHaveBeenCalled();
  });

  it("splits a requested quantity so another donor can cover the remaining units", async () => {
    vi.mocked(prisma.solicitud.findUnique).mockResolvedValue({
      id: "request-1",
      estado: "APROBADA",
      motivo: "Necesito crema",
      tiempoEspera: "MEDIO",
      direccion: null,
      requiresPrescription: false,
      recipePhotoUrl: null,
      usuarioComunId: "requester-1",
      donanteAsignadoId: null,
      aprobadoPorId: null,
      aprobadoPorEnteId: "supervisor-1",
      approvalDate: new Date("2026-07-31"),
      approvalInstitution: "Centro de Salud",
      medicamentos: [
        {
          id: "line-1",
          medicamentoId: "med-1",
          cantidad: 12,
          prioridad: 1,
          medicamento: { nombre: "Crema" },
          donacionMedicamento: null,
        },
      ],
    } as any);

    const tx = {
      solicitudMedicamento: {
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        create: vi.fn(),
      },
      solicitud: {
        create: vi.fn().mockResolvedValue({ id: "delivery-request-1" }),
      },
    };
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) =>
      callback(tx as any),
    );

    const result = await acceptRequestWithDeliveryCodes({
      requestId: "request-1",
      requestMedicationId: "line-1",
      quantity: 2,
      donorUserId: "donor-1",
      pharmacyId: "pharmacy-1",
    });

    expect(tx.solicitudMedicamento.updateMany).toHaveBeenCalledWith({
      where: {
        id: "line-1",
        cantidad: { gt: 2 },
        solicitud: {
          is: {
            estado: "APROBADA",
            donanteAsignadoId: null,
          },
        },
      },
      data: {
        cantidad: { decrement: 2 },
      },
    });
    expect(tx.solicitudMedicamento.create).toHaveBeenCalledWith({
      data: {
        solicitudId: "delivery-request-1",
        medicamentoId: "med-1",
        cantidad: 2,
        prioridad: 1,
      },
    });
    expect(result).toEqual(
      expect.objectContaining({
        requestId: "delivery-request-1",
        acceptedQuantity: 2,
      }),
    );
  });
});
