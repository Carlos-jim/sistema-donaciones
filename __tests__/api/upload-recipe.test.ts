import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Supabase
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  },
}));

// Import after mocking
import { POST } from "@/app/api/upload/recipe/route";

describe("POST /api/upload/recipe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if no file is provided", async () => {
    const formData = new FormData();
    const request = new NextRequest("http://localhost:3000/api/upload/recipe", {
      method: "POST",
      body: formData,
    });

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

    const request = new NextRequest("http://localhost:3000/api/upload/recipe", {
      method: "POST",
      body: formData,
    });

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

    const request = new NextRequest("http://localhost:3000/api/upload/recipe", {
      method: "POST",
      body: formData,
    });

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

    const mockPublicUrl =
      "https://example.supabase.co/storage/v1/object/public/recipes/123.jpg";

    mockUpload.mockResolvedValue({ data: { path: "123.jpg" }, error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: mockPublicUrl } });

    const request = new NextRequest("http://localhost:3000/api/upload/recipe", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.url).toBe(mockPublicUrl);
    expect(mockUpload).toHaveBeenCalled();
  });

  it("should return 500 if Supabase upload fails", async () => {
    const file = new File(["test image content"], "recipe.png", {
      type: "image/png",
    });
    const formData = new FormData();
    formData.append("file", file);

    mockUpload.mockResolvedValue({
      data: null,
      error: { message: "Storage error" },
    });

    const request = new NextRequest("http://localhost:3000/api/upload/recipe", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Error al subir el archivo");
  });

  it("should accept WebP images", async () => {
    const file = new File(["webp content"], "recipe.webp", {
      type: "image/webp",
    });
    const formData = new FormData();
    formData.append("file", file);

    const mockPublicUrl =
      "https://example.supabase.co/storage/v1/object/public/recipes/456.webp";

    mockUpload.mockResolvedValue({ data: { path: "456.webp" }, error: null });
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: mockPublicUrl } });

    const request = new NextRequest("http://localhost:3000/api/upload/recipe", {
      method: "POST",
      body: formData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
