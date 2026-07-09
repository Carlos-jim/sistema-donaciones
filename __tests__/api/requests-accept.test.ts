import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/requests/accept/route";
import { tokenService } from "@/lib/auth/token.service";
import { acceptRequestWithDeliveryCodes } from "@/lib/request-delivery.service";

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

vi.mock("@/lib/request-delivery.service", () => ({
  acceptRequestWithDeliveryCodes: vi.fn(),
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

describe("API Requests Accept", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(tokenService.verify).mockResolvedValue({
      userId: "donor-1",
      email: "donor@example.com",
      tipo: "COMUN",
    });
    vi.mocked(acceptRequestWithDeliveryCodes).mockResolvedValue({
      donorCode: "DON-ABC123",
      requesterCode: "RET-XYZ789",
      donorQrPayload: "donor-qr",
      requesterQrPayload: "requester-qr",
      farmacia: {
        id: "pharmacy-1",
        nombre: "Farmacia Central",
        direccion: "Av. Principal",
      },
    });
  });

  it("accepts a request using the authenticated user from cookie", async () => {
    const request = new Request("http://localhost/api/requests/accept", {
      method: "POST",
      body: JSON.stringify({
        requestId: "request-1",
        pharmacyId: "pharmacy-1",
      }),
    });

    const response = await POST(request);

    expect(acceptRequestWithDeliveryCodes).toHaveBeenCalledWith({
      requestId: "request-1",
      donorUserId: "donor-1",
      pharmacyId: "pharmacy-1",
    });
    expect(response).toEqual(
      expect.objectContaining({
        body: expect.objectContaining({ success: true }),
      }),
    );
  });
});
