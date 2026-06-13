#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Destruyendo infraestructura local ===${NC}"

cd "$(dirname "$0")/../live/local"

echo -e "${YELLOW}Destruyendo recursos de Terragrunt...${NC}"
terragrunt run-all destroy -auto-approve

echo ""
echo -e "${YELLOW}Deteniendo contenedores Docker...${NC}"
cd "$(dirname "$0")/../local"
docker-compose down -v

echo -e "${GREEN}=== Limpieza completada ===${NC}"
