import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const farmacias = await prisma.farmacia.findMany({
            select: {
                id: true,
                nombre: true,
                direccion: true,
                telefono: true,
                horario: true,
                latitude: true,
                longitude: true,
            },
            orderBy: {
                nombre: "asc",
            },
        });

        return NextResponse.json(farmacias);
    } catch (error) {
        console.error("Error fetching pharmacies:", error);
        return NextResponse.json(
            { error: "Error al obtener las farmacias" },
            { status: 500 }
        );
    }
}
