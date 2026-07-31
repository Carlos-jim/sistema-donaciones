import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/donations/list/route";
import { tokenService } from "@/lib/auth/token.service";
import prisma from "@/lib/prisma";

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

vi.mock("@/lib/abandoned-pickups.service", () => ({
  processAbandonedPickups: vi.fn(),
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

describe("API Donations List", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenService.verify).mockResolvedValue({
      userId: "donor-1",
    } as any);
    vi.mocked(prisma.donacion.findMany).mockResolvedValue([]);
    vi.mocked(prisma.solicitud.findMany).mockResolvedValue([]);
  });

  it("includes legacy reservations linked to the user's original offer", async () => {
    await GET();

    expect(prisma.solicitud.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            {
              donanteAsignadoId: "donor-1",
            },
            {
              donanteAsignadoId: null,
              medicamentos: {
                some: {
                  donacionMedicamento: {
                    is: {
                      donacion: {
                        usuarioComunId: "donor-1",
                      },
                    },
                  },
                },
              },
            },
          ],
        },
      }),
    );
  });
});
