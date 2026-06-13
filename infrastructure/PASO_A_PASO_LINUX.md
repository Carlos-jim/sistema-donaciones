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

### 3.6 Revisar la configuración de Dev antes de aplicar

Antes de crear recursos reales, confirma que estás usando la cuenta correcta y que Terragrunt puede leer el ambiente `dev`:

```bash
# Verifica identidad AWS. Debe mostrar tu cuenta y el usuario/rol correcto.
aws sts get-caller-identity

# Verifica que las variables de RDS existen en la sesión
echo "$TF_VAR_db_username"
test -n "$TF_VAR_db_password" && echo "DB password configurada"

# Ir al ambiente dev
cd infrastructure/live/dev

# Verifica formato/configuración
terragrunt hclfmt --terragrunt-check
terragrunt run-all validate
```

> Si `TF_VAR_db_password` no está configurada, Terragrunt usará el fallback del archivo dev. Para evitar contraseñas débiles, configura siempre una contraseña real antes de aplicar.

### 3.7 Aplicar infraestructura en AWS Dev

```bash
cd infrastructure/live/dev

# Inicializar (descargar providers, módulos)
terragrunt run-all init --terragrunt-non-interactive

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

### 3.8 Verificar en AWS Console

Abre la AWS Console en tu navegador y verifica:

- **VPC** → **Your VPCs** → Debes ver `donaciones-dev-vpc`
- **RDS** → **Databases** → Debes ver la instancia PostgreSQL
- **S3** → Debes ver el bucket `donaciones-dev-recetas`
- **EC2** → **Instances** → Debes ver la instancia corriendo

### 3.9 Obtener los valores reales para tu aplicación

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

Guarda estos valores:

| Valor | De dónde sale | Ejemplo |
|-------|---------------|---------|
| Endpoint RDS | `database` → `db_endpoint` | `donaciones-dev-db.xxxxxx.us-east-1.rds.amazonaws.com:5432` |
| Nombre DB | `database` → `db_name` | `donaciones` |
| Usuario DB | `database` → `db_username` | `donaciones_admin` |
| Bucket S3 | `s3` → `bucket_name` | `donaciones-dev-recetas` |
| IP/DNS EC2 | `ec2` → `instance_public_ip` o `instance_public_dns` | `13.x.x.x` |

### 3.10 Conectar la app a AWS Dev

El RDS de dev está en subnets privadas (`publicly_accessible = false`). Eso es correcto para seguridad, pero significa:

- Si la app corre en **EC2 dentro de la VPC**, usa el endpoint RDS directo.
- Si la app corre en tu **laptop**, necesitas un túnel SSH, VPN o Session Manager hacia la VPC.
- Si intentas conectar directo desde tu laptop al endpoint RDS privado, normalmente fallará por timeout.

#### Opción A: app corriendo en EC2

En la EC2, crea o actualiza `/opt/donaciones/.env` con los outputs de Terragrunt:

```bash
DATABASE_URL=postgresql://donaciones_admin:TU_PASSWORD_URL_ENCODED@TU_RDS_ENDPOINT:5432/donaciones
AWS_REGION=us-east-1
S3_BUCKET_NAME=donaciones-dev-recetas
NEXT_PUBLIC_API_URL=http://IP_PUBLICA_O_DNS_EC2
```

> No agregues `AWS_ENDPOINT_URL` en AWS real. Esa variable solo se usa para LocalStack.

Luego despliega la app en EC2:

```bash
sudo mkdir -p /opt/donaciones
sudo chown -R ec2-user:ec2-user /opt/donaciones

cd /opt/donaciones
git clone TU_REPO_GIT .  # o copia el código con rsync/scp
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy
pnpm run build
pm2 start pnpm --name donaciones -- start
pm2 save
```

#### Opción B: app local conectada a AWS Dev con túnel SSH

Primero necesitas poder entrar por SSH a la EC2. Si `terragrunt output ssh_command` muestra una clave que no existe o la instancia no tiene key pair, configura `existing_key_name` o `create_key_pair` en `infrastructure/live/dev/ec2/terragrunt.hcl` y vuelve a aplicar.

Abre el túnel:

```bash
cd infrastructure/live/dev

