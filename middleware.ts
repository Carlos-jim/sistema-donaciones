import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  AUTH_COOKIE_NAMES,
  AUTH_HOME_ROUTES,
  AUTH_LOGIN_ROUTES,
  AUTH_ROLE_ORDER,
  normalizeAuthRole,
} from "@/lib/auth/roles";
import type { AuthRole, TokenPayload } from "@/lib/auth/types";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-in-production"
);

async function getRoleSession(request: NextRequest, role: AuthRole) {
  const token = request.cookies.get(AUTH_COOKIE_NAMES[role])?.value;
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const normalizedRole = normalizeAuthRole(
      payload as unknown as Partial<TokenPayload>,
    );

    if (normalizedRole !== role) {
      return null;
    }

    return {
      payload: payload as unknown as TokenPayload,
      role,
    };
  } catch {
    return null;
  }
}

async function getSessions(request: NextRequest) {
  const entries = await Promise.all(
    AUTH_ROLE_ORDER.map(async (role) => [
      role,
      await getRoleSession(request, role),
    ] as const),
  );

  return Object.fromEntries(entries) as Record<
    AuthRole,
    Awaited<ReturnType<typeof getRoleSession>>
  >;
}

function redirectTo(request: NextRequest, pathname: string) {
  return NextResponse.redirect(new URL(pathname, request.url));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessions = await getSessions(request);
  const activeSession = AUTH_ROLE_ORDER
    .map((role) => sessions[role])
    .find(Boolean);

  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isCommonAuthRoute =
    pathname === AUTH_LOGIN_ROUTES.COMUN || pathname.startsWith("/register");
  const isAdminLoginRoute = pathname === AUTH_LOGIN_ROUTES.ADMIN;
  const isSupervisorLoginRoute = pathname === AUTH_LOGIN_ROUTES.SUPERVISOR;
  const isPharmacyLoginRoute = pathname === AUTH_LOGIN_ROUTES.FARMACIA;
  const isAdminRoute = pathname.startsWith("/admin");
  const isSupervisorRoute = pathname.startsWith("/supervisor");
  const isPharmacyRoute = pathname.startsWith("/pharmacy");

  if (isDashboardRoute && !sessions.COMUN) {
    if (activeSession?.role) {
      return redirectTo(request, AUTH_HOME_ROUTES[activeSession.role]);
    }

    const loginUrl = new URL(AUTH_LOGIN_ROUTES.COMUN, request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isCommonAuthRoute && sessions.COMUN) {
    return redirectTo(request, AUTH_HOME_ROUTES.COMUN);
  }

  if (isAdminRoute && !isAdminLoginRoute && !sessions.ADMIN) {
    if (activeSession?.role) {
      return redirectTo(request, AUTH_HOME_ROUTES[activeSession.role]);
    }

    return redirectTo(request, AUTH_LOGIN_ROUTES.ADMIN);
  }

  if (isAdminLoginRoute && sessions.ADMIN) {
    return redirectTo(request, AUTH_HOME_ROUTES.ADMIN);
  }

  if (isSupervisorRoute && !isSupervisorLoginRoute && !sessions.SUPERVISOR) {
    if (activeSession?.role) {
      return redirectTo(request, AUTH_HOME_ROUTES[activeSession.role]);
    }

    return redirectTo(request, AUTH_LOGIN_ROUTES.SUPERVISOR);
  }

  if (isSupervisorLoginRoute && sessions.SUPERVISOR) {
    return redirectTo(request, AUTH_HOME_ROUTES.SUPERVISOR);
  }

  if (isPharmacyRoute && !isPharmacyLoginRoute && !sessions.FARMACIA) {
    if (activeSession?.role) {
      return redirectTo(request, AUTH_HOME_ROUTES[activeSession.role]);
    }

    return redirectTo(request, AUTH_LOGIN_ROUTES.FARMACIA);
  }

  if (isPharmacyLoginRoute && sessions.FARMACIA) {
    return redirectTo(request, AUTH_HOME_ROUTES.FARMACIA);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/register",
    "/admin/:path*",
    "/supervisor/:path*",
    "/pharmacy/:path*",
  ],
};
