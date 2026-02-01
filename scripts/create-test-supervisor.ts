import { PrismaClient } from "@prisma/client";
import { passwordService } from "@/lib/auth/password.service";

const prisma = new PrismaClient();

async function main() {
  const email = "supervisor@test.com";
  const password = "password123";
  const hashedPassword = await passwordService.hash(password);

  const supervisor = await prisma.enteSalud.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      aprobado: true,
    },
    create: {
      nombre: "Farmacia Central Supervisora",
      email,
      password: hashedPassword,
      direccion: "Av. Principal 123",
      telefono: "555-0101",
      aprobado: true,
    },
  });

  console.log("Test Supervisor created/updated:");
  console.log({
    email: supervisor.email,
    password: password,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
