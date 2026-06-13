#!/bin/bash
set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Inicialización de LocalStack para Sistema de Donaciones ===${NC}"

# Verificar que Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker no está corriendo. Por favor inicia Docker primero.${NC}"
    exit 1
fi

# Iniciar LocalStack y PostgreSQL
echo -e "${YELLOW}Iniciando contenedores...${NC}"
cd "$(dirname "$0")/../local"

# Copiar .env si no existe
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}Archivo .env creado desde .env.example${NC}"
fi

docker-compose up -d

# Esperar a que LocalStack esté listo
echo -e "${YELLOW}Esperando a que LocalStack esté listo...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:4566/_localstack/health | grep -q '"s3": "available"'; then
        echo -e "${GREEN}LocalStack está listo!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

# Verificar salud de PostgreSQL
echo -e "${YELLOW}Verificando PostgreSQL...${NC}"
for i in {1..30}; do
    if docker-compose exec -T postgres pg_isready -U donaciones_admin > /dev/null 2>&1; then
        echo -e "${GREEN}PostgreSQL está listo!${NC}"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo -e "${GREEN}=== LocalStack inicializado correctamente ===${NC}"
echo ""
echo "Servicios disponibles:"
echo "  - LocalStack: http://localhost:4566"
echo "  - PostgreSQL: localhost:5432"
echo "  - Next.js App: http://localhost:3000 (si usas docker-compose app)"
echo ""
echo "Para aplicar infraestructura con Terragrunt:"
echo "  cd infrastructure/live/local"
echo "  terragrunt run-all apply"
echo ""
echo "Para ver logs:"
echo "  docker-compose logs -f localstack"
echo ""
echo "Para detener:"
echo "  docker-compose down"
