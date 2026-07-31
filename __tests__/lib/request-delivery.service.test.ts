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
});
