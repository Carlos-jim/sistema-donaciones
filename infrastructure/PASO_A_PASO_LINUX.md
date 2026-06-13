# 📋 Guía Paso a Paso: Infraestructura con Terragrunt + LocalStack + AWS (Linux)

> **Objetivo**: Levantar la infraestructura del Sistema de Donaciones **localmente sin costos** usando LocalStack, y luego desplegar en **AWS real** (dev/prod) con CI/CD automático.
>
> **Plataforma**: Linux (Ubuntu/Debian/Fedora/Arch)

---

## FASE 1: Preparar tu sistema (Haz esto una sola vez)

### 1.1 Actualizar el sistema

```bash
# Ubuntu / Debian
sudo apt update && sudo apt upgrade -y

# Fedora
sudo dnf update -y

# Arch Linux
sudo pacman -Syu
```

### 1.2 Instalar herramientas base

```bash
# Ubuntu / Debian
sudo apt install -y curl wget git unzip gnupg lsb-release software-properties-common

# Fedora
sudo dnf install -y curl wget git unzip gnupg2

# Arch Linux
sudo pacman -S --needed curl wget git unzip gnupg
```

### 1.3 Instalar Docker Engine

```bash
# Ubuntu / Debian (método recomendado)
# Desinstalar versiones antiguas si existen
for pkg in docker.io docker-doc docker-compose docker-compose-v2 podman-docker containerd runc; do
  sudo apt-get remove $pkg 2>/dev/null || true
done

# Agregar repositorio oficial de Docker
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Fedora
sudo dnf -y install dnf-plugins-core
sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Arch Linux
sudo pacman -S --needed docker docker-compose

# Agregar tu usuario al grupo docker (para no usar sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verificar
sudo systemctl start docker
sudo systemctl enable docker
docker --version
docker compose version
```

### 1.4 Instalar Terraform

```bash
# Ubuntu / Debian (método oficial)
wget -O- https://apt.releases.hashicorp.com/gpg | \
  gpg --dearmor | \
  sudo tee /usr/share/keyrings/hashicorp-archive-keyring.gpg > /dev/null

echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
  https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
  sudo tee /etc/apt/sources.list.d/hashicorp.list

sudo apt update && sudo apt install -y terraform

# Fedora
sudo dnf install -y dnf-plugins-core
sudo dnf config-manager --add-repo https://rpm.releases.hashicorp.com/fedora/hashicorp.repo
sudo dnf install -y terraform

# Arch Linux
sudo pacman -S --needed terraform

# Verificar
terraform -version
```

### 1.5 Instalar Terragrunt

```bash
# Descargar la última versión
TERRAGRUNT_VERSION="v0.58.0"
TERRAGRUNT_URL="https://github.com/gruntwork-io/terragrunt/releases/download/${TERRAGRUNT_VERSION}/terragrunt_linux_amd64"

sudo curl -L -o /usr/local/bin/terragrunt "${TERRAGRUNT_URL}"
sudo chmod +x /usr/local/bin/terragrunt

# Verificar
terragrunt --version
```

### 1.6 Instalar AWS CLI

```bash
# Ubuntu / Debian / Fedora
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip aws/

# Arch Linux
sudo pacman -S --needed aws-cli

# Verificar
aws --version

# Configurar un perfil para LocalStack
aws configure --profile localstack
# Access Key: test
# Secret Key: test
# Region: us-east-1
# Output: json
```

### 1.7 Instalar Node.js (para tu app Next.js)

```bash
# Ubuntu / Debian (usando NodeSource para Node.js 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Fedora
sudo dnf install -y nodejs npm

# Arch Linux
sudo pacman -S --needed nodejs npm

# Verificar
node --version
npm --version
```

### 1.8 Instalar PostgreSQL client (opcional, para pruebas)

```bash
# Ubuntu / Debian
sudo apt install -y postgresql-client

# Fedora
sudo dnf install -y postgresql

# Arch Linux
sudo pacman -S --needed postgresql-libs

# Verificar
psql --version
```