EC2_IP="$(cd ec2 && terragrunt output -raw instance_public_ip)"
RDS_ENDPOINT="$(cd database && terragrunt output -raw db_endpoint)"
RDS_HOST="${RDS_ENDPOINT%:*}"

ssh -i ~/.ssh/id_rsa \
  -L 5433:${RDS_HOST}:5432 \
  ec2-user@${EC2_IP}
```

Deja esa terminal abierta. En otra terminal, configura `.env` para usar el túnel local:

```bash
cd /ruta/a/sistema-donaciones

DB_USER="$(cd infrastructure/live/dev/database && terragrunt output -raw db_username)"
DB_NAME="$(cd infrastructure/live/dev/database && terragrunt output -raw db_name)"
S3_BUCKET="$(cd infrastructure/live/dev/s3 && terragrunt output -raw bucket_name)"
EC2_IP="$(cd infrastructure/live/dev/ec2 && terragrunt output -raw instance_public_ip)"

DB_PASSWORD_URL_ENCODED="$(node -e 'process.stdout.write(encodeURIComponent(process.env.TF_VAR_db_password || ""))')"

cat > .env << EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD_URL_ENCODED}@localhost:5433/${DB_NAME}
AWS_REGION=us-east-1
S3_BUCKET_NAME=${S3_BUCKET}
NEXT_PUBLIC_API_URL=http://${EC2_IP}
EOF
```

> Si tu `.env` tiene claves como `JWT_SECRET`, Supabase o Google Maps, cópialas de tu `.env` anterior antes de reemplazarlo.

Aplica migraciones y prueba la app:

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy
pnpm run db:seed   # opcional: carga datos de prueba
pnpm run dev
```

### 3.11 Validar conexión a AWS Dev

```bash
# Verifica que Prisma puede ver la base
pnpm prisma db pull --print > /tmp/dev-schema-check.prisma

# Verifica S3 real
aws s3 ls "s3://$(cd infrastructure/live/dev/s3 && terragrunt output -raw bucket_name)"

# Prueba la app
curl -I http://localhost:3000
```

---

## FASE 4: Configurar CI/CD (GitHub Actions)

El workflow ya existe en `.github/workflows/infrastructure.yml`.

Hace esto:

- En **Pull Requests** a `main`: corre `plan` para `dev` y/o `prod` según archivos modificados y comenta el resultado en el PR.
- En **push a `main`**: aplica automáticamente cambios de `dev`.
- En **prod**: usa el environment `production`, que debe pedir aprobación manual.
- En **manual dispatch**: permite correr `plan` o `apply` para `dev` o `prod` desde GitHub Actions.

### 4.1 Confirmar repositorio remoto

```bash
cd /ruta/a/sistema-donaciones

# Ver remoto actual
git remote -v

# Si no tienes remoto, créalo en GitHub y luego:
git remote add origin git@github.com:TU_ORG/TU_REPO.git

# Obtener owner/repo desde git
REPO_FULL_NAME="$(git remote get-url origin | sed -E 's#.*github.com[:/]([^/]+/[^/.]+)(\\.git)?#\\1#')"
echo "$REPO_FULL_NAME"
```

### 4.2 Subir el código inicial

```bash
git status
git add .
git commit -m "feat: add Terragrunt infrastructure"
git push -u origin main
```

> Si ya tienes cambios sin commitear que no pertenecen a infraestructura, revisa `git status` y commitea por partes.

### 4.3 Crear OIDC para GitHub Actions

OIDC evita guardar access keys largas en GitHub. Reemplaza `TU_ORG/TU_REPO` por tu repositorio real:

```bash
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
REPO_FULL_NAME="TU_ORG/TU_REPO"

# Crear proveedor OIDC. Si ya existe, AWS devolverá EntityAlreadyExists y puedes seguir.
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --thumbprint-list 6938fd4e98bab03faadb97b34396831e3780aea1 \
  --client-id-list sts.amazonaws.com || true
```

Crea el rol para dev:

