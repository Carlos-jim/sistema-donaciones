import { cookies } from "next/headers";
import { tokenService } from "@/lib/auth/token.service";

export async function getAdminFromCookie() {
  const token = (await cookies()).get("admin-token")?.value;
  if (!token) return null;
  const payload = await tokenService.verify(token);
  if (!payload || payload.tipo !== "ADMIN") return null;
  return payload;
}
