import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export type DeliveryCodeRole = "DONOR_DELIVERY" | "REQUESTER_PICKUP";

export interface DeliveryQrPayload extends JWTPayload {
  solicitudId: string;
  pharmacyId: string;
  code: string;
  role: DeliveryCodeRole;
}

const DELIVERY_QR_EXPIRATION = "30d";
const DELIVERY_TOKEN_ISSUER = "medisharene-delivery";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production",
);

function generateSuffix(length: number) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let value = "";
  for (let i = 0; i < length; i++) {
    value += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return value;
}

export function generateReadableCode(prefix: "DON" | "RET") {
  const timePart = Date.now().toString(36).toUpperCase().slice(-5);
  return `${prefix}-${timePart}${generateSuffix(5)}`;
}

export async function signDeliveryQrPayload(payload: {
  solicitudId: string;
  pharmacyId: string;
  code: string;
  role: DeliveryCodeRole;
}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(DELIVERY_TOKEN_ISSUER)
    .setIssuedAt()
    .setExpirationTime(DELIVERY_QR_EXPIRATION)
    .sign(JWT_SECRET);
}

export async function verifyDeliveryQrPayload(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: DELIVERY_TOKEN_ISSUER,
    });

    const parsed = payload as DeliveryQrPayload;
    if (
      !parsed?.solicitudId ||
      !parsed?.pharmacyId ||
      !parsed?.code ||
      (parsed.role !== "DONOR_DELIVERY" && parsed.role !== "REQUESTER_PICKUP")
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function normalizeCodeInput(rawInput: string) {
  const input = rawInput.trim();
  if (!input) return { code: null, tokenPayload: null };

  const looksLikeJwt = input.includes(".") && input.split(".").length === 3;
  if (!looksLikeJwt) {
    return { code: input.toUpperCase(), tokenPayload: null };
  }

  const tokenPayload = await verifyDeliveryQrPayload(input);
  if (!tokenPayload) {
    return { code: input.toUpperCase(), tokenPayload: null };
  }

  return { code: tokenPayload.code, tokenPayload };
}