```bash
cat > /tmp/trust-policy-dev.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:${REPO_FULL_NAME}:ref:refs/heads/main",
            "repo:${REPO_FULL_NAME}:environment:development",
            "repo:${REPO_FULL_NAME}:pull_request"
          ]
        }
      }
    }
  ]
}
EOF

aws iam create-role \
  --role-name donaciones-gha-dev-role \
  --assume-role-policy-document file:///tmp/trust-policy-dev.json || true

aws iam attach-role-policy \
  --role-name donaciones-gha-dev-role \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

aws iam attach-role-policy \
  --role-name donaciones-gha-dev-role \
  --policy-arn arn:aws:iam::aws:policy/IAMFullAccess

aws iam get-role \
  --role-name donaciones-gha-dev-role \
  --query 'Role.Arn' \
  --output text
```

Crea el rol para prod:

```bash
cat > /tmp/trust-policy-prod.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": [
            "repo:${REPO_FULL_NAME}:ref:refs/heads/main",
            "repo:${REPO_FULL_NAME}:environment:production",
            "repo:${REPO_FULL_NAME}:pull_request"
          ]
        }
      }
    }
  ]
}
EOF

aws iam create-role \
  --role-name donaciones-gha-prod-role \
  --assume-role-policy-document file:///tmp/trust-policy-prod.json || true

aws iam attach-role-policy \
  --role-name donaciones-gha-prod-role \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

aws iam attach-role-policy \
  --role-name donaciones-gha-prod-role \
  --policy-arn arn:aws:iam::aws:policy/IAMFullAccess

aws iam get-role \
  --role-name donaciones-gha-prod-role \
  --query 'Role.Arn' \
  --output text
```

> Para producción real, reemplaza `PowerUserAccess` + `IAMFullAccess` por una política mínima cuando el sistema ya esté estable.

### 4.4 Configurar secrets en GitHub

Ve a GitHub → tu repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Agrega:

| Secret | Valor |
|--------|-------|
| `AWS_ROLE_ARN_DEV` | ARN de `donaciones-gha-dev-role` |
| `AWS_ROLE_ARN_PROD` | ARN de `donaciones-gha-prod-role` |
| `DB_PASSWORD` | La contraseña de RDS usada en `TF_VAR_db_password` |
| `DB_USERNAME` | `donaciones_admin` |

Si tienes GitHub CLI:

```bash
gh secret set AWS_ROLE_ARN_DEV --body "arn:aws:iam::${ACCOUNT_ID}:role/donaciones-gha-dev-role"
gh secret set AWS_ROLE_ARN_PROD --body "arn:aws:iam::${ACCOUNT_ID}:role/donaciones-gha-prod-role"
gh secret set DB_USERNAME --body "donaciones_admin"
gh secret set DB_PASSWORD
```

### 4.5 Crear environments en GitHub

1. Ve a GitHub → repo → **Settings** → **Environments**.
2. Crea `development` sin aprobadores.
3. Crea `production`.
4. En `production`, activa **Required reviewers** y agrega tu usuario.
5. Opcional: agrega **Wait timer** de 5 minutos.

Esto protege los `apply` manuales hacia prod.

### 4.6 Probar el pipeline con un Pull Request

```bash
git checkout -b test-infrastructure-dev

# Cambio inocuo para disparar plan de dev
printf "\n# pipeline smoke test\n" >> infrastructure/live/dev/env.hcl

git add infrastructure/live/dev/env.hcl
git commit -m "test: validate dev infrastructure pipeline"
git push -u origin test-infrastructure-dev
```

En GitHub:

1. Crea PR hacia `main`.
2. Abre la pestaña **Checks**.
3. Revisa que corra `Terragrunt Plan (Dev)`.
4. Revisa el comentario automático con el plan.
5. Si todo está bien, mergea el PR.

Después del merge a `main`, el workflow aplicará dev automáticamente.

### 4.7 Ejecutar manualmente desde GitHub Actions

Para correr un plan manual:

1. GitHub → **Actions** → **Infrastructure CI/CD**.
2. **Run workflow**.
3. `environment`: `dev`.
4. `action`: `plan`.
5. **Run workflow**.

Para aplicar dev manualmente:

1. `environment`: `dev`.
2. `action`: `apply`.
3. Revisa logs y confirma outputs en AWS.

