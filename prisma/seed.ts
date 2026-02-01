"use strict";
// Seed script to populate the database with test data
// Run with: pnpm tsx prisma/seed.ts

import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting seed...");

    // Clean existing data (optional - comment out if you want to keep existing data)
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
            password: await hash("admin123", 12),
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
            password: await hash("supervisor123", 12),
            aprobado: true,
            aprobadoPorId: admin.id,
        },
    });

    const enteSalud2 = await prisma.enteSalud.create({
        data: {
            nombre: "Clínica Santa María",
            direccion: "Av. Francisco de Miranda, Chacao, Caracas",
            telefono: "0212-5559876",
            email: "supervisor@clinicasantamaria.com",
            password: await hash("supervisor123", 12),
            aprobado: true,
            aprobadoPorId: admin.id,
        },
    });

    // Create Pharmacy
    console.log("💊 Creating pharmacies...");
    const farmacia = await prisma.farmacia.create({
        data: {
            nombre: "Farmacia Central",
            direccion: "Av. Libertador, Caracas",
            telefono: "0212-5554321",
            horario: "Lunes a Sábado 8:00 AM - 8:00 PM",
            email: "farmacia@farmacentral.com",
            password: await hash("farmacia123", 12),
        },
    });

    // Create Common Users
    console.log("👥 Creating common users...");
    const usuario1 = await prisma.usuarioComun.create({
        data: {
            nombre: "María García",
            email: "maria@example.com",
            password: await hash("user123", 12),
            telefono: "0414-1234567",
            cedula: "V-12345678",
            direccion: { lat: 10.4806, lng: -66.9036 },
        },
    });

    const usuario2 = await prisma.usuarioComun.create({
        data: {
            nombre: "Carlos Rodríguez",
            email: "carlos@example.com",
            password: await hash("user123", 12),
            telefono: "0424-7654321",
            cedula: "V-87654321",
            direccion: { lat: 10.4696, lng: -66.8796 },
        },
    });

    const usuario3 = await prisma.usuarioComun.create({
        data: {
            nombre: "Ana Martínez",
            email: "ana@example.com",
            password: await hash("user123", 12),
            telefono: "0412-9876543",
            cedula: "V-11223344",
            direccion: { lat: 10.5000, lng: -66.9167 },
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
    ]);

    // Create Pending Requests (Solicitudes)
    console.log("📋 Creating pending requests...");
    const solicitud1 = await prisma.solicitud.create({
        data: {
            codigo: "SOL-001",
            motivo: "Paciente con dolor crónico, necesita medicamento urgente",
            estado: "PENDIENTE",
            tiempoEspera: "ALTO",
            direccion: { lat: 10.4806, lng: -66.9036 },
            requiresPrescription: true,
            usuarioComunId: usuario1.id,
            farmaciaId: farmacia.id,
            medicamentos: {
                create: [
                    { medicamentoId: medicamentos[0].id, cantidad: 2, prioridad: 3 },
                    { medicamentoId: medicamentos[1].id, cantidad: 1, prioridad: 2 },
                ],
            },
        },
    });

    const solicitud2 = await prisma.solicitud.create({
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

    const solicitud3 = await prisma.solicitud.create({
        data: {
            codigo: "SOL-003",
            motivo: "Necesito medicamento para diabetes",
            estado: "PENDIENTE",
            tiempoEspera: "ALTO",
            direccion: { lat: 10.5000, lng: -66.9167 },
            requiresPrescription: true,
            usuarioComunId: usuario3.id,
            medicamentos: {
                create: [
                    { medicamentoId: medicamentos[4].id, cantidad: 2, prioridad: 3 },
                    { medicamentoId: medicamentos[7].id, cantidad: 1, prioridad: 3 },
                ],
            },
        },
    });

    // Create an approved request
    await prisma.solicitud.create({
        data: {
            codigo: "SOL-004",
            motivo: "Alergia estacional",
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
            message: "Tu cuenta ha sido creada exitosamente. ¡Comienza a solicitar o donar medicamentos!",
            read: false,
        },
    });

    await prisma.notificacion.create({
        data: {
            userId: usuario1.id,
            type: "MATCH_DONATION",
            title: "¡Nueva donación disponible!",
            message: "Hay Paracetamol disponible cerca de tu ubicación.",
            read: false,
            link: "/dashboard/donations",
        },
    });

    console.log("✅ Seed completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - 1 Administrator`);
    console.log(`   - 2 Health Entities (Supervisors)`);
    console.log(`   - 1 Pharmacy`);
    console.log(`   - 3 Common Users`);
    console.log(`   - 8 Medications`);
    console.log(`   - 4 Requests (3 pending, 1 approved)`);
    console.log(`   - 2 Donations`);
    console.log(`   - 2 Notifications`);
    console.log("\n🔑 Test credentials:");
    console.log("   Admin: admin@medishare.com / admin123");
    console.log("   Supervisor: supervisor@hospitalcentral.com / supervisor123");
    console.log("   User: maria@example.com / user123");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
