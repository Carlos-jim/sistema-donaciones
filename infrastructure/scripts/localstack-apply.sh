#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Aplicando infraestructura contra LocalStack ===${NC}"

cd "$(dirname "$0")/../live/local"

echo -e "${YELLOW}Inicializando Terragrunt...${NC}"
terragrunt run-all init

echo -e "${YELLOW}Generando plan...${NC}"
terragrunt run-all plan

echo ""
read -p "¿Deseas aplicar los cambios? (y/N): " confirm
if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
    echo -e "${YELLOW}Aplicando infraestructura...${NC}"
    terragrunt run-all apply -auto-approve
    echo -e "${GREEN}=== Infraestructura aplicada ===${NC}"
else
    echo -e "${YELLOW}Aplicación cancelada.${NC}"
fi
