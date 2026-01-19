import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { tokenService } from "@/lib/auth/token.service";
import { z } from "zod";

// Input validation schema
const donationSchema = z.object({
  medication: z.string().min(1, "El nombre del medicamento es requerido"),
  quantity: z.number().min(1, "La cantidad debe ser al menos 1"),
  unit: z.string().min(1, "La unidad es requerida"),
  expiration: z.string().refine((date) => new Date(date) > new Date(), {
    message: "La fecha de vencimiento debe ser futura",
  }),
  condition: z.string(),
  prescription: z.string(), // "yes" | "no"
  description: z.string().optional(),
  availability: z.string(),
  donationPhotoUrl: z.string().optional(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      address: z.string().optional(),
    })
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = donationSchema.safeParse(body);
    if (!result.success) {
      console.log(
        "Validation error:",
        JSON.stringify(result.error.formErrors.fieldErrors, null, 2),
      );
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: result.error.formErrors.fieldErrors,
        },
        { status: 400 },
      );
    }

    const {
      medication,
      quantity,
      unit,
      expiration,
      condition,
      prescription,
      description,
      availability,
      location,
      donationPhotoUrl,
    } = result.data;

    const token = (await cookies()).get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await tokenService.verify(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const userId = payload.userId;

    // Construct description with metadata since schema doesn't support specific columns yet
    // Construct description without location (stored separately now)
    const metadataString = `
--- Detalles Adicionales ---
Estado: ${condition}
Disponibilidad: ${availability}
Requiere Receta: ${prescription === "yes" ? "Sí" : "No"}
    `.trim();

    const fullDescription = description
      ? `${description}\n\n${metadataString}`
      : metadataString;

    // Transaction to ensure atomicity
    const donacion = await prisma.$transaction(async (tx) => {
      // 1. Create Donation Record
      const newDonacion = await tx.donacion.create({
        data: {
          descripcion: fullDescription,
          donationPhotoUrl: donationPhotoUrl || null,
          estado: "DISPONIBLE",
          direccion: location
            ? {
                calle: location.address || "Ubicación seleccionada en mapa",
                lat: location.lat,
                long: location.lng,
              }
            : undefined,
          usuarioComunId: userId,
        },
      });

      // 2. Find or Create Medication
      // Case insensitive search ideally, but Prisma findFirst is case-sensitive by default depends on DB.
      // We'll trust exact match or create new for now to match SOLID/Separation.
      let dbMedicamento = await tx.medicamento.findFirst({
        where: { nombre: medication },
      });

      if (!dbMedicamento) {
        dbMedicamento = await tx.medicamento.create({
          data: {
            nombre: medication,
            presentacion: unit, // Storing unit as presentacion
          },
        });
      }

      // 3. Link Medication to Donation
      await tx.donacionMedicamento.create({
        data: {
          donacionId: newDonacion.id,
          medicamentoId: dbMedicamento.id,
          cantidad: quantity,
          fechaExpiracion: new Date(expiration),
        },
      });

      // 4. Find matching Requests and Notify Users
      // Find active requests for this medication
      const matchingRequests = await tx.solicitudMedicamento.findMany({
        where: {
          medicamentoId: dbMedicamento.id,
          solicitud: {
            estado: "PENDIENTE",
          },
        },
        include: {
          solicitud: true,
        },
      });

      // Create notifications for each matching request
      for (const req of matchingRequests) {
        await tx.notificacion.create({
          data: {
            userId: req.solicitud.usuarioComunId,
            type: "MATCH_DONATION",
            title: "¡Medicamento Disponible!",
            message: `Alguien ha donado ${medication}, que estabas solicitando. Revisa los detalles.`,
            link: `/dashboard/donations/${newDonacion.id}`, // Assuming we have a details page
          },
        });
      }

      return newDonacion;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Donación registrada exitosamente",
        id: donacion.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error processing donation:", error);
    return NextResponse.json(
      { error: "Error interno del servidor al procesar la donación" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const donaciones = await prisma.donacion.findMany({
      where: {
        estado: "DISPONIBLE",
      },
      include: {
        usuarioComun: {
          select: {
            nombre: true,
            email: true,
          },
        },
        medicamentos: {
          include: {
            medicamento: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(donaciones);
  } catch (error) {
    console.error("Error fetching donaciones:", error);
    return NextResponse.json(
      { error: "Error al obtener las donaciones" },
      { status: 500 },
    );
  }
}
