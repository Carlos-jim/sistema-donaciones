import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/requests/route";
import prisma from "@/lib/prisma";

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
  });

  it("should create a request successfully with wait time", async () => {
    const mockUser = { id: "user-1" };
    const mockSolicitud = { id: "solicitud-1" };

    vi.mocked(prisma.usuarioComun.findFirst).mockResolvedValue(mockUser as any);
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
          tiempoEspera: "ALTO",
          usuarioComunId: "user-1",
        }),
      })
    );

    expect(response).toEqual(
      expect.objectContaining({
        body: expect.objectContaining({ success: true }),
        init: { status: 201 },
      })
    );
  });
});
