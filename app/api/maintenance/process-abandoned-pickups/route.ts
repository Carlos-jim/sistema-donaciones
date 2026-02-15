import { NextRequest, NextResponse } from "next/server";
import { processAbandonedPickups } from "@/lib/abandoned-pickups.service";

export async function POST(request: NextRequest) {
  try {
    const configuredKey = process.env.MAINTENANCE_API_KEY;
    const providedKey = request.headers.get("x-maintenance-key");

    if (configuredKey && configuredKey !== providedKey) {
      return NextResponse.json(
        { error: "No autorizado para ejecutar mantenimiento" },
        { status: 401 },
      );
    }

    const summary = await processAbandonedPickups(new Date());

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Error processing abandoned pickups:", error);
    return NextResponse.json(
      { error: "Error interno en mantenimiento de retiros abandonados" },
      { status: 500 },
    );
  }
}