Para prod, corre primero `plan`. Solo usa `apply` cuando el plan esté revisado y el environment `production` tenga aprobadores.

### 4.8 Validar el resultado del pipeline

```bash
# Confirmar que GitHub aplicó sobre la misma cuenta AWS
aws sts get-caller-identity

# Ver recursos dev
cd infrastructure/live/dev
terragrunt run-all output

# Ver último estado en S3
aws s3 ls s3://donaciones-terraform-state-dev --recursive | tail
```

---

## FASE 5: Desplegar la aplicación en AWS Dev

La infraestructura crea la EC2 y escribe un `.env` base en `/opt/donaciones/.env`, pero no clona ni despliega automáticamente el código de la app. Haz este paso después de tener RDS y EC2 listos.

### 5.1 Preparar acceso SSH a EC2

```bash
cd infrastructure/live/dev
terragrunt output -raw instance_public_ip
terragrunt output -raw ssh_command
```

Si no puedes entrar por SSH, revisa `infrastructure/live/dev/ec2/terragrunt.hcl`:

- `create_key_pair = false` usa `existing_key_name`.
- Si `existing_key_name` está vacío, la instancia puede quedar sin clave SSH.
- Configura un key pair existente o activa creación de key pair y vuelve a aplicar.

Ejemplo usando key pair existente:

```hcl
create_key_pair  = false
existing_key_name = "mi-keypair-aws"
```

### 5.2 Entrar a la EC2

```bash
EC2_IP="$(cd infrastructure/live/dev/ec2 && terragrunt output -raw instance_public_ip)"
ssh -i ~/.ssh/id_rsa ec2-user@${EC2_IP}
```

### 5.3 Instalar la app en EC2

Dentro de la EC2:

```bash
sudo mkdir -p /opt/donaciones
sudo chown -R ec2-user:ec2-user /opt/donaciones
cd /opt/donaciones

git clone https://github.com/TU_ORG/TU_REPO.git .

npm install -g pnpm pm2
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy
pnpm run build

pm2 start pnpm --name donaciones -- start
pm2 save
pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

> Si tu AMI es **Amazon Linux 2**, Node.js 20 puede fallar por `glibc 2.26`. En ese caso usa Docker para correr la app:

```bash
sudo yum install -y git docker
sudo amazon-linux-extras enable nginx1
sudo yum install -y nginx
sudo systemctl enable --now docker nginx

sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

