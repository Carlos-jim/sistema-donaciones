"use server";

import { prisma } from "@/lib/prisma";
import { EstadoSolicitud } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function getSolicitudByCodigo(codigo: string) {
  try {
    // Try to find Solicitud first by codigo OR codigoComprobante
    const solicitud = await prisma.solicitud.findFirst({
      where: {
        OR: [{ codigo: codigo }, { codigoComprobante: codigo }],
      },
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
        data: {
          type: "SOLICITUD" as const,
          ...solicitud,
          // Ensure we have a code to display, preferring the one searched for or the comprobante
          codigo: solicitud.codigo || solicitud.codigoComprobante || "N/A",
        },
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

export async function getPendingPickups(farmaciaId: string) {
  try {
    const solicitudes = await prisma.solicitud.findMany({
      where: {
        farmaciaEntregaId: farmaciaId,
        estado: "LISTA_PARA_RETIRO",
        pickupConfirmedAt: { not: null },
      },
      include: {
        usuarioComun: { select: { nombre: true, cedula: true } },
        medicamentos: {
          include: { medicamento: { select: { nombre: true } } },
        },
      },
      orderBy: { pickupConfirmedAt: "asc" },
    });
    return { success: true, data: solicitudes };
  } catch (error) {
    console.error("Error fetching pending pickups:", error);
    return { success: false, data: [] };
  }
}

export async function updateStatus(
  id: string,
  type: "SOLICITUD" | "DONACION",
  newStatus: string,
) {
  try {
    if (type === "SOLICITUD") {
      // Si la farmacia rechaza → reactivar la solicitud para otros donantes
      if (newStatus === "RECHAZADA") {
        const solicitud = await prisma.solicitud.update({
          where: { id },
          data: {
            estado: "APROBADA",
            donanteAsignadoId: null,
            assignedDate: null,
            farmaciaEntregaId: null,
            codigoComprobante: null,
            farmaciaConfirmada: null,
            motivoRechazoFarmacia: null,
            deliveryConfirmedAt: null,
            pickupConfirmedAt: null,
            receptionConfirmedAt: null,
          },
          select: {
            usuarioComunId: true,
            donanteAsignadoId: true,
          },
        });

        // Notificar al beneficiario
        await prisma.notificacion.create({
          data: {
            userId: solicitud.usuarioComunId,
            type: "SYSTEM",
            title: "Medicamento rechazado por la farmacia",
            message: "La farmacia no aceptó el medicamento (mal estado o no coincide con la solicitud). Tu solicitud ha sido reactivada para que otro donante pueda ayudarte.",
            link: `/dashboard/requests`,
          },
        });

        revalidatePath("/pharmacy");
        return { success: true };
      }

      const solicitud = await prisma.solicitud.update({
        where: { id },
        data: { estado: newStatus as EstadoSolicitud },
        select: {
          usuarioComunId: true,
          donanteAsignadoId: true,
          farmaciaEntrega: { select: { nombre: true } },
          codigoComprobante: true,
        },
      });

      // Notificar según el cambio de estado
      if (newStatus === "RECIBIDA") {
        // Farmacia confirma recepción → notificar al donante ("OK")
        if (solicitud.donanteAsignadoId) {
          await prisma.notificacion.create({
            data: {
              userId: solicitud.donanteAsignadoId,
              type: "SYSTEM",
              title: "Farmacia recibió tu entrega",
              message: `La farmacia ${solicitud.farmaciaEntrega?.nombre} ha confirmado la recepción de tu medicamento. Está siendo validado.`,
              link: `/dashboard/donations`,
            },
          });
        }
      } else if (newStatus === "LISTA_PARA_RETIRO") {
        // Farmacia acepta medicamento → notificar al donante ("OK") y al beneficiario
        if (solicitud.donanteAsignadoId) {
          await prisma.notificacion.create({
            data: {
              userId: solicitud.donanteAsignadoId,
              type: "SYSTEM",
              title: "Medicamento aceptado por la farmacia",
              message: `La farmacia ${solicitud.farmaciaEntrega?.nombre} ha validado y aceptado tu medicamento. ¡Gracias por tu donación!`,
              link: `/dashboard/donations`,
            },
          });
        }
        await prisma.notificacion.create({
          data: {
            userId: solicitud.usuarioComunId,
            type: "SYSTEM",
            title: "Tu medicamento está listo para retiro",
            message: `La farmacia ${solicitud.farmaciaEntrega?.nombre} ha validado tu medicamento. Ya puedes ir a retirarlo. Código: ${solicitud.codigoComprobante || "N/A"}.`,
            link: `/dashboard/requests`,
          },
        });
      } else if (newStatus === "COMPLETADA") {
        await prisma.notificacion.create({
          data: {
            userId: solicitud.usuarioComunId,
            type: "SYSTEM",
            title: "Entrega confirmada por la farmacia",
            message: `La farmacia ${solicitud.farmaciaEntrega?.nombre} ha confirmado la entrega. Por favor confirma que recibiste tu medicamento.`,
            link: `/dashboard/requests`,
          },
        });
      }
    } else {
      await prisma.donacion.update({
        where: { id },
        data: { estado: newStatus as any },
      });
    }
    revalidatePath("/pharmacy");
    return { success: true };
  } catch (error) {
    console.error("Error updating status:", error);
    return { success: false, error: "Error al actualizar el estado" };
  }
}