---

## FASE 2: Levantar la infraestructura LOCAL (sin costos)

### 2.1 Ir a la carpeta del proyecto

```bash
# Asumiendo que el proyecto está en tu home
cd ~/donaciones

# O si lo vas a clonar desde GitHub
git clone https://github.com/tu-usuario/donaciones.git
cd donaciones
```

### 2.2 Iniciar LocalStack y PostgreSQL

```bash
# Dar permisos de ejecución a los scripts
chmod +x infrastructure/scripts/*.sh

# Ejecutar script de inicialización
./infrastructure/scripts/localstack-init.sh
```

> Este script hará:
> - Verificar que Docker está corriendo
> - Levantar los contenedores con `docker-compose`
> - Esperar a que LocalStack esté listo
> - Esperar a que PostgreSQL esté listo

> ⏳ Este paso puede tardar **3-7 minutos** la primera vez (descarga imágenes).

### 2.3 Verificar que todo está corriendo

```bash
# Verificar contenedores
docker ps

# Debes ver 2 contenedores:
# - localstack
# - local-postgres

# Verificar salud de LocalStack
curl -s http://localhost:4566/_localstack/health | jq .

# Si no tienes jq instalado:
# sudo apt install jq  # Ubuntu/Debian
# sudo dnf install jq  # Fedora
# sudo pacman -S jq    # Arch

# Verificar PostgreSQL
docker exec local-postgres pg_isready -U donaciones_admin

# Conectar directamente a PostgreSQL
psql -h localhost -U donaciones_admin -d donaciones -c "SELECT 1;"
# Password: localpassword123
```

### 2.4 Aplicar la infraestructura con Terragrunt

```bash
# Script automatizado
./infrastructure/scripts/localstack-apply.sh

# O manualmente:
cd infrastructure/live/local

# Inicializar módulos
terragrunt run-all init

# Ver plan (qué va a crear)
terragrunt run-all plan

# Aplicar (crear todo)
terragrunt run-all apply

# Si quieres ver los outputs
terragrunt run-all output
```

Esto creará:
- ✅ VPC simulada
- ✅ Subnets simuladas
- ✅ Security Groups simulados
- ✅ Bucket S3 local: `donaciones-local-recetas`
- ✅ Instancia EC2 simulada
- ✅ RDS simulado (en realidad usa el contenedor PostgreSQL)

### 2.5 Verificar que los servicios funcionan

```bash
# Listar buckets S3 locales
aws --endpoint-url=http://localhost:4566 --profile localstack s3 ls

# Listar instancias EC2 locales
aws --endpoint-url=http://localhost:4566 --profile localstack ec2 describe-instances

# Ver el contenido del bucket
aws --endpoint-url=http://localhost:4566 --profile localstack s3 ls s3://donaciones-local-recetas/

# Ver logs de LocalStack (en otra terminal)
docker-compose -f infrastructure/local/docker-compose.yml logs -f localstack
```

### 2.6 Conectar tu aplicación Next.js a la base de datos local

Crea o edita tu archivo `.env` en la raíz del proyecto:

```bash
# En la raíz del proyecto
cat > .env << 'EOF'
# Base de datos local
DATABASE_URL=postgresql://donaciones_admin:localpassword123@localhost:5432/donaciones

# AWS LocalStack
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL=http://localhost:4566

# S3
S3_BUCKET_NAME=donaciones-local-recetas

# Next.js
NEXT_PUBLIC_API_URL=http://localhost:3000
EOF
```

Luego instala dependencias y corre la app:

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Aplicar migraciones a la base local
npx prisma migrate dev

# Iniciar servidor de desarrollo
npm run dev
```

Tu app debería estar corriendo en http://localhost:3000

### 2.7 Probar subir una imagen a S3 local

```bash
# Crear un archivo de prueba
echo "receta de prueba" > /tmp/test-receta.txt

