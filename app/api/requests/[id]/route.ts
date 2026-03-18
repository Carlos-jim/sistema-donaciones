import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { tokenService } from "@/lib/auth/token.service";
import { z } from "zod";

const editSchema = z.object({
  motivo: z.string().optional(),
  tiempoEspera: z.enum(["BAJO", "MEDIO", "ALTO"]).optional(),
  medicamentos: z
    .array(z.object({ nombre: z.string(), cantidad: z.number().int().positive() }))
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = (await cookies()).get("auth-token")?.value;
    if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const payload = await tokenService.verify(token);
    if (!payload?.userId) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const parsed = editSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const solicitud = await prisma.solicitud.findUnique({
      where: { id },
      select: { estado: true, usuarioComunId: true },
    });

    if (!solicitud) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    if (solicitud.usuarioComunId !== payload.userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }
    if (solicitud.estado !== "PENDIENTE") {
      return NextResponse.json(
        { error: "Solo puedes editar solicitudes en estado PENDIENTE" },
        { status: 409 }
      );
    }

    const { motivo, tiempoEspera, medicamentos } = parsed.data;

    // Update basic fields
    await prisma.solicitud.update({
      where: { id },
      data: {
        ...(motivo !== undefined && { motivo }),
        ...(tiempoEspera && { tiempoEspera }),
      },
    });

    // Update medications if provided
    if (medicamentos && medicamentos.length > 0) {
      // Remove existing medications and re-create
      await prisma.solicitudMedicamento.deleteMany({ where: { solicitudId: id } });

      for (const med of medicamentos) {
        const medicamento = await prisma.medicamento.findFirst({
          where: { nombre: { contains: med.nombre, mode: "insensitive" }, activo: true },
        });

        const medicamentoId = medicamento
          ? medicamento.id
          : (
              await prisma.medicamento.create({
                data: { nombre: med.nombre },
              })
            ).id;

        await prisma.solicitudMedicamento.create({
          data: { solicitudId: id, medicamentoId, cantidad: med.cantidad },
        });
      }
    }

    const updated = await prisma.solicitud.findUnique({
      where: { id },
      include: {
        medicamentos: { include: { medicamento: true } },
        usuarioComun: true,
      },
    });

    return NextResponse.json({ success: true, solicitud: updated });
  } catch (error) {
    console.error("Error editing solicitud:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
