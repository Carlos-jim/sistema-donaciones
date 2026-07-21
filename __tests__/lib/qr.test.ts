import { describe, expect, it } from "vitest";
import { getReadableQrPayload } from "@/lib/delivery-codes";
import { getQrImageUrl } from "@/lib/qr";

describe("delivery QR", () => {
  it("encodes the readable validation code instead of an opaque token", () => {
    const payload = getReadableQrPayload(" don-abc123 ");
    const imageUrl = getQrImageUrl(payload, 180);

    expect(payload).toBe("DON-ABC123");
    expect(imageUrl).toContain("size=180x180");
    expect(imageUrl).toContain("data=DON-ABC123");
    expect(imageUrl).not.toContain("eyJ");
  });
});
