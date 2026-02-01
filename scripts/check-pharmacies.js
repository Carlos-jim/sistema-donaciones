require("dotenv").config();
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🔍 Verificando coordenadas de farmacias...');
    const farmacias = await prisma.farmacia.findMany();

    console.log(JSON.stringify(farmacias.map(f => ({
        nombre: f.nombre,
        lat: f.latitude,
        lng: f.longitude
    })), null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
