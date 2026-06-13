#!/bin/bash
set -e
exec > >(tee /var/log/user-data.log) 2>&1

echo "=== Iniciando configuración de EC2 para Next.js ==="

# Actualizar sistema
yum update -y

# Instalar utilidades
yum install -y git docker nginx

# Instalar Node.js
# Usar NodeSource para Node.js LTS
curl -fsSL https://rpm.nodesource.com/setup_${node_version}.x | bash -
yum install -y nodejs

# Verificar instalación
node --version
npm --version

# Instalar PM2 globalmente
npm install -g pm2

# Iniciar y habilitar Docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Crear directorio de la aplicación
mkdir -p /opt/donaciones
cd /opt/donaciones

# Crear archivo .env
cat > /opt/donaciones/.env << 'EOF'
DATABASE_URL=postgresql://${db_user}:${db_password}@${db_host}/${db_name}
NEXT_PUBLIC_API_URL=http://localhost:${app_port}
AWS_REGION=${aws_region}
S3_BUCKET_NAME=${s3_bucket}
EOF

# Nota: En un entorno real, aquí clonarías el repo o desplegarías el código
# git clone https://github.com/tu-org/donaciones.git /opt/donaciones
# cd /opt/donaciones
# npm install
# npm run build

# Configurar Nginx como reverse proxy
cat > /etc/nginx/conf.d/donaciones.conf << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:${app_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Remover configuración default de nginx
rm -f /etc/nginx/conf.d/default.conf

# Iniciar Nginx
systemctl start nginx
systemctl enable nginx

echo "=== Configuración completada ==="

# Nota: El despliegue de la aplicación se realiza mediante CI/CD o manualmente
# con: cd /opt/donaciones && npm install && npm run build && pm2 start npm --name "donaciones" -- start
