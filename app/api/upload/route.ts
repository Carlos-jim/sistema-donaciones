import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo" },
        { status: 400 },
      );
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipo de archivo no válido. Use JPG, PNG o WebP" },
        { status: 400 },
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "El archivo es muy grande. Máximo 5MB" },
        { status: 400 },
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `recipe_${timestamp}.${extension}`;

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase bucket 'recipes'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("recipes")
      .upload(filename, buffer, {
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
      .getPublicUrl(filename);

    return NextResponse.json({
      success: true,
      url: publicUrlData.publicUrl,
      filename,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Error al subir el archivo" },
      { status: 500 },
    );
  }
}
