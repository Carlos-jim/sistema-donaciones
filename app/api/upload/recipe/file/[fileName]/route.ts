import { NextRequest, NextResponse } from "next/server";
import { getRecipeFromS3 } from "@/lib/s3";

type RouteContext = {
  params: Promise<{
    fileName: string;
  }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { fileName } = await context.params;
    const object = await getRecipeFromS3(decodeURIComponent(fileName));

    if (!object.Body) {
      return NextResponse.json(
        { error: "Receta no encontrada" },
        { status: 404 },
      );
    }

    const bytes = await object.Body.transformToByteArray();

    return new NextResponse(bytes, {
      headers: {
        "Content-Type": object.ContentType || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error reading recipe from S3:", error);
    return NextResponse.json(
      { error: "No se pudo cargar la receta" },
      { status: 404 },
    );
  }
}
