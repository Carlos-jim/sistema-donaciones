import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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

    // TODO: Get real user authentication
    // Mimicking requests/route.ts behavior regarding user resolution
    let usuario = await prisma.usuarioComun.findFirst();

    if (!usuario) {
      usuario = await prisma.usuarioComun.create({
        data: {
          nombre: "Donante de Prueba",
          email: "donante@example.com",
          password: "placeholder",
        },
      });
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

    // Transaction to ensure atomicity
    const donacion = await prisma.$transaction(async (tx) => {
      // 1. Create Donation Record
      const newDonacion = await tx.donacion.create({
        data: {
          descripcion: fullDescription,
          donationPhotoUrl: donationPhotoUrl || null,
          estado: "DISPONIBLE",
          latitude: location?.lat || null,
          longitude: location?.lng || null,
          usuarioComunId: usuario.id,
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
