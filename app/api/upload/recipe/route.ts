import { NextRequest, NextResponse } from "next/server";
import { uploadRecipeToS3, validateRecipeFile } from "@/lib/s3";

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
    return NextResponse.json(
      { error: "Error procesando la subida" },
      { status: 500 },
    );
  }
}
