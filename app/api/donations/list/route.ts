import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { tokenService } from "@/lib/auth/token.service";

export async function GET() {
  try {
    const token = (await cookies()).get("auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const payload = await tokenService.verify(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const donaciones = await prisma.donacion.findMany({
      where: {
        usuarioComunId: payload.userId,
      },
      include: {
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
    console.error("Error fetching donations:", error);
    return NextResponse.json(
      { error: "Error al obtener las donaciones" },
      { status: 500 },
    );
  }
}
