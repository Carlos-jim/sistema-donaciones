import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/donations/route";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// Mock the response to avoid actual execution issues in environment
vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server");
  return {
    ...actual,
    NextResponse: {
      json: vi.fn((body, init) => ({ body, init })),
    },
  };
});

describe("API Donations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a donation successfully", async () => {
    // Setup mocks
    const mockUser = { id: "user-1" };
    const mockDonation = { id: "donation-1" };

    // Mock user finding
    vi.mocked(prisma.usuarioComun.findFirst).mockResolvedValue(mockUser as any);

    // Mock transaction result
    // The transaction mock in setup returns the donation object, we need to ensure it matches
    // But since we mocked transaction manually in setup, we need to adjust or ensure it calls back
    // In vitest.setup.ts we defined a simple callback execution.
    // Let's rely on that or override here if needed.

    // Refine transaction mock for this test to return what we expect
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      return mockDonation;
    });

    const request = new Request("http://localhost/api/donations", {
      method: "POST",
      body: JSON.stringify({
        medication: "Paracetamol",
        quantity: 10,
        unit: "tablets",
        expiration: "2030-01-01",
        condition: "sealed",
        prescription: "no",
        description: "Test donation",
        availability: "flexible",
        location: { lat: 10, lng: 10 },
      }),
    });

    const response = await POST(request);

    // Verify response
    expect(response).toEqual(
      expect.objectContaining({
        body: expect.objectContaining({ success: true, id: "donation-1" }),
        init: { status: 201 },
      })
    );
  });

  it("should return 400 for invalid data", async () => {
    const request = new Request("http://localhost/api/donations", {
      method: "POST",
      body: JSON.stringify({
        // Missing required fields
        medication: "",
      }),
    });

    const response = await POST(request);

    expect(response).toEqual(
      expect.objectContaining({
        init: { status: 400 },
      })
    );
  });
});
