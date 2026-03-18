import { describe, it, expect } from "vitest";
import {
  generateReadableCode,
  normalizeCodeInput,
  signDeliveryQrPayload,
  verifyDeliveryQrPayload,
} from "@/lib/delivery-codes";

describe("delivery-codes", () => {
  it("generates donor and requester codes with expected prefixes", () => {
    const donorCode = generateReadableCode("DON");
    const requesterCode = generateReadableCode("RET");

    expect(donorCode.startsWith("DON-")).toBe(true);
    expect(requesterCode.startsWith("RET-")).toBe(true);
    expect(donorCode).not.toEqual(requesterCode);
  });

  it("signs and verifies qr payloads", async () => {
    const token = await signDeliveryQrPayload({
      solicitudId: "sol-1",
      pharmacyId: "farm-1",
      code: "DON-ABC123",
      role: "DONOR_DELIVERY",
    });

    const parsed = await verifyDeliveryQrPayload(token);

    expect(parsed).not.toBeNull();
    expect(parsed?.solicitudId).toBe("sol-1");
    expect(parsed?.role).toBe("DONOR_DELIVERY");
    expect(parsed?.code).toBe("DON-ABC123");
  });

  it("normalizes plain codes and signed tokens", async () => {
    const plain = await normalizeCodeInput("don-xyz123");
    expect(plain.code).toBe("DON-XYZ123");
    expect(plain.tokenPayload).toBeNull();

    const token = await signDeliveryQrPayload({
      solicitudId: "sol-2",
      pharmacyId: "farm-2",
      code: "RET-ABCD",
      role: "REQUESTER_PICKUP",
    });

    const parsed = await normalizeCodeInput(token);
    expect(parsed.code).toBe("RET-ABCD");
    expect(parsed.tokenPayload?.role).toBe("REQUESTER_PICKUP");
  });
});
