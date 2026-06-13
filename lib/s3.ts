import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

export const RECIPE_MAX_FILE_SIZE = 5 * 1024 * 1024;

export const RECIPE_ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const region = process.env.AWS_REGION || "us-east-1";
const endpoint = process.env.AWS_ENDPOINT_URL;
const recipePrefix = process.env.S3_RECIPES_PREFIX || "recetas";

export const s3Client = new S3Client({
  region,
  endpoint,
  forcePathStyle: Boolean(endpoint),
});

export function getRecipesBucket() {
  const bucket = process.env.S3_BUCKET_NAME;

  if (!bucket) {
    throw new Error("S3_BUCKET_NAME no está configurado");
  }

  return bucket;
}

export function validateRecipeFile(file: File) {
  if (!RECIPE_ALLOWED_TYPES[file.type]) {
    return {
      valid: false,
      error:
        "Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WebP)",
    };
  }

  if (file.size > RECIPE_MAX_FILE_SIZE) {
    return {
      valid: false,
      error: "El archivo es demasiado grande. Máximo 5MB",
    };
  }

  return { valid: true, error: null };
}

export function createRecipeFileName(contentType: string) {
  const extension = RECIPE_ALLOWED_TYPES[contentType] || "jpg";

  return `recipe_${Date.now()}-${randomUUID()}.${extension}`;
}

export function getRecipeObjectKey(fileName: string) {
  return `${recipePrefix}/${fileName}`;
}

export function getRecipeFileUrl(fileName: string) {
  return `/api/upload/recipe/file/${encodeURIComponent(fileName)}`;
}

export async function uploadRecipeToS3(file: File) {
  const fileName = createRecipeFileName(file.type);
  const key = getRecipeObjectKey(fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3Client.send(
    new PutObjectCommand({
      Bucket: getRecipesBucket(),
      Key: key,
      Body: buffer,
      ContentType: file.type,
      CacheControl: "private, max-age=3600",
      ServerSideEncryption: "AES256",
    }),
  );

  return {
    fileName,
    key,
    url: getRecipeFileUrl(fileName),
  };
}

export async function getRecipeFromS3(fileName: string) {
  return s3Client.send(
    new GetObjectCommand({
      Bucket: getRecipesBucket(),
      Key: getRecipeObjectKey(fileName),
    }),
  );
}
