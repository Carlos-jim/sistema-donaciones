// Servicio de tokens JWT - Single Responsibility: solo maneja tokens
import { SignJWT, jwtVerify } from "jose";
import type { ITokenService, TokenPayload } from "./types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production"
);
const JWT_EXPIRATION = "7d";

export class TokenService implements ITokenService {
  async generate(payload: TokenPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRATION)
      .sign(JWT_SECRET);
  }

  async verify(token: string): Promise<TokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      return payload as unknown as TokenPayload;
    } catch {
      return null;
    }
  }
}

// Singleton para uso directo
export const tokenService = new TokenService();
