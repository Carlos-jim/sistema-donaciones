import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

    // Generar nombre único para el archivo
    const fileExt = file.name.split(".").pop() || "jpg";
    const fileName = `recipe_${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase bucket 'recipes'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("recipes")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: "Error al subir el archivo a la nube." },
        { status: 500 },
      );
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("recipes")
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
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
