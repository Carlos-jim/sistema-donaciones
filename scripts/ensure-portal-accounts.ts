import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await hash("admin123", 12);
  const supervisorPassword = await hash("supervisor123", 12);
  const pharmacyPassword = await hash("farmacia123", 12);

  const admin = await prisma.administrador.upsert({
    where: { email: "admin@medishare.com" },
    update: {
      nombre: "Admin Principal",
      password: adminPassword,
      rol: "SUPER_ADMIN",
    },
    create: {
      nombre: "Admin Principal",
      email: "admin@medishare.com",
      password: adminPassword,
      rol: "SUPER_ADMIN",
    },
  });

  const supervisor = await prisma.enteSalud.upsert({
    where: { email: "supervisor@hospitalcentral.com" },
    update: {
      nombre: "Hospital Central de Caracas",
      direccion: "Av. Panteon, San Bernardino, Caracas",
      telefono: "0212-5551234",
      password: supervisorPassword,
      aprobado: true,
      aprobadoPorId: admin.id,
    },
    create: {
      nombre: "Hospital Central de Caracas",
      direccion: "Av. Panteon, San Bernardino, Caracas",
      telefono: "0212-5551234",
      email: "supervisor@hospitalcentral.com",
      password: supervisorPassword,
      aprobado: true,
      aprobadoPorId: admin.id,
    },
  });

  const pharmacy = await prisma.farmacia.upsert({
    where: { email: "sambil@farmatodo.com" },
    update: {
      nombre: "Farmatodo Sambil Margarita",
      direccion: "Av. Jovito Villalba, C.C. Sambil, Pampatar",
      telefono: "0295-2601111",
      horario: "Lunes a Domingo 8:00 AM - 10:00 PM",
      password: pharmacyPassword,
      activo: true,
      latitude: 10.996578,
      longitude: -63.8133486,
    },
    create: {
      nombre: "Farmatodo Sambil Margarita",
      direccion: "Av. Jovito Villalba, C.C. Sambil, Pampatar",
      telefono: "0295-2601111",
      horario: "Lunes a Domingo 8:00 AM - 10:00 PM",
      email: "sambil@farmatodo.com",
      password: pharmacyPassword,
      activo: true,
      latitude: 10.996578,
      longitude: -63.8133486,
    },
  });

  console.log("Portal accounts ready:");
  console.log(`admin      -> ${admin.email} / admin123`);
  console.log(`supervisor -> ${supervisor.email} / supervisor123`);
  console.log(`pharmacy   -> ${pharmacy.email} / farmacia123`);
}

main()
  .catch((error) => {
    console.error("Failed to ensure portal accounts:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
