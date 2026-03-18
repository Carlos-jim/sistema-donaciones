import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

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

    // Validar tipo de archivo
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WebP)",
        },
        { status: 400 },
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo es demasiado grande. Máximo 5MB" },
        { status: 400 },
      );
    }

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", "recipes");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `recipe_${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = path.join(uploadDir, fileName);

    // Write file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Return the public URL
    const publicUrl = `/uploads/recipes/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
    });
  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      { error: "Error procesando la subida" },
      { status: 500 },
    );
  }
}