# Subir a S3 local
aws --endpoint-url=http://localhost:4566 --profile localstack \
  s3 cp /tmp/test-receta.txt s3://donaciones-local-recetas/recetas/

# Verificar que está en el bucket
aws --endpoint-url=http://localhost:4566 --profile localstack \
  s3 ls s3://donaciones-local-recetas/recetas/

# Descargar de vuelta
aws --endpoint-url=http://localhost:4566 --profile localstack \
  s3 cp s3://donaciones-local-recetas/recetas/test-receta.txt /tmp/descargado.txt

cat /tmp/descargado.txt
```

### 2.8 Destruir infraestructura local (cuando termines)

```bash
# Script automatizado
./infrastructure/scripts/localstack-destroy.sh

# Esto destruye:
# - Los recursos de Terragrunt
# - Los contenedores Docker
# - Los volúmenes (incluyendo datos de PostgreSQL)
```

---

## FASE 3: Configurar AWS REAL (Dev)

### 3.1 Crear una cuenta de AWS

- Ve a https://aws.amazon.com/
- Crea una cuenta (tienes **capa gratuita por 12 meses**)
- Activa autenticación multifactor (MFA) en tu usuario root
- **Importante**: Activa alertas de facturación (Billing alerts) para no tener sorpresas

### 3.2 Crear un usuario IAM para Terraform

Haz esto en la **Consola de AWS** (no en terminal):

1. Ve a **AWS Console** → **IAM** → **Users** → **Create user**
2. Nombre de usuario: `terraform-deploy`
3. Tipo de acceso: ✅ **Access key - Programmatic access**
4. Permisos: **Attach policies directly** → busca y selecciona **`PowerUserAccess`**
5. Crear usuario
6. **Guarda el `Access Key ID` y `Secret Access key`** en un archivo seguro (no los pierdas, el secret no se muestra de nuevo)

### 3.3 Configurar AWS CLI con tus credenciales reales

```bash
# Configurar el perfil por defecto
aws configure

# Te pedirá:
# AWS Access Key ID [None]: TU_ACCESS_KEY_ID
# AWS Secret Access Key [None]: TU_SECRET_ACCESS_KEY
# Default region name [None]: us-east-1
# Default output format [None]: json

# Verificar que funciona
aws sts get-caller-identity
```

### 3.4 Crear el bucket S3 para el estado de Terraform

```bash
# Crear bucket (el nombre debe ser único globalmente en AWS)
aws s3 mb s3://donaciones-terraform-state-dev --region us-east-1

# Habilitar versionado (para recuperar estados antiguos)
aws s3api put-bucket-versioning \
  --bucket donaciones-terraform-state-dev \
  --versioning-configuration Status=Enabled

# Crear tabla DynamoDB para bloqueos (evita que dos personas editen al mismo tiempo)
aws dynamodb create-table \
  --table-name donaciones-terraform-locks-dev \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1

# Verificar
aws s3 ls | grep donaciones
aws dynamodb list-tables | grep donaciones
```

### 3.5 Configurar variables de entorno

```bash
# Estas variables se usan automáticamente por Terraform
export TF_VAR_db_password="TuPasswordSegura123!"
export TF_VAR_db_username="donaciones_admin"

# Para que persistan entre sesiones, agrégalas a tu ~/.bashrc o ~/.zshrc
echo 'export TF_VAR_db_password="TuPasswordSegura123!"' >> ~/.bashrc
echo 'export TF_VAR_db_username="donaciones_admin"' >> ~/.bashrc
source ~/.bashrc
```

### 3.6 Aplicar infraestructura en AWS Dev

```bash
cd infrastructure/live/dev

# Inicializar (descargar providers, módulos)
terragrunt run-all init

# Ver el plan (qué va a crear - ¡revísalo cuidadosamente!)
terragrunt run-all plan

# Si todo se ve bien, aplicar (crear todo en AWS)
terragrunt run-all apply

