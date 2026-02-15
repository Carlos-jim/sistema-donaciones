import { NextRequest, NextResponse } from "next/server";
import { acceptRequestWithDeliveryCodes } from "@/lib/request-delivery.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, donorUserId, pharmacyId } = body;

    if (!requestId || !donorUserId || !pharmacyId) {
      return NextResponse.json(
        { error: "requestId, donorUserId y pharmacyId son requeridos" },
        { status: 400 },
      );
    }

    const result = await acceptRequestWithDeliveryCodes({
      requestId,
      donorUserId,
      pharmacyId,
    });

    return NextResponse.json({
      success: true,
      message: "Solicitud aceptada exitosamente",
      data: result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error interno del servidor";

    if (
      message === "Solicitud no encontrada" ||
      message === "Farmacia no encontrada"
    ) {
      return NextResponse.json({ error: message }, { status: 404 });
    }

    if (
      message.includes("Solo se pueden aceptar") ||
      message.includes("ya ha sido asignada") ||
      message.includes("No puedes aceptar")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Error accepting request:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
