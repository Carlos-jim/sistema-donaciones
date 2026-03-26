import { NextResponse } from "next/server";

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7;

export function setSessionCookie(
  response: NextResponse,
  cookieName: string,
  token: string,
  maxAge = DEFAULT_MAX_AGE,
) {
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

export function clearSessionCookie(
  response: NextResponse,
  cookieName: string,
) {
  response.cookies.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
