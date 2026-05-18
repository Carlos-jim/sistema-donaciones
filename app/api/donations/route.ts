import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { tokenService } from "@/lib/auth/token.service";
import { z } from "zod";

// Input validation schema
const donationSchema = z.object({
  medicamentoId: z.string().optional(),
  medication: z.string().min(1, "El nombre del insumo médico es requerido"),
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
      medicamentoId,
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

    // Verify user type - only COMUN users can donate through this endpoint
    if (payload.tipo === "ENTE_SALUD") {
      return NextResponse.json(
        { error: "Los entes de salud deben usar su endpoint dedicado para donaciones" },
        { status: 403 },
      );
    }

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

    // Generate a unique code with retry logic
    const generateCode = () => {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    // 1. Create Donation Record
    const newDonacion = await prisma.donacion.create({
      data: {
        codigo: generateCode(),
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
    let dbMedicamento = null;

    if (medicamentoId) {
      dbMedicamento = await prisma.medicamento.findUnique({
        where: { id: medicamentoId },
      });
    }

    if (!dbMedicamento) {
      dbMedicamento = await prisma.medicamento.findFirst({
        where: { nombre: medication },
      });
    }

    if (!dbMedicamento) {
      dbMedicamento = await prisma.medicamento.create({
        data: {
          nombre: medication,
          presentacion: unit,
        },
      });
    }

    // 3. Link Medication to Donation
    await prisma.donacionMedicamento.create({
      data: {
        donacionId: newDonacion.id,
        medicamentoId: dbMedicamento.id,
        cantidad: quantity,
        fechaExpiracion: new Date(expiration),
      },
    });

    // 4. Find matching Requests and Notify Users
    const matchingRequests = await prisma.solicitudMedicamento.findMany({
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
      await prisma.notificacion.create({
        data: {
          userId: req.solicitud.usuarioComunId,
          type: "MATCH_DONATION",
          title: "¡Insumo médico Disponible!",
          message: `Alguien ha donado ${medication}, que estabas solicitando. Revisa los detalles.`,
          link: `/dashboard/donations/${newDonacion.id}`,
        },
      });
    }

    const donacion = newDonacion;

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
    const errorMessage =
      error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      {
        error: "Error interno del servidor al procesar la donación",
        details: errorMessage,
      },
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
