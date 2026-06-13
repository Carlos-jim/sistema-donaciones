import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { mockUploadRecipeToS3 } = vi.hoisted(() => ({
  mockUploadRecipeToS3: vi.fn(),
}));

vi.mock("@/lib/s3", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/s3")>();

  return {
    ...actual,
    uploadRecipeToS3: mockUploadRecipeToS3,
  };
});

// Import after mocking
import { POST } from "@/app/api/upload/recipe/route";

function createUploadRequest(formData: FormData) {
  return {
    formData: vi.fn().mockResolvedValue(formData),
  } as unknown as NextRequest;
}

describe("POST /api/upload/recipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if no file is provided", async () => {
    const formData = new FormData();
    const request = createUploadRequest(formData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("No se proporcionó ningún archivo");
  });

  it("should return 400 for invalid file type", async () => {
    const file = new File(["test content"], "test.pdf", {
      type: "application/pdf",
    });
    const formData = new FormData();
    formData.append("file", file);
    const request = createUploadRequest(formData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Tipo de archivo no permitido");
  });

  it("should return 400 for file too large", async () => {
    // Create a file larger than 5MB
    const largeContent = "x".repeat(6 * 1024 * 1024);
    const file = new File([largeContent], "large.jpg", { type: "image/jpeg" });
    const formData = new FormData();
    formData.append("file", file);
    const request = createUploadRequest(formData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("demasiado grande");
  });

  it("should upload file successfully and return URL", async () => {
    const file = new File(["test image content"], "recipe.jpg", {
      type: "image/jpeg",
    });
    const formData = new FormData();
    formData.append("file", file);

    const mockUrl = "/api/upload/recipe/file/123.jpg";

    mockUploadRecipeToS3.mockResolvedValue({
      fileName: "123.jpg",
      key: "recetas/123.jpg",
      url: mockUrl,
    });

    const request = createUploadRequest(formData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.url).toBe(mockUrl);
    expect(data.key).toBe("recetas/123.jpg");
    expect(mockUploadRecipeToS3).toHaveBeenCalledWith(file);
  });

  it("should return 500 if S3 upload fails", async () => {
    const file = new File(["test image content"], "recipe.png", {
      type: "image/png",
    });
    const formData = new FormData();
    formData.append("file", file);

    mockUploadRecipeToS3.mockRejectedValue(new Error("Storage error"));
    const request = createUploadRequest(formData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error procesando la subida");
  });

  it("should accept WebP images", async () => {
    const file = new File(["webp content"], "recipe.webp", {
      type: "image/webp",
    });
    const formData = new FormData();
    formData.append("file", file);

    mockUploadRecipeToS3.mockResolvedValue({
      fileName: "456.webp",
      key: "recetas/456.webp",
      url: "/api/upload/recipe/file/456.webp",
    });

    const request = createUploadRequest(formData);

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
