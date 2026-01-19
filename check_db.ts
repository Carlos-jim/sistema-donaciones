import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking users...");
  const users = await prisma.usuarioComun.findMany();
  console.log(`Found ${users.length} users:`);
  users.forEach((u) => console.log(`- ${u.id}: ${u.nombre} (${u.email})`));

  console.log("\nChecking donations...");
  const donations = await prisma.donacion.findMany();
  console.log(`Found ${donations.length} donations:`);
  donations.forEach((d) =>
    console.log(
      `- ID: ${d.id}, UserID: ${d.usuarioComunId}, Status: ${d.estado}`,
    ),
  );
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
