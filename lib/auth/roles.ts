import type { AuthRole, TokenPayload } from "./types";

export const AUTH_ROLE_ORDER: AuthRole[] = [
  "ADMIN",
  "SUPERVISOR",
  "FARMACIA",
  "COMUN",
];

export const AUTH_COOKIE_NAMES: Record<AuthRole, string> = {
  ADMIN: "admin-token",
  SUPERVISOR: "supervisor-token",
  FARMACIA: "pharmacy-token",
  COMUN: "auth-token",
};

export const AUTH_HOME_ROUTES: Record<AuthRole, string> = {
  ADMIN: "/admin",
  SUPERVISOR: "/supervisor",
  FARMACIA: "/pharmacy",
  COMUN: "/dashboard",
};

export const AUTH_LOGIN_ROUTES: Record<AuthRole, string> = {
  ADMIN: "/admin/login",
  SUPERVISOR: "/supervisor/login",
  FARMACIA: "/pharmacy/login",
  COMUN: "/login",
};

export function normalizeAuthRole(
  payload?: Partial<TokenPayload> | null,
): AuthRole | null {
  if (!payload) {
    return null;
  }

  if (payload.role) {
    return payload.role;
  }

  switch (payload.tipo) {
    case "COMUN":
      return "COMUN";
    case "ENTE_SALUD":
    case "SUPERVISOR":
      return "SUPERVISOR";
    case "FARMACIA":
      return "FARMACIA";
    case "ADMIN":
      return "ADMIN";
    default:
      return null;
  }
}
