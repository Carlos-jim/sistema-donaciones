import { MedicationRequestForm } from "@/components/medication-request-form";
import { cookies } from "next/headers";
import { tokenService } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function RequestMedicationPage({
  searchParams,
}: {
  searchParams: Promise<{ donacionId?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  let userLocation = null;
  let initialMedication: string | undefined;

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

  const { donacionId } = await searchParams;
  if (donacionId) {
    const donacion = await prisma.donacion.findUnique({
      where: { id: donacionId },
      include: {
        medicamentos: { include: { medicamento: true } },
      },
    });
    if (donacion?.medicamentos[0]?.medicamento?.nombre) {
      initialMedication = donacion.medicamentos[0].medicamento.nombre;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30 py-8 px-4">
      <div className="mx-auto max-w-2xl">
        <MedicationRequestForm
          initialLocation={userLocation}
          initialMedication={initialMedication}
        />
      </div>
    </div>
  );
}