# ⏳ Esto puede tardar 10-15 minutos (RDS tarda en crearse)
```

> ⚠️ **IMPORTANTE**: Esto creará recursos reales en AWS y podría generar costos.
> Costos estimados para dev:
> - EC2 `t3.micro`: ~$8.50 USD/mes
> - RDS `db.t3.micro`: ~$13 USD/mes
> - S3: ~$0.023 USD/GB/mes

### 3.7 Verificar en AWS Console

Abre la AWS Console en tu navegador y verifica:

- **VPC** → **Your VPCs** → Debes ver `donaciones-dev-vpc`
- **RDS** → **Databases** → Debes ver la instancia PostgreSQL
- **S3** → Debes ver el bucket `donaciones-dev-recetas`
- **EC2** → **Instances** → Debes ver la instancia corriendo

### 3.8 Obtener los valores reales para tu aplicación

```bash
cd infrastructure/live/dev

# Obtener endpoint de la base de datos
cd database && terragrunt output db_endpoint && cd ..

# Obtener nombre del bucket S3
cd s3 && terragrunt output bucket_name && cd ..

# Obtener IP pública de EC2 (si usas EC2)
cd ec2 && terragrunt output instance_public_ip && cd ..

# Obtener todos los outputs de una vez
terragrunt run-all output
```

### 3.9 Conectar tu aplicación a AWS Dev

Actualiza tu `.env`:

```bash
# Reemplaza con los valores reales que te dio Terragrunt
cat > .env << EOF
DATABASE_URL=postgresql://donaciones_admin:TuPasswordSegura123!@TU_RDS_ENDPOINT:5432/donaciones
AWS_REGION=us-east-1
# SIN endpoint URL (usa AWS real)
S3_BUCKET_NAME=donaciones-dev-recetas
EOF
```

---

## FASE 4: Configurar CI/CD (GitHub Actions)

### 4.1 Subir tu código a GitHub

```bash
# Si ya tienes el repositorio localmente
cd ~/donaciones

# Verificar estado
git status

# Agregar todo (incluyendo la nueva infraestructura)
git add .

# Commitear
git commit -m "feat: add Terragrunt infrastructure modules and LocalStack"

# Pushear a main
git push origin main
```

### 4.2 Configurar Secrets en GitHub

1. Ve a tu repositorio en GitHub: `https://github.com/tu-usuario/donaciones`
2. Ve a **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
3. Agrega estos secrets uno por uno:

| Secret Name | Value | ¿Cómo obtenerlo? |
|-------------|-------|------------------|
| `AWS_ROLE_ARN_DEV` | `arn:aws:iam::123456789012:role/donaciones-gha-dev-role` | Crea un rol OIDC (ver `infrastructure/docs/OIDC_SETUP.md`) |
| `AWS_ROLE_ARN_PROD` | `arn:aws:iam::123456789012:role/donaciones-gha-prod-role` | Crea un rol OIDC para producción |
| `DB_PASSWORD` | `TuPasswordSegura123!` | La misma contraseña de PostgreSQL |
| `DB_USERNAME` | `donaciones_admin` | El usuario de la base de datos |

### 4.3 Crear un Pull Request para probar el pipeline

```bash
# Crear una nueva rama
git checkout -b test-infrastructure

# Haz un cambio pequeño (ej: agrega un comentario en env.hcl)
echo "# Test change" >> infrastructure/live/dev/env.hcl

# Commitear y pushear
git add .
git commit -m "test: infrastructure pipeline"
git push origin test-infrastructure
```

1. Ve a GitHub y crea un **Pull Request** de `test-infrastructure` a `main`
2. El pipeline se ejecutará automáticamente (verás checks amarillos)
3. Después de unos minutos, aparecerá un **comentario** en el PR con el `plan` de Terragrunt

### 4.4 Aprobar y mergear

