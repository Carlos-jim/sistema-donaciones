import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/cookie";
import { AUTH_COOKIE_NAMES } from "@/lib/auth/roles";

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: "Sesión cerrada exitosamente" },
    { status: 200 },
  );

  clearSessionCookie(response, AUTH_COOKIE_NAMES.COMUN);

  return response;
}
