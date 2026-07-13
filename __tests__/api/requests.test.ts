import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/requests/route";
import prisma from "@/lib/prisma";
import { tokenService } from "@/lib/auth/token.service";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(() => ({ value: "auth-token" })),
  })),
}));

vi.mock("@/lib/auth/token.service", () => ({
  tokenService: {
    verify: vi.fn(),
  },
}));

vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server");
  return {
    ...actual,
    NextResponse: {
      json: vi.fn((body, init) => ({ body, init })),
    },
  };
});

describe("API Requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenService.verify).mockResolvedValue({
      userId: "user-1",
    } as any);
  });

  it("should create a request successfully with wait time", async () => {
    const mockSolicitud = { id: "solicitud-1" };

    vi.mocked(prisma.solicitud.create).mockResolvedValue(mockSolicitud as any);
    vi.mocked(prisma.medicamento.findFirst).mockResolvedValue({
      id: "med-1",
    } as any);

    const request = new Request("http://localhost/api/requests", {
      method: "POST",
      body: JSON.stringify({
        motivo: "Need meds",
        medicamentos: [
          { nombre: "Ibuprofeno", cantidad: 1, unidad: "tablets" },
        ],
        ubicacion: { lat: 0, lng: 0 },
        requiereReceta: false,
        tiempoEspera: "ALTO",
      }),
    });

    const response = await POST(request);

    expect(prisma.solicitud.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: "PENDIENTE",
          tiempoEspera: "ALTO",
          usuarioComunId: "user-1",
        }),
      })
    );
    expect(prisma.notificacion.create).not.toHaveBeenCalled();

    expect(response).toEqual(
      expect.objectContaining({
        body: expect.objectContaining({ success: true }),
        init: { status: 201 },
      })
    );
  });

  it("should create medication when it does not exist in catalog", async () => {
    const mockSolicitud = { id: "solicitud-1" };

    vi.mocked(prisma.solicitud.create).mockResolvedValue(mockSolicitud as any);
    vi.mocked(prisma.medicamento.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.medicamento.create).mockResolvedValue({
      id: "med-new",
      nombre: "Nuevo Insumo",
    } as any);

    const request = new Request("http://localhost/api/requests", {
      method: "POST",
      body: JSON.stringify({
        motivo: "Need meds",
        medicamentos: [
          { nombre: " Nuevo Insumo ", cantidad: 1, unidad: "units" },
        ],
        ubicacion: { lat: 0, lng: 0 },
        requiereReceta: false,
        tiempoEspera: "MEDIO",
      }),
    });

    const response = await POST(request);

    expect(prisma.medicamento.findFirst).toHaveBeenCalledWith({
      where: {
        nombre: {
          equals: "Nuevo Insumo",
          mode: "insensitive",
        },
        activo: true,
      },
    });
    expect(prisma.medicamento.create).toHaveBeenCalledWith({
      data: {
        nombre: "Nuevo Insumo",
        presentacion: "units",
      },
    });
    expect(prisma.solicitudMedicamento.create).toHaveBeenCalledWith({
      data: {
        solicitudId: "solicitud-1",
        medicamentoId: "med-new",
        cantidad: 1,
        prioridad: 1,
      },
    });
    expect(response).toEqual(
      expect.objectContaining({
        body: expect.objectContaining({ success: true }),
        init: { status: 201 },
      })
    );
  });
});