1. Revisa el plan en el comentario del PR
2. Si todo se ve bien, haz **Merge** a `main`
3. El pipeline se ejecutará automáticamente y aplicará los cambios en **dev**
4. Ve a **Actions** en GitHub para ver el progreso

---

## FASE 5: Configurar Producción (Prod)

### 5.1 Crear recursos para producción

```bash
# Bucket de estado para prod
aws s3 mb s3://donaciones-terraform-state-prod --region us-east-1

# Habilitar versionado
aws s3api put-bucket-versioning \
  --bucket donaciones-terraform-state-prod \
  --versioning-configuration Status=Enabled

# Tabla de bloqueos para prod
aws dynamodb create-table \
  --table-name donaciones-terraform-locks-prod \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 5.2 Aplicar infraestructura en Prod

```bash
cd infrastructure/live/prod

# Inicializar
terragrunt run-all init

# Plan (ver qué va a crear)
terragrunt run-all plan

# ⚠️ En producción, NO uses apply manualmente. Usa GitHub Actions.
# La forma correcta es:
# Ve a GitHub → Actions → Infrastructure CI/CD → Run workflow
# Selecciona: environment=prod, action=plan
```

### 5.3 Protección de producción en GitHub

1. Ve a tu repositorio en GitHub → **Settings** → **Environments**
2. Haz clic en **New environment**
3. Nombre: `production`
4. ✅ **Required reviewers** → Agrega los usuarios que deben aprobar (ej: tu email)
5. ✅ **Wait timer** → Opcional: 5 minutos de espera
6. Guarda

Ahora, cuando el pipeline intente hacer `apply` en prod, se pausará y enviará notificaciones por email para que apruebes manualmente.

---

## 🗂️ Resumen de Comandos Rápidos

```bash
# ===== LOCAL =====
./infrastructure/scripts/localstack-init.sh     # Levantar LocalStack
./infrastructure/scripts/localstack-apply.sh   # Aplicar infraestructura local
./infrastructure/scripts/localstack-destroy.sh   # Destruir todo local

# ===== DEV =====
cd infrastructure/live/dev
terragrunt run-all init
terragrunt run-all plan
terragrunt run-all apply

# ===== PROD =====
cd infrastructure/live/prod
terragrunt run-all init
terragrunt run-all plan
# NO ejecutes apply manualmente en prod - usa GitHub Actions
```

---

## ✅ Checklist Final

### Preparación
- [ ] Sistema actualizado
- [ ] Docker Engine instalado y corriendo (`docker ps` funciona)
- [ ] Terraform instalado (`terraform -version`)
- [ ] Terragrunt instalado (`terragrunt --version`)
- [ ] AWS CLI instalado (`aws --version`)
- [ ] Node.js instalado (`node --version`)
- [ ] Usuario agregado al grupo `docker`

### LocalStack
- [ ] Contenedores levantados con `localstack-init.sh`
- [ ] LocalStack responde en `http://localhost:4566`
- [ ] PostgreSQL responde en `localhost:5432`
- [ ] Infraestructura local aplicada con Terragrunt
- [ ] App Next.js conectada a base local
- [ ] Prueba de subida a S3 local exitosa

### AWS Dev
- [ ] Cuenta de AWS creada
- [ ] MFA activado en usuario root
- [ ] Alertas de facturación activadas
- [ ] Usuario IAM `terraform-deploy` creado
- [ ] Bucket S3 `donaciones-terraform-state-dev` creado
- [ ] Tabla DynamoDB `donaciones-terraform-locks-dev` creada
- [ ] Variables de entorno configuradas (`TF_VAR_db_password`)
- [ ] Infraestructura dev aplicada en AWS
- [ ] Recursos verificados en AWS Console
- [ ] App conectada a AWS Dev

### CI/CD
- [ ] Código pusheado a GitHub
- [ ] Secrets configurados en GitHub
- [ ] Pull Request creado
- [ ] Pipeline ejecutado y comentó el plan
- [ ] PR mergeado a `main`
- [ ] Pipeline aplicó automáticamente en dev
- [ ] Entorno `production` configurado en GitHub

