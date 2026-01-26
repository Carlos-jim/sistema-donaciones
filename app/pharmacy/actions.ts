"use server";

import { prisma } from "@/lib/prisma";
import { EstadoSolicitud } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getSolicitudByCodigo(codigo: string) {
  try {
    // Try to find Solicitud first
    const solicitud = await prisma.solicitud.findUnique({
      where: { codigo },
      include: {
        usuarioComun: true,
        medicamentos: {
          include: {
            medicamento: true,
          },
        },
      },
    });

    if (solicitud) {
      return {
        success: true,
        data: { type: "SOLICITUD" as const, ...solicitud },
      };
    }

    // Try to find Donacion
    const donacion = await prisma.donacion.findUnique({
      where: { codigo },
      include: {
        usuarioComun: true,
        medicamentos: {
          include: {
            medicamento: true,
          },
        },
      },
    });

    if (donacion) {
      return {
        success: true,
        data: { type: "DONACION" as const, ...donacion },
      };
    }

    return { success: false, error: "Código no encontrado" };
  } catch (error) {
    console.error("Error fetching code:", error);
    return { success: false, error: "Error al buscar el código" };
  }
}

export async function updateStatus(
  id: string,
  type: "SOLICITUD" | "DONACION",
  newStatus: string,
) {
  try {
    if (type === "SOLICITUD") {
      await prisma.solicitud.update({
        where: { id },
        data: { estado: newStatus as any },
      });
    } else {
      await prisma.donacion.update({
        where: { id },
        data: { estado: newStatus as any },
      });
    }
    revalidatePath("/famarcy");
    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "Error al actualizar el estado" };
  }
}
