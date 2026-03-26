import { getSessionForRole } from "@/lib/auth/server-session";

export async function getAdminFromCookie() {
  return getSessionForRole("ADMIN");
}
