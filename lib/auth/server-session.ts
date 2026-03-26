import { cookies } from "next/headers";
import { tokenService } from "./token.service";
import {
  AUTH_COOKIE_NAMES,
  AUTH_ROLE_ORDER,
  normalizeAuthRole,
} from "./roles";
import type { AuthRole, TokenPayload } from "./types";

export async function getSessionForRole(
  role: AuthRole,
): Promise<TokenPayload | null> {
  const token = (await cookies()).get(AUTH_COOKIE_NAMES[role])?.value;
  if (!token) {
    return null;
  }

  const payload = await tokenService.verify(token);
  if (!payload || normalizeAuthRole(payload) !== role) {
    return null;
  }

  return {
    ...payload,
    role,
  };
}

export async function getAnySession(): Promise<TokenPayload | null> {
  for (const role of AUTH_ROLE_ORDER) {
    const session = await getSessionForRole(role);
    if (session) {
      return session;
    }
  }

  return null;
}
