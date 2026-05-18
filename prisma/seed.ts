"use strict";
// Run with: npx dotenv-cli -e .env -- npx tsx prisma/seed.ts

import { PrismaNeonHttp } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { categoriasSeed, medicamentosSeed } from "./medicamentos-catalogo";

const adapter = new PrismaNeonHttp(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter } as any);

// Helper: create a solicitud then its medicamentos separately (no nested writes → no transactions)
async function createSolicitud(data: any, meds: { medicamentoId: string; cantidad: number; prioridad: number }[]) {
  const sol = await prisma.solicitud.create({ data });
  for (const m of meds) {
    await prisma.solicitudMedicamento.create({
      data: { solicitudId: sol.id, ...m },
    });
  }
  return sol;
}

async function createDonacion(data: any, meds: { medicamentoId: string; cantidad: number; fechaExpiracion?: Date; lote?: string }[]) {
  const don = await prisma.donacion.create({ data });
  for (const m of meds) {
    await prisma.donacionMedicamento.create({
      data: { donacionId: don.id, ...m },
    });
  }
  return don;
}

async function main() {
  console.log("🌱 Starting seed...");

  // ── Clean ──────────────────────────────────────────────────────────────────
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

  // ── Admin ──────────────────────────────────────────────────────────────────
  console.log("👤 Creating administrator...");
  const admin = await prisma.administrador.create({
    data: {
      nombre: "Admin Principal",
      email: "admin@medishare.com",
      password: await hash("admin123", 12),
      rol: "SUPER_ADMIN",
    },
  });

  // ── Entes de salud ─────────────────────────────────────────────────────────
  console.log("🏥 Creating health entities...");
  const ente1 = await prisma.enteSalud.create({
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

  await prisma.enteSalud.create({
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

  // ── Farmacias ──────────────────────────────────────────────────────────────
  console.log("💊 Creating pharmacies...");
  const farmacia1 = await prisma.farmacia.create({
    data: {
      nombre: "Farmatodo Sambil Margarita",
      direccion: "Av. Jovito Villalba, C.C. Sambil, Pampatar",
      telefono: "0295-2601111",
      horario: "Lunes a Domingo 8:00 AM - 10:00 PM",
      email: "sambil@farmatodo.com",
      password: await hash("farmacia123", 12),
      latitude: 10.996578,
      longitude: -63.8133486,
    },
  });

  const farmacia2 = await prisma.farmacia.create({
    data: {
      nombre: "Farmatodo Playa El Angel",
      direccion: "Av. Aldonza Manrique, Playa El Angel",
      telefono: "0295-2622222",
      horario: "Lunes a Domingo 24 Horas",
      email: "playaelangel@farmatodo.com",
      password: await hash("farmacia123", 12),
      latitude: 10.9878333,
      longitude: -63.8177528,
    },
  });

  await prisma.farmacia.create({
    data: {
      nombre: "Farmatodo C.C. La Vela",
      direccion: "C.C. La Vela, Nivel Planta, Urb. Costa Azul",
      telefono: "0295-2603333",
      horario: "Lunes a Domingo 9:00 AM - 9:00 PM",
      email: "lavela@farmatodo.com",
      password: await hash("farmacia123", 12),
      latitude: 10.9777303,
      longitude: -63.8195757,
    },
  });

  await prisma.farmacia.create({
    data: {
      nombre: "Farmatodo Jorge Coll",
      direccion: "Urb. Jorge Coll, Pampatar",
      telefono: "0295-2604444",
      horario: "Lunes a Domingo 8:00 AM - 9:00 PM",
      email: "jorgecoll@farmatodo.com",
      password: await hash("farmacia123", 12),
      latitude: 10.9947051,
      longitude: -63.8052786,
    },
  });

  await prisma.farmacia.create({
    data: {
      nombre: "Farmatodo La Asuncion",
      direccion: "Av. 31 de Julio, Sector Cocheima, La Asuncion",
      telefono: "0295-2605555",
      horario: "Lunes a Domingo 8:00 AM - 8:00 PM",
      email: "laasuncion@farmatodo.com",
      password: await hash("farmacia123", 12),
      latitude: 11.0402671,
      longitude: -63.8571535,
    },
  });

  await prisma.farmacia.create({
    data: {
      nombre: "Farmahorro Caribe",
      direccion: "Av. Jovito Villalba, Sector Caribe, Pampatar",
      telefono: "0295-2606666",
      horario: "Lunes a Domingo 8:00 AM - 10:00 PM",
      email: "caribe@farmahorro.com",
      password: await hash("farmacia123", 12),
      latitude: 10.9927,
      longitude: -63.825,
    },
  });

  await prisma.farmacia.create({
    data: {
      nombre: "Farmacia Sigo Sambil",
      direccion: "C.C. Sambil Margarita, Entrada Playa El Yaque",
      telefono: "0295-2607777",
      horario: "Lunes a Domingo 10:00 AM - 9:00 PM",
      email: "sigosambil@sigo.com",
      password: await hash("farmacia123", 12),
      latitude: 10.9988,
      longitude: -63.8141,
    },
  });

  await prisma.farmacia.create({
    data: {
      nombre: "Farmacia Sigo Costazul",
      direccion: "Av. Jovito Villalba, C.C. Parque Costazul",
      telefono: "0295-2608888",
      horario: "Lunes a Domingo 9:00 AM - 9:00 PM",
      email: "sigocostazul@sigo.com",
      password: await hash("farmacia123", 12),
      latitude: 10.9908,
      longitude: -63.8237,
    },
  });

  await prisma.farmacia.create({
    data: {
      nombre: "Farmacia Sigo La Proveeduria",
      direccion: "Av. Juan Bautista Arismendi, Porlamar",
      telefono: "0295-2609999",
      horario: "Lunes a Sabado 8:00 AM - 7:00 PM",
      email: "proveeduria@sigo.com",
      password: await hash("farmacia123", 12),
      latitude: 10.9523,
      longitude: -63.8684,
    },
  });

  // ── Usuarios ───────────────────────────────────────────────────────────────
  console.log("👥 Creating users...");
  const testUser = await prisma.usuarioComun.create({
    data: {
      nombre: "Usuario de Prueba",
      email: "test@example.com",
      password: await hash("test123", 12),
      telefono: "0414-5550000",
      cedula: "V-20000001",
      direccion: { lat: 10.4806, lng: -66.9036, address: "Av. Libertador, Caracas" },
    },
  });

  const usuario2 = await prisma.usuarioComun.create({
    data: {
      nombre: "María García",
      email: "maria@example.com",
      password: await hash("user123", 12),
      telefono: "0414-1234567",
      cedula: "V-12345678",
      direccion: { lat: 10.4806, lng: -66.9036 },
    },
  });

  const usuario3 = await prisma.usuarioComun.create({
    data: {
      nombre: "Carlos Rodríguez",
      email: "carlos@example.com",
      password: await hash("user123", 12),
      telefono: "0424-7654321",
      cedula: "V-87654321",
      direccion: { lat: 10.4696, lng: -66.8796 },
    },
  });

  const usuario4 = await prisma.usuarioComun.create({
    data: {
      nombre: "Ana Martínez",
      email: "ana@example.com",
      password: await hash("user123", 12),
      telefono: "0412-9876543",
      cedula: "V-11223344",
      direccion: { lat: 10.5, lng: -66.9167 },
    },
  });

  const usuario5 = await prisma.usuarioComun.create({
    data: {
      nombre: "Luis Pérez",
      email: "luis@example.com",
      password: await hash("user123", 12),
      telefono: "0416-3334444",
      cedula: "V-15678901",
      direccion: { lat: 10.488, lng: -66.893 },
    },
  });

  // ── Categorías de Medicamentos ─────────────────────────────────────────────
  console.log("📂 Creating medical supply categories...");
  const categoriaMap = new Map<string, string>();
  for (const cat of categoriasSeed) {
    const created = await prisma.categoriaMedicamento.create({
      data: {
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        icono: cat.icono,
        orden: cat.orden,
      },
    });
    categoriaMap.set(cat.nombre, created.id);
  }

  // ── Medicamentos desde Catálogo Estandarizado ──────────────────────────────
  console.log("💉 Creating standardized medical supply catalog...");
  const medicamentoMap = new Map<string, any>();

  for (const med of medicamentosSeed) {
    const categoriaId = categoriaMap.get(med.categoriaNombre);
    const created = await prisma.medicamento.create({
      data: {
        nombre: med.nombre,
        descripcion: med.descripcion,
        principioActivo: med.principioActivo,
        presentacion: med.presentacion,
        concentracion: med.concentracion,
        categoriaId: categoriaId || undefined,
      },
    });
    medicamentoMap.set(med.nombre, created);
  }

  // Alias para compatibilidad con el resto del seed
  const paracetamol    = medicamentoMap.get("Paracetamol");
  const ibuprofeno     = medicamentoMap.get("Ibuprofeno");
  const amoxicilina    = medicamentoMap.get("Amoxicilina");
  const losartan       = medicamentoMap.get("Losartán");
  const metformina     = medicamentoMap.get("Metformina");
  const omeprazol      = medicamentoMap.get("Omeprazol");
  const loratadina     = medicamentoMap.get("Loratadina");
  const insulina       = medicamentoMap.get("Insulina Glargina (Lantus)");
  const atorvastatina  = medicamentoMap.get("Atorvastatina");
  const enalapril      = medicamentoMap.get("Enalapril");
  const aspirina       = medicamentoMap.get("Aspirina Cardio");
  const azitromicina   = medicamentoMap.get("Azitromicina");

  // ── Solicitudes para TEST USER (todos los estados) ─────────────────────────
  console.log("📋 Creating requests for test user...");

  await createSolicitud({
    codigo: "SOL-T001", motivo: "Necesito Paracetamol para dolor crónico de columna",
    estado: "PENDIENTE", tiempoEspera: "ALTO", requiresPrescription: false,
    direccion: { lat: 10.4806, lng: -66.9036, calle: "Av. Libertador, Caracas" },
    usuarioComunId: testUser.id,
  }, [
    { medicamentoId: paracetamol.id, cantidad: 30, prioridad: 3 },
    { medicamentoId: ibuprofeno.id,  cantidad: 20, prioridad: 2 },
  ]);

  await createSolicitud({
    codigo: "SOL-T002", motivo: "Tratamiento de hipertensión arterial — tercer mes de terapia",
    estado: "PENDIENTE", tiempoEspera: "MEDIO", requiresPrescription: true,
    direccion: { lat: 10.4806, lng: -66.9036, calle: "Av. Libertador, Caracas" },
    usuarioComunId: testUser.id,
  }, [
    { medicamentoId: losartan.id,  cantidad: 30, prioridad: 3 },
    { medicamentoId: enalapril.id, cantidad: 30, prioridad: 2 },
  ]);

  await createSolicitud({
    codigo: "SOL-T003", motivo: "Control de diabetes tipo 2",
    estado: "APROBADA", tiempoEspera: "ALTO", requiresPrescription: true,
    direccion: { lat: 10.4806, lng: -66.9036, calle: "Av. Libertador, Caracas" },
    usuarioComunId: testUser.id,
    aprobadoPorEnteId: ente1.id,
    approvalDate: new Date(Date.now() - 2 * 86400000),
    approvalInstitution: ente1.nombre,
  }, [
    { medicamentoId: metformina.id, cantidad: 60, prioridad: 3 },
    { medicamentoId: insulina.id,   cantidad: 2,  prioridad: 3 },
  ]);

  await createSolicitud({
    codigo: "SOL-T004", motivo: "Alergia estacional severa",
    estado: "EN_PROCESO", tiempoEspera: "MEDIO", requiresPrescription: false,
    direccion: { lat: 10.4806, lng: -66.9036, calle: "Av. Libertador, Caracas" },
    usuarioComunId: testUser.id,
    aprobadoPorEnteId: ente1.id,
    approvalDate: new Date(Date.now() - 5 * 86400000),
    approvalInstitution: ente1.nombre,
    donanteAsignadoId: usuario2.id,
    assignedDate: new Date(Date.now() - 3 * 86400000),
    farmaciaEntregaId: farmacia1.id,
    farmaciaConfirmada: null,
    codigoComprobante: "COMP-T004-XK9",
  }, [
    { medicamentoId: loratadina.id, cantidad: 20, prioridad: 2 },
  ]);

  await createSolicitud({
    codigo: "SOL-T005", motivo: "Dolor de estómago recurrente",
    estado: "EN_PROCESO", tiempoEspera: "BAJO", requiresPrescription: false,
    direccion: { lat: 10.4806, lng: -66.9036, calle: "Av. Libertador, Caracas" },
    usuarioComunId: testUser.id,
    aprobadoPorEnteId: ente1.id,
    approvalDate: new Date(Date.now() - 7 * 86400000),
    approvalInstitution: ente1.nombre,
    donanteAsignadoId: usuario3.id,
    assignedDate: new Date(Date.now() - 5 * 86400000),
    farmaciaEntregaId: farmacia2.id,
    farmaciaConfirmada: false,
    motivoRechazoFarmacia: "Me queda muy lejos, no tengo transporte hasta allá",
    codigoComprobante: "COMP-T005-ZM2",
  }, [
    { medicamentoId: omeprazol.id, cantidad: 30, prioridad: 1 },
  ]);

  await createSolicitud({
    codigo: "SOL-T006", motivo: "Prevención cardiovascular — tomo Aspirina diaria",
    estado: "LISTA_PARA_RETIRO", tiempoEspera: "BAJO", requiresPrescription: false,
    direccion: { lat: 10.4806, lng: -66.9036, calle: "Av. Libertador, Caracas" },
    usuarioComunId: testUser.id,
    aprobadoPorEnteId: ente1.id,
    approvalDate: new Date(Date.now() - 10 * 86400000),
    approvalInstitution: ente1.nombre,
    donanteAsignadoId: usuario4.id,
    assignedDate: new Date(Date.now() - 8 * 86400000),
    farmaciaEntregaId: farmacia1.id,
    farmaciaConfirmada: true,
    codigoComprobante: "COMP-T006-AB3",
    deliveryConfirmedAt: new Date(Date.now() - 1 * 86400000),
  }, [
    { medicamentoId: aspirina.id,      cantidad: 60, prioridad: 1 },
    { medicamentoId: atorvastatina.id, cantidad: 30, prioridad: 2 },
  ]);

  await createSolicitud({
    codigo: "SOL-T007", motivo: "Infección respiratoria",
    estado: "COMPLETADA", tiempoEspera: "ALTO", requiresPrescription: true,
    direccion: { lat: 10.4806, lng: -66.9036, calle: "Av. Libertador, Caracas" },
    usuarioComunId: testUser.id,
    aprobadoPorEnteId: ente1.id,
    approvalDate: new Date(Date.now() - 20 * 86400000),
    approvalInstitution: ente1.nombre,
    donanteAsignadoId: usuario5.id,
    assignedDate: new Date(Date.now() - 18 * 86400000),
    farmaciaEntregaId: farmacia1.id,
    farmaciaConfirmada: true,
    codigoComprobante: "COMP-T007-CD5",
    deliveryConfirmedAt: new Date(Date.now() - 14 * 86400000),
    pickupConfirmedAt: new Date(Date.now() - 13 * 86400000),
    receptionConfirmedAt: new Date(Date.now() - 13 * 86400000),
  }, [
    { medicamentoId: amoxicilina.id,  cantidad: 15, prioridad: 3 },
    { medicamentoId: azitromicina.id, cantidad: 3,  prioridad: 3 },
  ]);

  await createSolicitud({
    codigo: "SOL-T008", motivo: "Necesito insulina sin récipe",
    estado: "RECHAZADA", tiempoEspera: "ALTO", requiresPrescription: true,
    direccion: { lat: 10.4806, lng: -66.9036, calle: "Av. Libertador, Caracas" },
    usuarioComunId: testUser.id,
    aprobadoPorEnteId: ente1.id,
    approvalDate: new Date(Date.now() - 30 * 86400000),
    rejectionReason: "La solicitud de Insulina Lantus requiere récipe médico vigente. Adjunte la prescripción de su médico tratante.",
  }, [
    { medicamentoId: insulina.id, cantidad: 3, prioridad: 3 },
  ]);

  await createSolicitud({
    codigo: "SOL-T009", motivo: "Ya conseguí el insumo médico por otra vía",
    estado: "CANCELADA", tiempoEspera: "BAJO", requiresPrescription: false,
    direccion: { lat: 10.4806, lng: -66.9036, calle: "Av. Libertador, Caracas" },
    usuarioComunId: testUser.id,
  }, [
    { medicamentoId: paracetamol.id, cantidad: 10, prioridad: 1 },
  ]);

  // ── Donaciones para TEST USER ──────────────────────────────────────────────
  console.log("🎁 Creating donations for test user...");

  await createDonacion({
    codigo: "DON-T001", descripcion: "Insumos médicos que me sobraron del tratamiento",
    estado: "DISPONIBLE", direccion: { lat: 10.4806, lng: -66.9036 },
    usuarioComunId: testUser.id,
  }, [
    { medicamentoId: paracetamol.id, cantidad: 20, fechaExpiracion: new Date("2027-06-15"), lote: "LOT-T-001" },
    { medicamentoId: omeprazol.id,   cantidad: 10, fechaExpiracion: new Date("2027-01-30"), lote: "LOT-T-002" },
  ]);

  await createDonacion({
    codigo: "DON-T002", descripcion: "Losartán — ya no lo necesito tras cambio de tratamiento",
    estado: "RESERVADA", direccion: { lat: 10.4806, lng: -66.9036 },
    usuarioComunId: testUser.id,
  }, [
    { medicamentoId: losartan.id, cantidad: 30, fechaExpiracion: new Date("2026-09-30"), lote: "LOT-T-003" },
  ]);

  await createDonacion({
    codigo: "DON-T003", descripcion: "Antibióticos sobrantes en perfecto estado",
    estado: "ENTREGADA", direccion: { lat: 10.4806, lng: -66.9036 },
    usuarioComunId: testUser.id,
  }, [
    { medicamentoId: amoxicilina.id, cantidad: 8, fechaExpiracion: new Date("2026-03-01"), lote: "LOT-T-004" },
  ]);

  // ── Donaciones de otros usuarios ───────────────────────────────────────────
  console.log("🎁 Creating general donations...");

  await createDonacion({
    codigo: "DON-001", descripcion: "Donación de insumos médicos excedentes del hogar",
    estado: "DISPONIBLE", direccion: { lat: 10.49, lng: -66.88 },
    usuarioComunId: usuario2.id,
  }, [
    { medicamentoId: ibuprofeno.id,  cantidad: 15, fechaExpiracion: new Date("2027-06-15"), lote: "LOT-001" },
    { medicamentoId: loratadina.id,  cantidad: 10, fechaExpiracion: new Date("2027-03-20"), lote: "LOT-002" },
  ]);

  await createDonacion({
    codigo: "DON-002", descripcion: "Insumos médicos de tratamiento finalizado",
    estado: "DISPONIBLE", direccion: { lat: 10.475, lng: -66.91 },
    enteSaludId: ente1.id,
  }, [
    { medicamentoId: amoxicilina.id,  cantidad: 20, fechaExpiracion: new Date("2026-12-31"), lote: "LOT-003" },
    { medicamentoId: azitromicina.id, cantidad: 6,  fechaExpiracion: new Date("2026-10-15"), lote: "LOT-004" },
  ]);

  await createDonacion({
    codigo: "DON-003", descripcion: "Insumos médicos cardíacos excedentes",
    estado: "DISPONIBLE", direccion: { lat: 10.50, lng: -66.87 },
    usuarioComunId: usuario3.id,
  }, [
    { medicamentoId: atorvastatina.id, cantidad: 25, fechaExpiracion: new Date("2027-08-30"), lote: "LOT-005" },
    { medicamentoId: aspirina.id,      cantidad: 50, fechaExpiracion: new Date("2027-12-31"), lote: "LOT-006" },
  ]);

  await createDonacion({
    codigo: "DON-004", descripcion: "Antidiabéticos — cambio de tratamiento",
    estado: "DISPONIBLE", direccion: { lat: 10.495, lng: -66.895 },
    usuarioComunId: usuario4.id,
  }, [
    { medicamentoId: metformina.id, cantidad: 60, fechaExpiracion: new Date("2026-11-30"), lote: "LOT-007" },
  ]);

  // ── Solicitudes pendientes para el panel del supervisor ────────────────────
  console.log("📋 Creating general pending requests...");

  await createSolicitud({
    codigo: "SOL-001", motivo: "Paciente con dolor crónico, necesita insumo médico urgente",
    estado: "PENDIENTE", tiempoEspera: "ALTO", requiresPrescription: true,
    direccion: { lat: 10.4806, lng: -66.9036, calle: "San Bernardino, Caracas" },
    usuarioComunId: usuario2.id,
  }, [
    { medicamentoId: paracetamol.id, cantidad: 2, prioridad: 3 },
    { medicamentoId: ibuprofeno.id,  cantidad: 1, prioridad: 2 },
  ]);

  await createSolicitud({
    codigo: "SOL-002", motivo: "Tratamiento de hipertensión en curso",
    estado: "PENDIENTE", tiempoEspera: "MEDIO", requiresPrescription: true,
    direccion: { lat: 10.4696, lng: -66.8796, calle: "Chacao, Caracas" },
    usuarioComunId: usuario3.id,
  }, [
    { medicamentoId: losartan.id,  cantidad: 1, prioridad: 2 },
    { medicamentoId: enalapril.id, cantidad: 1, prioridad: 2 },
  ]);

  await createSolicitud({
    codigo: "SOL-003", motivo: "Insulina urgente — paciente diabético tipo 1",
    estado: "PENDIENTE", tiempoEspera: "ALTO", requiresPrescription: true,
    direccion: { lat: 10.5, lng: -66.9167, calle: "Los Chaguaramos, Caracas" },
    usuarioComunId: usuario4.id,
  }, [
    { medicamentoId: insulina.id,   cantidad: 2, prioridad: 3 },
    { medicamentoId: metformina.id, cantidad: 2, prioridad: 2 },
  ]);

  await createSolicitud({
    codigo: "SOL-004", motivo: "Alergia estacional — inicio de temporada de lluvia",
    estado: "PENDIENTE", tiempoEspera: "BAJO", requiresPrescription: false,
    direccion: { lat: 10.485, lng: -66.89, calle: "Bello Campo, Caracas" },
    usuarioComunId: usuario5.id,
  }, [
    { medicamentoId: loratadina.id, cantidad: 1, prioridad: 1 },
  ]);

  // ── Notificaciones ─────────────────────────────────────────────────────────
  console.log("🔔 Creating notifications...");
  const notifData = [
    { userId: testUser.id, type: "SYSTEM",        title: "¡Bienvenido a MediShareNE!",               message: "Tu cuenta fue creada exitosamente. Puedes solicitar o donar insumos médicos desde tu panel.", read: true,  link: null                  },
    { userId: testUser.id, type: "MATCH_DONATION", title: "Nueva donación de Ibuprofeno disponible",  message: "Carlos Rodríguez donó 15 tabletas de Ibuprofeno cerca de tu ubicación.",                 read: false, link: "/dashboard/browse"   },
    { userId: testUser.id, type: "MATCH_REQUEST",  title: "Tu solicitud SOL-T003 fue aprobada",       message: "Hospital Central de Caracas aprobó tu solicitud de Metformina e Insulina.",               read: false, link: "/dashboard/requests" },
    { userId: testUser.id, type: "MATCH_DONATION", title: "Donante asignado a tu solicitud SOL-T004", message: "María García aceptó donar Loratadina. Revisa la farmacia propuesta y confírmala.",          read: false, link: "/dashboard/requests" },
    { userId: testUser.id, type: "SYSTEM",         title: "Tu insumo médico está listo para retiro",    message: "SOL-T006: Aspirina lista en Farmatodo Sambil Margarita. Confirma que irás a retirarla.",    read: false, link: "/dashboard/requests" },
    { userId: testUser.id, type: "SYSTEM",         title: "Solicitud SOL-T008 rechazada",             message: "Tu solicitud de Insulina fue rechazada por falta de récipe médico vigente.",                read: true,  link: "/dashboard/requests" },
    { userId: usuario2.id, type: "SYSTEM",         title: "Bienvenido a MediShareNE",                 message: "Tu cuenta fue creada exitosamente.",                                                        read: false, link: null                  },
    { userId: usuario2.id, type: "MATCH_REQUEST",  title: "¡Alguien necesita tu insumo médico!",        message: "Hay una solicitud de Paracetamol cerca de ti. ¡Considera donar!",                          read: false, link: "/dashboard/browse"   },
  ];
  for (const n of notifData) {
    await prisma.notificacion.create({ data: n });
  }

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log("   - 1 Administrator");
  console.log("   - 2 Health Entities");
  console.log("   - 9 Pharmacies (Margarita Island)");
  console.log("   - 5 Users");
  console.log("   - 12 Medical supplies");
  console.log("   - 13 Requests (9 for test user covering all states + 4 pending others)");
  console.log("   - 7 Donations (3 for test user + 4 others available)");
  console.log("   - 8 Notifications");
  console.log("\n🔑 Credentials:");
  console.log("   test@example.com              → test123");
  console.log("   admin@medishare.com           → admin123");
  console.log("   supervisor@hospitalcentral.com → supervisor123");
  console.log("   sambil@farmatodo.com          → farmacia123");
  console.log("   maria@example.com             → user123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
