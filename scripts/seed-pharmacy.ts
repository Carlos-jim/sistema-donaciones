import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if user exists, if not create one
    let user = await prisma.usuarioComun.findFirst();
    if (!user) {
      user = await prisma.usuarioComun.create({
        data: {
          nombre: "Test User",
          email: "test@example.com",
          password: "hashedpassword",
        },
      });
      console.log("Created test user");
    }

    // Create a request
    const request = await prisma.solicitud.create({
      data: {
        usuarioComunId: user.id,
        motivo: "Necesidad urgente de insulina",
        estado: "APROBADA", // Start as Approved so we can receive it
        codigo: "TEST01",
        recipePhotoUrl:
          "https://via.placeholder.com/400x300.png?text=Recipe+Photo", // Mock photo
      },
    });

    console.log("Created test request with code: TEST01");
  } catch (error) {
    console.error("Error seeding:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
