import prisma from "@/lib/prisma";
import { passwordService } from "@/lib/auth/password.service";

async function main() {
  try {
    // Create test supervisor if not exists
    const supervisorEmail = "supervisor@test.com";
    const hashedPassword = await passwordService.hash("password123");

    let supervisor = await prisma.enteSalud.findFirst({
      where: { email: supervisorEmail }
    });

    if (!supervisor) {
      supervisor = await prisma.enteSalud.create({
        data: {
          nombre: "Farmacia Central Supervisora",
          email: supervisorEmail,
          password: hashedPassword,
          direccion: "Av. Principal 123",
          telefono: "555-0101",
          aprobado: true,
        },
      });
      console.log("Created test supervisor");
    }

    // Create test user if not exists
    let user = await prisma.usuarioComun.findFirst();
    if (!user) {
      user = await prisma.usuarioComun.create({
        data: {
          nombre: "Usuario de Prueba",
          email: "usuario@test.com",
          password: await passwordService.hash("password123"),
          telefono: "555-1234",
          cedula: "12345678",
        },
      });
      console.log("Created test user");
    }

    // Create some test medications
    let paracetamol = await prisma.medicamento.findFirst({ where: { nombre: "Paracetamol" } });
    let ibuprofeno = await prisma.medicamento.findFirst({ where: { nombre: "Ibuprofeno" } });
    let insulina = await prisma.medicamento.findFirst({ where: { nombre: "Insulina" } });

    if (!paracetamol) {
      paracetamol = await prisma.medicamento.create({
        data: {
          nombre: "Paracetamol",
          presentacion: "500mg",
          concentracion: "500mg",
          descripcion: "Analgésico y antipirético",
        },
      });
    }

    if (!ibuprofeno) {
      ibuprofeno = await prisma.medicamento.create({
        data: {
          nombre: "Ibuprofeno",
          presentacion: "400mg",
          concentracion: "400mg",
          descripcion: "Antiinflamatorio no esteroideo",
        },
      });
    }

    if (!insulina) {
      insulina = await prisma.medicamento.create({
        data: {
          nombre: "Insulina",
          presentacion: "100UI/ml",
          concentracion: "100UI/ml",
          descripcion: "Insulina de acción rápida",
        },
      });
    }

    const medications = [paracetamol, ibuprofeno, insulina];

    console.log("Created/upserted medications");

    // Create test pending requests with medications and different priorities
    for (let i = 0; i < 3; i++) {
      const request = await prisma.solicitud.create({
        data: {
          usuarioComunId: user.id,
          motivo: `Solicitud de prueba ${i + 1} - necesidad ${i === 0 ? 'urgente' : i === 1 ? 'media' : 'baja'}`,
          estado: "PENDIENTE",
          codigo: `TEST${String(i + 1).padStart(3, '0')}`,
          recipePhotoUrl: "https://via.placeholder.com/400x300.png?text=Recipe+Photo",
        },
      });

      // Add medications to the request with different priorities
      await prisma.solicitudMedicamento.createMany({
        data: [
          {
            solicitudId: request.id,
            medicamentoId: medications[0].id, // Paracetamol
            cantidad: 2,
            prioridad: i === 0 ? 3 : 1, // High priority for first request
          },
          {
            solicitudId: request.id,
            medicamentoId: medications[1].id, // Ibuprofeno
            cantidad: 1,
            prioridad: i === 1 ? 2 : 1, // Medium priority for second request
          },
          {
            solicitudId: request.id,
            medicamentoId: medications[2].id, // Insulina
            cantidad: 3,
            prioridad: 1, // Low priority
          },
        ],
      });

      console.log(`Created test request ${i + 1} with code: ${request.codigo}`);
    }

    console.log("Test data created successfully!");
    console.log("\nLogin credentials:");
    console.log("Supervisor: supervisor@test.com / password123");
    console.log("User: usuario@test.com / password123");

  } catch (error) {
    console.error("Error creating test data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();