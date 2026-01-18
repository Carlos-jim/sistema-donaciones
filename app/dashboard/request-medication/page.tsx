import { MedicationRequestForm } from "@/components/medication-request-form";
import { cookies } from "next/headers";
import { tokenService } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function RequestMedicationPage() {
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
        userLocation = user.direccion;
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <MedicationRequestForm initialLocation={userLocation} />
      </div>
    </div>
  );
}
