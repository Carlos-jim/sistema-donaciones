import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Generate unique receipt code
function generateReceiptCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    let random = "";
    for (let i = 0; i < 4; i++) {
        random += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `DON-${timestamp}${random}`;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { requestId, donorUserId, pharmacyId } = body;

        if (!requestId || !donorUserId || !pharmacyId) {
            return NextResponse.json(
                { error: "requestId, donorUserId y pharmacyId son requeridos" },
                { status: 400 }
            );
        }

        // Verify the request exists and is approved
        const solicitud = await prisma.solicitud.findUnique({
            where: { id: requestId },
            include: {
                usuarioComun: {
                    select: { nombre: true, email: true },
                },
                medicamentos: {
                    include: {
                        medicamento: {
                            select: { nombre: true },
                        },
                    },
                },
            },
        });

        if (!solicitud) {
            return NextResponse.json(
                { error: "Solicitud no encontrada" },
                { status: 404 }
            );
        }

        if (solicitud.estado !== "APROBADA") {
            return NextResponse.json(
                { error: "Solo se pueden aceptar solicitudes aprobadas" },
                { status: 400 }
            );
        }

        if (solicitud.donanteAsignadoId) {
            return NextResponse.json(
                { error: "Esta solicitud ya ha sido asignada a otro donante" },
                { status: 400 }
            );
        }

        // Prevent user from accepting their own request
        if (solicitud.usuarioComunId === donorUserId) {
            return NextResponse.json(
                { error: "No puedes aceptar tu propia solicitud" },
                { status: 400 }
            );
        }

        // Verify pharmacy exists
        const farmacia = await prisma.farmacia.findUnique({
            where: { id: pharmacyId },
            select: { id: true, nombre: true, direccion: true, email: true },
        });

        if (!farmacia) {
            return NextResponse.json(
                { error: "Farmacia no encontrada" },
                { status: 404 }
            );
        }

        // Generate unique receipt code
        let codigoComprobante = generateReceiptCode();
        // Ensure uniqueness (retry if collision)
        let attempts = 0;
        while (attempts < 5) {
            const existing = await prisma.solicitud.findUnique({
                where: { codigoComprobante },
            });
            if (!existing) break;
            codigoComprobante = generateReceiptCode();
            attempts++;
        }

        // Get donor info for notifications
        const donante = await prisma.usuarioComun.findUnique({
            where: { id: donorUserId },
            select: { nombre: true },
        });

        // Update the request to assign it to the donor and pharmacy
        await prisma.solicitud.update({
            where: { id: requestId },
            data: {
                estado: "EN_PROCESO",
                donanteAsignadoId: donorUserId,
                assignedDate: new Date(),
                farmaciaEntregaId: pharmacyId,
                codigoComprobante,
            },
        });

        // Create notification for the beneficiary
        const medicamentoNombre =
            solicitud.medicamentos[0]?.medicamento?.nombre || "Medicamento";

        await prisma.notificacion.create({
            data: {
                userId: solicitud.usuarioComunId,
                type: "MATCH_DONATION",
                title: "¡Donante encontrado!",
                message: `Un donante ha aceptado tu solicitud de ${medicamentoNombre}. Se entregará en ${farmacia.nombre}. Código de comprobante: ${codigoComprobante}`,
                link: `/dashboard/requests/${requestId}`,
            },
        });

        // TODO: Notify pharmacy (when pharmacy notification system is implemented)
        // For now we log the notification that would be sent
        console.log(`[NOTIFICATION TO PHARMACY] ${farmacia.nombre}: Nuevo paquete por recibir. Donante: ${donante?.nombre}. Código: ${codigoComprobante}`);

        return NextResponse.json({
            success: true,
            message: "Solicitud aceptada exitosamente",
            data: {
                codigoComprobante,
                farmacia: {
                    nombre: farmacia.nombre,
                    direccion: farmacia.direccion,
                },
            },
        });
    } catch (error) {
        console.error("Error accepting request:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
