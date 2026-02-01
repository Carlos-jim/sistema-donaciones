// Seed script to populate the database with test data
// Run with: node prisma/seed.cjs

require("dotenv").config();
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

// Create Prisma client with pg adapter (same as lib/prisma.ts)
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function hashPassword(password) {
    return await bcrypt.hash(password, 12);
}

async function main() {
    console.log("🌱 Starting seed...");

    // Clean existing data
    console.log("🧹 Cleaning existing data...");
    await prisma.solicitudMedicamento.deleteMany();
    await prisma.donacionMedicamento.deleteMany();
    await prisma.notificacion.deleteMany();
    await prisma.solicitud.deleteMany();
    await prisma.donacion.deleteMany();
    await prisma.medicamento.deleteMany();
    await prisma.usuarioComun.deleteMany();
    await prisma.enteSalud.deleteMany();
    await prisma.farmacia.deleteMany();
    await prisma.administrador.deleteMany();

    // Create Administrator
    console.log("👤 Creating administrator...");
    const admin = await prisma.administrador.create({
        data: {
            nombre: "Admin Principal",
            email: "admin@medishare.com",
            password: await hashPassword("admin123"),
            rol: "SUPER_ADMIN",
        },
    });

    // Create Health Entity (EnteSalud / Supervisor)
    console.log("🏥 Creating health entities...");
    const enteSalud = await prisma.enteSalud.create({
        data: {
            nombre: "Hospital Central de Caracas",
            direccion: "Av. Panteón, San Bernardino, Caracas",
            telefono: "0212-5551234",
            email: "supervisor@hospitalcentral.com",
            password: await hashPassword("supervisor123"),
            aprobado: true,
            aprobadoPorId: admin.id,
        },
    });

    await prisma.enteSalud.create({
        data: {
            nombre: "Clínica Santa María",
            direccion: "Av. Francisco de Miranda, Chacao, Caracas",
            telefono: "0212-5559876",
            email: "supervisor@clinicasantamaria.com",
            password: await hashPassword("supervisor123"),
            aprobado: true,
            aprobadoPorId: admin.id,
        },
    });

    // Create Pharmacies
    console.log("💊 Creating pharmacies...");

    // Farmatodo Sambil Margarita (Maneiro)
    const farmacia1 = await prisma.farmacia.create({
        data: {
            nombre: "Farmatodo Sambil Margarita",
            direccion: "Av. Jóvito Villalba, C.C. Sambil, Pampatar",
            telefono: "0295-2601111",
            horario: "Lunes a Domingo 8:00 AM - 10:00 PM",
            email: "sambil@farmatodo.com",
            password: await hashPassword("farmacia123"),
            latitude: 10.996578,
            longitude: -63.8133486,
        },
    });

    // Farmatodo Playa El Ángel
    const farmacia2 = await prisma.farmacia.create({
        data: {
            nombre: "Farmatodo Playa El Ángel",
            direccion: "Av. Aldonza Manrique, Playa El Ángel",
            telefono: "0295-2622222",
            horario: "Lunes a Domingo 24 Horas",
            email: "playaelangel@farmatodo.com",
            password: await hashPassword("farmacia123"),
            latitude: 10.9878333,
            longitude: -63.8177528,
        },
    });

    // Farmatodo C.C. La Vela
    const farmacia3 = await prisma.farmacia.create({
        data: {
            nombre: "Farmatodo C.C. La Vela",
            direccion: "C.C. La Vela, Nivel Planta, Urb. Costa Azul",
            telefono: "0295-2603333",
            horario: "Lunes a Domingo 9:00 AM - 9:00 PM",
            email: "lavela@farmatodo.com",
            password: await hashPassword("farmacia123"),
            latitude: 10.9777303,
            longitude: -63.8195757,
        },
    });

    // Farmatodo Jorge Coll
    const farmacia4 = await prisma.farmacia.create({
        data: {
            nombre: "Farmatodo Jorge Coll",
            direccion: "Urb. Jorge Coll, Pampatar",
            telefono: "0295-2604444",
            horario: "Lunes a Domingo 8:00 AM - 9:00 PM",
            email: "jorgecoll@farmatodo.com",
            password: await hashPassword("farmacia123"),
            latitude: 10.9947051,
            longitude: -63.8052786,
        },
    });

    // Farmatodo La Asunción
    const farmacia5 = await prisma.farmacia.create({
        data: {
            nombre: "Farmatodo La Asunción",
            direccion: "Av. 31 de Julio, Sector Cocheima, La Asunción",
            telefono: "0295-2605555",
            horario: "Lunes a Domingo 8:00 AM - 8:00 PM",
            email: "laasuncion@farmatodo.com",
            password: await hashPassword("farmacia123"),
            latitude: 11.0402671,
            longitude: -63.8571535,
        },
    });

    // Farmahorro (Farmaplus) Caribe
    await prisma.farmacia.create({
        data: {
            nombre: "Farmahorro Caribe",
            direccion: "Av. Jóvito Villalba, Sector Caribe, Pampatar",
            telefono: "0295-2606666",
            horario: "Lunes a Domingo 8:00 AM - 10:00 PM",
            email: "caribe@farmahorro.com",
            password: await hashPassword("farmacia123"),
            latitude: 10.9927,
            longitude: -63.825,
        },
    });

    // Farmacia Sigo - Sambil Margarita
    await prisma.farmacia.create({
        data: {
            nombre: "Farmacia Sigo Sambil",
            direccion: "C.C. Sambil Margarita, Entrada Playa El Yaque",
            telefono: "0295-2607777",
            horario: "Lunes a Domingo 10:00 AM - 9:00 PM",
            email: "sigosambil@sigo.com",
            password: await hashPassword("farmacia123"),
            latitude: 10.9988,
            longitude: -63.8141,
        },
    });

    // Farmacia Sigo - Parque Costazul
    await prisma.farmacia.create({
        data: {
            nombre: "Farmacia Sigo Costazul",
            direccion: "Av. Jóvito Villalba, C.C. Parque Costazul",
            telefono: "0295-2608888",
            horario: "Lunes a Domingo 9:00 AM - 9:00 PM",
            email: "sigocostazul@sigo.com",
            password: await hashPassword("farmacia123"),
            latitude: 10.9908,
            longitude: -63.8237,
        },
    });

    // Farmacia Sigo - La Proveeduría
    await prisma.farmacia.create({
        data: {
            nombre: "Farmacia Sigo La Proveeduría",
            direccion: "Av. Juan Bautista Arismendi, Porlamar",
            telefono: "0295-2609999",
            horario: "Lunes a Sábado 8:00 AM - 7:00 PM",
            email: "proveeduria@sigo.com",
            password: await hashPassword("farmacia123"),
            latitude: 10.9523,
            longitude: -63.8684,
        },
    });

    // Create Common Users
    console.log("👥 Creating common users...");
    const usuario1 = await prisma.usuarioComun.create({
        data: {
            nombre: "María García",
            email: "maria@example.com",
            password: await hashPassword("user123"),
            telefono: "0414-1234567",
            cedula: "V-12345678",
            direccion: { lat: 10.4806, lng: -66.9036 },
        },
    });

    const usuario2 = await prisma.usuarioComun.create({
        data: {
            nombre: "Carlos Rodríguez",
            email: "carlos@example.com",
            password: await hashPassword("user123"),
            telefono: "0424-7654321",
            cedula: "V-87654321",
            direccion: { lat: 10.4696, lng: -66.8796 },
        },
    });

    const usuario3 = await prisma.usuarioComun.create({
        data: {
            nombre: "Ana Martínez",
            email: "ana@example.com",
            password: await hashPassword("user123"),
            telefono: "0412-9876543",
            cedula: "V-11223344",
            direccion: { lat: 10.5000, lng: -66.9167 },
        },
    });

    const usuario4 = await prisma.usuarioComun.create({
        data: {
            nombre: "Luis Pérez",
            email: "luis@example.com",
            password: await hashPassword("user123"),
            telefono: "0416-5551234",
            cedula: "V-22334455",
            direccion: { lat: 10.4850, lng: -66.8650 },
        },
    });

    const usuario5 = await prisma.usuarioComun.create({
        data: {
            nombre: "Carmen López",
            email: "carmen@example.com",
            password: await hashPassword("user123"),
            telefono: "0426-8889999",
            cedula: "V-33445566",
            direccion: { lat: 10.4750, lng: -66.8850 },
        },
    });

    // Create Medications
    console.log("💉 Creating medications...");
    const medicamentos = await Promise.all([
        prisma.medicamento.create({
            data: {
                nombre: "Paracetamol",
                descripcion: "Analgésico y antipirético",
                principioActivo: "Paracetamol",
                presentacion: "Tabletas",
                concentracion: "500mg",
            },
        }),
        prisma.medicamento.create({
            data: {
                nombre: "Ibuprofeno",
                descripcion: "Antiinflamatorio no esteroideo",
                principioActivo: "Ibuprofeno",
                presentacion: "Tabletas",
                concentracion: "400mg",
            },
        }),
        prisma.medicamento.create({
            data: {
                nombre: "Amoxicilina",
                descripcion: "Antibiótico de amplio espectro",
                principioActivo: "Amoxicilina",
                presentacion: "Cápsulas",
                concentracion: "500mg",
            },
        }),
        prisma.medicamento.create({
            data: {
                nombre: "Losartán",
                descripcion: "Antihipertensivo",
                principioActivo: "Losartán potásico",
                presentacion: "Tabletas",
                concentracion: "50mg",
            },
        }),
        prisma.medicamento.create({
            data: {
                nombre: "Metformina",
                descripcion: "Antidiabético oral",
                principioActivo: "Metformina",
                presentacion: "Tabletas",
                concentracion: "850mg",
            },
        }),
        prisma.medicamento.create({
            data: {
                nombre: "Omeprazol",
                descripcion: "Inhibidor de bomba de protones",
                principioActivo: "Omeprazol",
                presentacion: "Cápsulas",
                concentracion: "20mg",
            },
        }),
        prisma.medicamento.create({
            data: {
                nombre: "Loratadina",
                descripcion: "Antihistamínico",
                principioActivo: "Loratadina",
                presentacion: "Tabletas",
                concentracion: "10mg",
            },
        }),
        prisma.medicamento.create({
            data: {
                nombre: "Insulina Lantus",
                descripcion: "Insulina de acción prolongada",
                principioActivo: "Insulina glargina",
                presentacion: "Inyectable",
                concentracion: "100 UI/ml",
            },
        }),
        prisma.medicamento.create({
            data: {
                nombre: "Enalapril",
                descripcion: "Inhibidor de ECA para hipertensión",
                principioActivo: "Enalapril maleato",
                presentacion: "Tabletas",
                concentracion: "10mg",
            },
        }),
        prisma.medicamento.create({
            data: {
                nombre: "Atorvastatina",
                descripcion: "Estatina para colesterol alto",
                principioActivo: "Atorvastatina cálcica",
                presentacion: "Tabletas",
                concentracion: "20mg",
            },
        }),
    ]);

    // Create Pending Requests
    console.log("📋 Creating pending requests...");
    await prisma.solicitud.create({
        data: {
            codigo: "SOL-001",
            motivo: "Paciente con dolor crónico, necesita medicamento urgente",
            estado: "PENDIENTE",
            tiempoEspera: "ALTO",
            direccion: { lat: 10.4806, lng: -66.9036 },
            requiresPrescription: true,
            usuarioComunId: usuario1.id,
            farmaciaId: farmacia1.id,
            medicamentos: {
                create: [
                    { medicamentoId: medicamentos[0].id, cantidad: 2, prioridad: 3 },
                    { medicamentoId: medicamentos[1].id, cantidad: 1, prioridad: 2 },
                ],
            },
        },
    });

    await prisma.solicitud.create({
        data: {
            codigo: "SOL-002",
            motivo: "Tratamiento de hipertensión en curso",
            estado: "PENDIENTE",
            tiempoEspera: "MEDIO",
            direccion: { lat: 10.4696, lng: -66.8796 },
            requiresPrescription: true,
            usuarioComunId: usuario2.id,
            medicamentos: {
                create: [
                    { medicamentoId: medicamentos[3].id, cantidad: 1, prioridad: 2 },
                ],
            },
        },
    });

    // Create APPROVED Requests (for donor testing)
    console.log("✅ Creating approved requests...");
    await prisma.solicitud.create({
        data: {
            codigo: "SOL-003",
            motivo: "Necesito medicamento para diabetes",
            estado: "APROBADA",
            tiempoEspera: "ALTO",
            direccion: { lat: 10.5000, lng: -66.9167 },
            requiresPrescription: true,
            usuarioComunId: usuario3.id,
            aprobadoPorEnteId: enteSalud.id,
            approvalDate: new Date(),
            approvalInstitution: enteSalud.nombre,
            medicamentos: {
                create: [
                    { medicamentoId: medicamentos[4].id, cantidad: 2, prioridad: 3 },
                    { medicamentoId: medicamentos[7].id, cantidad: 1, prioridad: 3 },
                ],
            },
        },
    });

    await prisma.solicitud.create({
        data: {
            codigo: "SOL-004",
            motivo: "Alergia estacional severa",
            estado: "APROBADA",
            tiempoEspera: "BAJO",
            direccion: { lat: 10.4850, lng: -66.8900 },
            requiresPrescription: false,
            usuarioComunId: usuario1.id,
            aprobadoPorEnteId: enteSalud.id,
            approvalDate: new Date(),
            approvalInstitution: enteSalud.nombre,
            medicamentos: {
                create: [
                    { medicamentoId: medicamentos[6].id, cantidad: 1, prioridad: 1 },
                ],
            },
        },
    });

    await prisma.solicitud.create({
        data: {
            codigo: "SOL-005",
            motivo: "Tratamiento para reflujo gástrico crónico",
            estado: "APROBADA",
            tiempoEspera: "MEDIO",
            direccion: { lat: 10.4780, lng: -66.8700 },
            requiresPrescription: true,
            usuarioComunId: usuario4.id,
            aprobadoPorEnteId: enteSalud.id,
            approvalDate: new Date(),
            approvalInstitution: enteSalud.nombre,
            medicamentos: {
                create: [
                    { medicamentoId: medicamentos[5].id, cantidad: 2, prioridad: 2 },
                ],
            },
        },
    });

    await prisma.solicitud.create({
        data: {
            codigo: "SOL-006",
            motivo: "Infección respiratoria que requiere antibiótico",
            estado: "APROBADA",
            tiempoEspera: "ALTO",
            direccion: { lat: 10.4920, lng: -66.8550 },
            requiresPrescription: true,
            usuarioComunId: usuario5.id,
            aprobadoPorEnteId: enteSalud.id,
            approvalDate: new Date(),
            approvalInstitution: enteSalud.nombre,
            medicamentos: {
                create: [
                    { medicamentoId: medicamentos[2].id, cantidad: 1, prioridad: 3 },
                ],
            },
        },
    });

    await prisma.solicitud.create({
        data: {
            codigo: "SOL-007",
            motivo: "Control de presión arterial",
            estado: "APROBADA",
            tiempoEspera: "MEDIO",
            direccion: { lat: 10.4650, lng: -66.8800 },
            requiresPrescription: true,
            usuarioComunId: usuario2.id,
            aprobadoPorEnteId: enteSalud.id,
            approvalDate: new Date(),
            approvalInstitution: enteSalud.nombre,
            medicamentos: {
                create: [
                    { medicamentoId: medicamentos[8].id, cantidad: 1, prioridad: 2 },
                ],
            },
        },
    });

    await prisma.solicitud.create({
        data: {
            codigo: "SOL-008",
            motivo: "Tratamiento colesterol alto",
            estado: "APROBADA",
            tiempoEspera: "BAJO",
            direccion: { lat: 10.4880, lng: -66.8620 },
            requiresPrescription: true,
            usuarioComunId: usuario3.id,
            aprobadoPorEnteId: enteSalud.id,
            approvalDate: new Date(),
            approvalInstitution: enteSalud.nombre,
            medicamentos: {
                create: [
                    { medicamentoId: medicamentos[9].id, cantidad: 1, prioridad: 1 },
                ],
            },
        },
    });

    await prisma.solicitud.create({
        data: {
            codigo: "SOL-009",
            motivo: "Dolor de cabeza frecuente",
            estado: "APROBADA",
            tiempoEspera: "BAJO",
            direccion: { lat: 10.4720, lng: -66.8950 },
            requiresPrescription: false,
            usuarioComunId: usuario4.id,
            aprobadoPorEnteId: enteSalud.id,
            approvalDate: new Date(),
            approvalInstitution: enteSalud.nombre,
            medicamentos: {
                create: [
                    { medicamentoId: medicamentos[0].id, cantidad: 1, prioridad: 1 },
                    { medicamentoId: medicamentos[1].id, cantidad: 1, prioridad: 1 },
                ],
            },
        },
    });

    await prisma.solicitud.create({
        data: {
            codigo: "SOL-010",
            motivo: "Necesito antiinflamatorio para artritis",
            estado: "APROBADA",
            tiempoEspera: "MEDIO",
            direccion: { lat: 10.4950, lng: -66.8480 },
            requiresPrescription: false,
            usuarioComunId: usuario5.id,
            aprobadoPorEnteId: enteSalud.id,
            approvalDate: new Date(),
            approvalInstitution: enteSalud.nombre,
            medicamentos: {
                create: [
                    { medicamentoId: medicamentos[1].id, cantidad: 2, prioridad: 2 },
                ],
            },
        },
    });

    // Create Donations
    console.log("🎁 Creating donations...");
    await prisma.donacion.create({
        data: {
            codigo: "DON-001",
            descripcion: "Donación de medicamentos excedentes",
            estado: "DISPONIBLE",
            direccion: { lat: 10.4900, lng: -66.8800 },
            usuarioComunId: usuario2.id,
            medicamentos: {
                create: [
                    {
                        medicamentoId: medicamentos[0].id,
                        cantidad: 10,
                        fechaExpiracion: new Date("2027-06-15"),
                        lote: "LOT-2024-001",
                    },
                    {
                        medicamentoId: medicamentos[5].id,
                        cantidad: 5,
                        fechaExpiracion: new Date("2027-03-20"),
                        lote: "LOT-2024-002",
                    },
                ],
            },
        },
    });

    await prisma.donacion.create({
        data: {
            codigo: "DON-002",
            descripcion: "Medicamentos de tratamiento finalizado",
            estado: "DISPONIBLE",
            direccion: { lat: 10.4750, lng: -66.9100 },
            enteSaludId: enteSalud.id,
            medicamentos: {
                create: [
                    {
                        medicamentoId: medicamentos[2].id,
                        cantidad: 20,
                        fechaExpiracion: new Date("2026-12-31"),
                        lote: "LOT-2024-003",
                    },
                ],
            },
        },
    });

    // Create Notifications
    console.log("🔔 Creating notifications...");
    await prisma.notificacion.create({
        data: {
            userId: usuario1.id,
            type: "SYSTEM",
            title: "Bienvenido a MediShare",
            message: "Tu cuenta ha sido creada exitosamente.",
            read: false,
        },
    });

    console.log("✅ Seed completed successfully!");
    console.log("\n📊 Summary:");
    console.log("   - 1 Administrator");
    console.log("   - 2 Health Entities");
    console.log("   - 9 Pharmacies (Margarita Island)");
    console.log("   - 5 Common Users");
    console.log("   - 10 Medications");
    console.log("   - 10 Requests (2 pending, 8 approved)");
    console.log("   - 2 Donations");
    console.log("\n🔑 Test credentials:");
    console.log("   Admin: admin@medishare.com / admin123");
    console.log("   Supervisor: supervisor@hospitalcentral.com / supervisor123");
    console.log("   User: maria@example.com / user123");
    console.log("   User: carlos@example.com / user123");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
