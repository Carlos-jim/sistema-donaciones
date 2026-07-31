-- Add missing EstadoSolicitud enum values present in schema.prisma but never migrated
ALTER TYPE "EstadoSolicitud" ADD VALUE IF NOT EXISTS 'EN_PROCESO';
ALTER TYPE "EstadoSolicitud" ADD VALUE IF NOT EXISTS 'RECIBIDA';
ALTER TYPE "EstadoSolicitud" ADD VALUE IF NOT EXISTS 'LISTA_PARA_RETIRO';
ALTER TYPE "EstadoSolicitud" ADD VALUE IF NOT EXISTS 'CANCELADA';