### Producción
- [ ] Bucket S3 `donaciones-terraform-state-prod` creado
- [ ] Tabla DynamoDB `donaciones-terraform-locks-prod` creada
- [ ] Pipeline de prod ejecutado con `plan`
- [ ] Aprobación manual requerida y otorgada
- [ ] Aplicación desplegada en producción

---

## 🆘 Troubleshooting

### Docker no responde (permiso denegado)
```bash
# Si docker ps da "permission denied"
sudo usermod -aG docker $USER
# Cerrar sesión y volver a entrar (o reiniciar)
newgrp docker
```

### LocalStack no inicia
```bash
# Ver logs
docker-compose -f infrastructure/local/docker-compose.yml logs -f localstack

# Si el puerto está ocupado
sudo ss -tlnp | grep 4566
# O en otras distribuciones:
sudo netstat -tlnp | grep 4566
```

### Terragrunt no encontrado
```bash
# Verificar que está en el PATH
which terragrunt

# Si no está, agregarlo manualmente
export PATH=$PATH:/usr/local/bin
echo 'export PATH=$PATH:/usr/local/bin' >> ~/.bashrc
```

### Terraform plan vacío
```bash
# Verificar que estás en la carpeta correcta
pwd
# Debe ser: .../infrastructure/live/dev

# Verificar que Terragrunt está leyendo los archivos
terragrunt graph
```

### PostgreSQL no accesible
```bash
# Verificar que el contenedor está corriendo
docker ps | grep postgres

# Ver logs
docker logs local-postgres

# Conectar directamente al contenedor
docker exec -it local-postgres psql -U donaciones_admin -d donaciones
```

### AWS "Access Denied"
```bash
# Verificar credenciales
aws sts get-caller-identity

# Si no funciona, reconfigurar
aws configure

# Verificar que el usuario tiene permisos
aws iam get-user
```

### Error de AMI no encontrada en LocalStack
```bash
# LocalStack usa AMIs mock. En los archivos de local (ec2 terragrunt.hcl)
# ya está configurado: ami_id = "ami-12345678"
# Si no funciona, verifica el módulo EC2
```

### Prisma no conecta a PostgreSQL
```bash
# Verificar que la base de datos existe
psql -h localhost -U donaciones_admin -d donaciones -c "SELECT 1;"

# Si la base no existe, créala
psql -h localhost -U donaciones_admin -c "CREATE DATABASE donaciones;"
```

---

## 📚 Documentación Adicional

- `infrastructure/README.md` — Guía general de infraestructura
- `infrastructure/docs/LOCALSTACK.md` — Guía detallada de LocalStack
- `infrastructure/docs/OIDC_SETUP.md` — Configuración de autenticación AWS
- `.github/workflows/infrastructure.yml` — Pipeline CI/CD

---

## 🎯 Consejos para Linux

1. **Usa `tmux` o `screen`**: Para dejar corriendo LocalStack en una sesión separada
2. **Alias útiles**: Agrega a tu `~/.bashrc`:
   ```bash
   alias awsls='aws --endpoint-url=http://localhost:4566 --profile localstack'
   alias tg='terragrunt'
   alias tf='terraform'
   alias dc='docker compose'
   ```
3. **Autocompletado**: Terraform y Terragrunt soportan autocompletado de bash/zsh
   ```bash
   # Terraform
   terraform -install-autocomplete
   
   # Terragrunt (manual)
   # Agrega a ~/.bashrc:
   # complete -C /usr/local/bin/terragrunt terragrunt
   ```

---

**¡Estás listo para comenzar!** 🐧🚀

**Recomendación**: Comienza por la **FASE 1** (instalar todo), luego **FASE 2** (LocalStack). Avanza a **FASE 3** solo cuando te sientas cómodo con el entorno local.
