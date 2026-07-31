import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { tokenService } from "@/lib/auth/token.service";
import { acceptRequestWithDeliveryCodes } from "@/lib/request-delivery.service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, pharmacyId, requestMedicationId, quantity } = body;
    const token = (await cookies()).get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await tokenService.verify(token);

    if (!payload?.userId || payload.tipo !== "COMUN") {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    if (!requestId || !pharmacyId) {
      return NextResponse.json(
        { error: "requestId y pharmacyId son requeridos" },
        { status: 400 },
      );
    }

    if (
      quantity !== undefined &&
      (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1)
    ) {
      return NextResponse.json(
        { error: "quantity debe ser un número entero mayor a cero" },
        { status: 400 },
      );
    }

    const result = await acceptRequestWithDeliveryCodes({
      requestId,
      donorUserId: payload.userId,
      pharmacyId,
      requestMedicationId,
      quantity,
    });

    const donorView = {
      requestId: result.requestId,
      acceptedQuantity: result.acceptedQuantity,
      donorCode: result.donorCode,
      donorQrPayload: result.donorQrPayload,
      farmacia: result.farmacia,
    };

    return NextResponse.json({
      success: true,
      message: "Solicitud aceptada exitosamente",
      data: donorView,
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
      message.includes("No puedes aceptar") ||
      message.includes("cantidad") ||
      message.includes("insumo médico")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    console.error("Error accepting request:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
