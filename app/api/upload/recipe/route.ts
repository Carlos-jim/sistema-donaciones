import { NextRequest, NextResponse } from "next/server";
import {
  isS3ConfigurationError,
  uploadRecipeToS3,
  validateRecipeFile,
} from "@/lib/s3";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 },
      );
    }

    const validation = validateRecipeFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 },
      );
    }

    const upload = await uploadRecipeToS3(file);

    return NextResponse.json({
      success: true,
      url: upload.url,
      fileName: upload.fileName,
      key: upload.key,
    });
  } catch (error) {
    console.error("Error processing upload:", error);

    if (isS3ConfigurationError(error)) {
      return NextResponse.json(
        { error: "El almacenamiento de recetas no está configurado" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "Error procesando la subida" },
      { status: 500 },
    );
  }
}
