import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "@/app/api/requests/[id]/route";
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

const routeContext = {
  params: Promise.resolve({ id: "request-1" }),
};

describe("API request detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenService.verify).mockResolvedValue({
      userId: "user-1",
    } as any);
  });

  it("edits and resubmits a rejected request for health entity review", async () => {
    vi.mocked(prisma.solicitud.findUnique)
      .mockResolvedValueOnce({
        estado: "RECHAZADA",
        usuarioComunId: "user-1",
      } as any)
      .mockResolvedValueOnce({ id: "request-1", estado: "PENDIENTE" } as any);

    const request = new Request("http://localhost/api/requests/request-1", {
      method: "PATCH",
      body: JSON.stringify({
        motivo: "Adjunto el récipe solicitado",
        requiresPrescription: true,
        recipePhotoUrl: "/api/upload/recipe/file/recipe.jpg",
      }),
    });

    const response = await PATCH(request as any, routeContext);

    expect(prisma.solicitud.update).toHaveBeenCalledWith({
      where: { id: "request-1" },
      data: expect.objectContaining({
        motivo: "Adjunto el récipe solicitado",
        requiresPrescription: true,
        recipePhotoUrl: "/api/upload/recipe/file/recipe.jpg",
        estado: "PENDIENTE",
        rejectionReason: null,
        aprobadoPorEnteId: null,
        approvalDate: null,
        approvalInstitution: null,
      }),
    });
    expect(response).toEqual(
      expect.objectContaining({
        body: expect.objectContaining({
          success: true,
          resubmitted: true,
        }),
      }),
    );
  });

  it("permanently deletes a rejected request owned by the user", async () => {
    vi.mocked(prisma.solicitud.findUnique).mockResolvedValue({
      estado: "RECHAZADA",
      usuarioComunId: "user-1",
    } as any);
    vi.mocked(prisma.solicitud.deleteMany).mockResolvedValue({ count: 1 });

    const response = await DELETE(
      new Request("http://localhost/api/requests/request-1", {
        method: "DELETE",
      }) as any,
      routeContext,
    );

    expect(prisma.solicitud.deleteMany).toHaveBeenCalledWith({
      where: {
        id: "request-1",
        usuarioComunId: "user-1",
        estado: "RECHAZADA",
      },
    });
    expect(response).toEqual(
      expect.objectContaining({
        body: { success: true },
      }),
    );
  });

  it("does not delete a request that is still pending", async () => {
    vi.mocked(prisma.solicitud.findUnique).mockResolvedValue({
      estado: "PENDIENTE",
      usuarioComunId: "user-1",
    } as any);

    const response = await DELETE(
      new Request("http://localhost/api/requests/request-1", {
        method: "DELETE",
      }) as any,
      routeContext,
    );

    expect(prisma.solicitud.deleteMany).not.toHaveBeenCalled();
    expect(response).toEqual(
      expect.objectContaining({
        body: { error: "Solo puedes eliminar solicitudes rechazadas" },
        init: { status: 409 },
      }),
    );
  });
});