sudo tee /etc/nginx/conf.d/donaciones.conf > /dev/null << 'EOF'
server {
  listen 80 default_server;
  server_name _;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
EOF

sudo rm -f /etc/nginx/conf.d/default.conf
sudo nginx -t && sudo systemctl reload nginx

sudo mkdir -p /opt/donaciones
sudo chown -R ec2-user:ec2-user /opt/donaciones
cd /opt/donaciones

git clone https://github.com/TU_ORG/TU_REPO.git .

sudo docker run --rm \
  -v /opt/donaciones:/app \
  -w /app \
  node:20-bookworm \
  bash -lc 'corepack enable && corepack prepare pnpm@9.15.4 --activate >/dev/null 2>&1 && pnpm install --frozen-lockfile && pnpm prisma generate && pnpm prisma migrate deploy && NODE_OPTIONS=--max_old_space_size=768 pnpm run build'

sudo docker run -d \
  --name donaciones-dev \
  --restart unless-stopped \
  --env-file /opt/donaciones/.env \
  -e NODE_ENV=production \
  -v /opt/donaciones:/app \
  -w /app \
  -p 127.0.0.1:3000:3000 \
  node:20-bookworm \
  bash -lc 'corepack enable && corepack prepare pnpm@9.15.4 --activate >/dev/null 2>&1 && exec pnpm exec next start -H 0.0.0.0 -p 3000'
```

Si necesitas datos de prueba en dev:

```bash
pnpm run db:seed
```

### 5.4 Revisar `.env` en EC2

```bash
sudo sed -n '1,120p' /opt/donaciones/.env
```

Debe tener:

```env
DATABASE_URL=postgresql://...
AWS_REGION=us-east-1
S3_BUCKET_NAME=donaciones-dev-recetas
NEXT_PUBLIC_API_URL=http://IP_O_DNS_EC2
```

Agrega manualmente valores que la app necesite y que no crea Terraform, por ejemplo:

```bash
cat >> /opt/donaciones/.env << 'EOF'
JWT_SECRET=CAMBIA_ESTE_VALOR
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=TU_KEY
NEXT_PUBLIC_SUPABASE_URL=TU_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
EOF
```

Luego reinicia:

```bash
pm2 restart donaciones --update-env
```

Si `pnpm prisma migrate deploy` falla con `P1000`, la contraseña real del RDS no coincide con tu `.env`. Revisa el valor usado en `TF_VAR_db_password` al aplicar la base de datos y actualiza `DATABASE_URL`.

### 5.5 Validar app en EC2

```bash
pm2 status
pm2 logs donaciones --lines 100
curl -I http://localhost:3000
curl -I http://localhost
```

Desde tu laptop:

```bash
EC2_IP="$(cd infrastructure/live/dev/ec2 && terragrunt output -raw instance_public_ip)"
curl -I "http://${EC2_IP}"
```

---

## FASE 6: Configurar Producción (Prod)

### 6.1 Revisar costos y diferencias con dev

Prod usa:

- VPC `10.1.0.0/16`.
- RDS `db.t3.small`.
- 50 GB de storage.
- Backups por 14 días.
- Deletion protection activado.
- NAT Gateway activado, que genera costo fijo por hora.
- EC2 `t3.small` con Elastic IP.

### 6.2 Crear backend de estado para prod

```bash
aws s3 mb s3://donaciones-terraform-state-prod --region us-east-1

aws s3api put-bucket-versioning \
  --bucket donaciones-terraform-state-prod \
  --versioning-configuration Status=Enabled

aws dynamodb create-table \
  --table-name donaciones-terraform-locks-prod \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

Verifica:

```bash
aws s3api get-bucket-versioning --bucket donaciones-terraform-state-prod
aws dynamodb describe-table --table-name donaciones-terraform-locks-prod --region us-east-1
```

### 6.3 Configurar variables de prod

Usa una contraseña distinta a dev:

```bash
export TF_VAR_db_username="donaciones_admin"
export TF_VAR_db_password="OTRA_PASSWORD_MUY_SEGURA"
```

En GitHub, actualiza los secrets si prod usará otra contraseña. Si quieres separar dev/prod, crea secrets distintos y ajusta `.github/workflows/infrastructure.yml`.

### 6.4 Correr plan de prod

Localmente:

```bash
cd infrastructure/live/prod
terragrunt run-all init --terragrunt-non-interactive
terragrunt run-all validate
terragrunt run-all plan
```

En GitHub Actions:

1. **Actions** → **Infrastructure CI/CD** → **Run workflow**.
2. `environment`: `prod`.
3. `action`: `plan`.
4. Revisa logs completos.

### 6.5 Aplicar prod

Recomendado desde GitHub:

1. **Actions** → **Infrastructure CI/CD** → **Run workflow**.
2. `environment`: `prod`.
3. `action`: `apply`.
4. GitHub pausará en `production`.
5. Aprueba el deployment.
6. Espera a que termine y guarda outputs.

Manual solo si sabes exactamente qué va a cambiar:

```bash
cd infrastructure/live/prod
terragrunt run-all apply
```

### 6.6 Desplegar app en prod

Repite la Fase 5 usando `infrastructure/live/prod`:

```bash
cd infrastructure/live/prod
terragrunt run-all output
```

En la EC2 prod:

```bash
cd /opt/donaciones
git pull
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy
pnpm run build
pm2 restart donaciones --update-env
```

### 6.7 Validar prod

```bash
cd infrastructure/live/prod
PROD_IP="$(cd ec2 && terragrunt output -raw instance_public_ip)"
curl -I "http://${PROD_IP}"

aws s3 ls "s3://$(cd s3 && terragrunt output -raw bucket_name)"
```

---

## FASE 7: Operación diaria, rollback y costos

### 7.1 Ver estado

```bash
cd infrastructure/live/dev
terragrunt run-all output
terragrunt run-all plan
```

### 7.2 Actualizar app sin tocar infraestructura

En EC2:

```bash
cd /opt/donaciones
git pull
pnpm install
pnpm prisma migrate deploy
pnpm run build
pm2 restart donaciones --update-env
```

### 7.3 Rollback de app

```bash
cd /opt/donaciones
git log --oneline -5
git checkout COMMIT_ANTERIOR
pnpm install
pnpm prisma migrate deploy
pnpm run build
pm2 restart donaciones --update-env
```

> Las migraciones de base de datos no siempre son reversibles. Revisa `prisma/migrations` antes de hacer rollback de commits antiguos.

### 7.4 Apagar dev para ahorrar costos

Si no necesitas dev:

```bash
cd infrastructure/live/dev
terragrunt run-all destroy
```

Antes de destruir, confirma que no hay datos importantes en RDS o S3.

### 7.5 Ver costos aproximados

```bash
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%F),End=$(date +%F) \
  --granularity DAILY \
  --metrics UnblendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

---

## 🗂️ Resumen de Comandos Rápidos

```bash
# ===== LOCAL =====
./infrastructure/scripts/localstack-init.sh
./infrastructure/scripts/localstack-apply.sh
./infrastructure/scripts/localstack-destroy.sh

# ===== AWS DEV INFRA =====
export TF_VAR_db_username="donaciones_admin"
export TF_VAR_db_password="TU_PASSWORD_DEV"
cd infrastructure/live/dev
terragrunt run-all init --terragrunt-non-interactive
terragrunt run-all plan
terragrunt run-all apply
terragrunt run-all output

# ===== AWS DEV APP =====
EC2_IP="$(cd infrastructure/live/dev/ec2 && terragrunt output -raw instance_public_ip)"
ssh -i ~/.ssh/id_rsa ec2-user@${EC2_IP}

# ===== PROD PLAN =====
export TF_VAR_db_username="donaciones_admin"
export TF_VAR_db_password="TU_PASSWORD_PROD"
cd infrastructure/live/prod
terragrunt run-all init --terragrunt-non-interactive
terragrunt run-all plan

# ===== GITHUB ACTIONS =====
# Actions → Infrastructure CI/CD → Run workflow → environment=dev/prod → action=plan/apply
```

---

## ✅ Checklist Final

### Preparación
- [ ] Sistema actualizado
- [ ] Docker Engine instalado y corriendo (`docker ps` funciona)
- [ ] Terraform instalado (`terraform -version`)
- [ ] Terragrunt instalado (`terragrunt --version`)
- [ ] AWS CLI instalado (`aws --version`)
- [ ] Node.js 20 instalado (`node --version`)
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
- [ ] Variables de entorno configuradas (`TF_VAR_db_username`, `TF_VAR_db_password`)
- [ ] Infraestructura dev aplicada en AWS
- [ ] Outputs de RDS/S3/EC2 obtenidos
- [ ] `.env` local o de EC2 apunta a AWS Dev
- [ ] Migraciones Prisma aplicadas
- [ ] App desplegada en EC2 o probada por túnel SSH
- [ ] S3 dev validado con `aws s3 ls`

### CI/CD
- [ ] Repositorio subido a GitHub
- [ ] OIDC provider creado
- [ ] Roles `donaciones-gha-dev-role` y `donaciones-gha-prod-role` creados
- [ ] Secrets configurados en GitHub
- [ ] Environment `development` creado
- [ ] Environment `production` creado con aprobadores
- [ ] PR de prueba creado
- [ ] Pipeline comentó el plan
- [ ] Merge a `main` aplicó dev
- [ ] Workflow manual probado con `environment=dev`, `action=plan`

### Producción
- [ ] Bucket S3 `donaciones-terraform-state-prod` creado
- [ ] Tabla DynamoDB `donaciones-terraform-locks-prod` creada
- [ ] Password de prod distinta a dev
- [ ] Plan de prod revisado
- [ ] Aprobación manual de `production` configurada
- [ ] Apply de prod ejecutado desde GitHub Actions
- [ ] App desplegada en prod
- [ ] Backups/deletion protection de RDS confirmados

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
