import { cookies } from "next/headers";
import { tokenService } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "./client-dashboard";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  let userLocation = null;

  if (token) {
    const payload = await tokenService.verify(token);

    if (payload?.email) {
      const user = await prisma.usuarioComun.findUnique({
        where: { email: payload.email },
        select: { direccion: true },
      });

      if (user?.direccion) {
        userLocation = user.direccion as { lat: number; lng: number };
      }
    }
  }

  return <DashboardClient initialUserLocation={userLocation} />;
}
