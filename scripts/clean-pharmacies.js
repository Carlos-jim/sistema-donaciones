require("dotenv").config();
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🗑️ Eliminando todas las farmacias de la base de datos...');
    try {
        await prisma.solicitud.updateMany({
            data: {
                farmaciaId: null,
                farmaciaEntregaId: null
            }
        });

        const count = await prisma.farmacia.deleteMany();
        console.log(`✅ Se han eliminado ${count.count} farmacias exitosamente.`);
    } catch (e) {
        console.error('❌ Error al eliminar farmacias:', e);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main();
