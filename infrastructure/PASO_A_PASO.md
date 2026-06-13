# 📋 Guía Paso a Paso: Infraestructura con Terragrunt + LocalStack + AWS

> **Objetivo**: Levantar la infraestructura del Sistema de Donaciones **localmente sin costos** usando LocalStack, y luego desplegar en **AWS real** (dev/prod) con CI/CD automático.

---

## FASE 1: Preparar tu computadora (Haz esto una sola vez)

### 1.1 Instalar herramientas necesarias

Abre **PowerShell como Administrador** y ejecuta estos pasos:

#### ✅ Docker Desktop
1. Descarga e instala desde: https://www.docker.com/products/docker-desktop
2. Asegúrate de que esté corriendo (icono en la barra de tareas → verde)

#### ✅ Terraform
```powershell
# Usando Chocolatey (si no lo tienes, instálalo primero):
# https://chocolatey.org/install
choco install terraform

# Verificar instalación:
terraform -version
# Debe decir: Terraform v1.5.x o superior
```

#### ✅ Terragrunt
```powershell
# Descargar el ejecutable directamente
$tgVersion = "0.58.0"
$url = "https://github.com/gruntwork-io/terragrunt/releases/download/v$tgVersion/terragrunt_windows_amd64.exe"
Invoke-WebRequest -Uri $url -OutFile "$env:USERPROFILE\terragrunt.exe"

# Mover a una carpeta en el PATH
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\bin"
Move-Item "$env:USERPROFILE\terragrunt.exe" "$env:USERPROFILE\bin\terragrunt.exe"

# Agregar al PATH del sistema
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:USERPROFILE\bin", [EnvironmentVariableTarget]::User)

# Verificar (reinicia PowerShell):
terragrunt --version
```

#### ✅ AWS CLI (opcional pero recomendado)
```powershell
choco install awscli

# Configurar un perfil para LocalStack
aws configure --profile localstack
# Access Key: test
# Secret Key: test
# Region: us-east-1
# Output: json
```

#### ✅ Git (si no lo tienes)
```powershell
choco install git
```

---

## FASE 2: Levantar la infraestructura LOCAL (sin costos)

Esta fase simula AWS en tu computadora. **No necesitas cuenta de AWS ni tarjeta de crédito.**

### 2.1 Ir a la carpeta del proyecto
```powershell
cd "C:\Users\carli\OneDrive\Documentos\donaciones"
```

### 2.2 Iniciar LocalStack y PostgreSQL
```powershell
# Windows PowerShell
.\infrastructure\scripts\localstack-init.ps1
```

Esto hará:
- Descargar el contenedor de LocalStack
- Levantar PostgreSQL en `localhost:5432`
- Esperar a que todo esté listo

> ⏳ Este paso puede tardar 2-5 minutos la primera vez.

### 2.3 Verificar que todo está corriendo
```powershell
# Verificar Docker
docker ps

# Debes ver 2 contenedores corriendo:
# - localstack
# - local-postgres

# Verificar LocalStack
Invoke-WebRequest -Uri "http://localhost:4566/_localstack/health" -UseBasicParsing

# Verificar PostgreSQL
docker exec local-postgres psql -U donaciones_admin -d donaciones -c "SELECT 1;"
```

### 2.4 Aplicar la infraestructura con Terragrunt
```powershell
# Windows PowerShell
.\infrastructure\scripts\localstack-apply.ps1
```

O manualmente:
```powershell
cd infrastructure\live\local
terragrunt run-all init
terragrunt run-all plan
terragrunt run-all apply
```

Esto creará:
- ✅ Una VPC simulada
- ✅ Subnets simuladas
- ✅ Security Groups simulados
- ✅ Un bucket S3 local (`donaciones-local-recetas`)
- ✅ Una instancia EC2 simulada
- ✅ Una instancia RDS simulada (o usará el contenedor PostgreSQL)

### 2.5 Verificar que los servicios funcionan
```powershell
# Listar buckets S3 locales
aws --endpoint-url=http://localhost:4566 --profile localstack s3 ls

# Listar instancias EC2 locales
aws --endpoint-url=http://localhost:4566 --profile localstack ec2 describe-instances

# Ver el estado de Terragrunt
terragrunt run-all show
```

### 2.6 Conectar tu aplicación Next.js a la base de datos local
Edita tu archivo `.env` en la raíz del proyecto:
```env
DATABASE_URL=postgresql://donaciones_admin:localpassword123@localhost:5432/donaciones
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT_URL=http://localhost:4566
S3_BUCKET_NAME=donaciones-local-recetas
```

Luego ejecuta Prisma:
```powershell
npx prisma migrate dev
npx prisma generate
npm run dev
```

### 2.7 Probar subir una imagen a S3 local
```powershell
# Crear un archivo de prueba
"test" | Out-File -FilePath "test-receta.txt" -Encoding utf8

# Subir a S3 local
aws --endpoint-url=http://localhost:4566 --profile localstack s3 cp test-receta.txt s3://donaciones-local-recetas/recetas/

# Verificar
aws --endpoint-url=http://localhost:4566 --profile localstack s3 ls s3://donaciones-local-recetas/recetas/
```

### 2.8 Destruir infraestructura local (cuando termines)
```powershell
.\infrastructure\scripts\localstack-destroy.ps1
```

---

## FASE 3: Configurar AWS REAL (Dev)

Ahora que tu infraestructura funciona localmente, es hora de desplegar en AWS real.

### 3.1 Crear una cuenta de AWS
- Ve a https://aws.amazon.com/
- Crea una cuenta (tiene capa gratuita por 12 meses)
- Activa autenticación multifactor (MFA) en tu usuario root

### 3.2 Crear un usuario IAM para Terraform
```powershell
# (Haz esto en la Consola de AWS, no en PowerShell)
```

1. Ve a **AWS Console** → **IAM** → **Users** → **Create user**
2. Nombre: `terraform-deploy`
3. Permisos: Adjuntar políticas directamente → `PowerUserAccess`
4. Guarda el **Access Key ID** y **Secret Access Key** en un lugar seguro

### 3.3 Crear el bucket S3 para el estado de Terraform
```powershell
# Configurar AWS CLI con tus credenciales reales
aws configure
# Access Key: TU_ACCESS_KEY_ID
# Secret Key: TU_SECRET_ACCESS_KEY
# Region: us-east-1

# Crear bucket (debe ser único globalmente)
aws s3 mb s3://donaciones-terraform-state-dev --region us-east-1

# Crear tabla DynamoDB para bloqueos (evita corrupción de estado)
aws dynamodb create-table `
  --table-name donaciones-terraform-locks-dev `
  --attribute-definitions AttributeName=LockID,AttributeType=S `
  --key-schema AttributeName=LockID,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region us-east-1
```

### 3.4 Configurar variables de entorno
```powershell
# En tu PowerShell (estas variables se usarán en Terragrunt)
$env:TF_VAR_db_password = "TuPasswordSegura123!"
$env:TF_VAR_db_username = "donaciones_admin"
```

### 3.5 Aplicar infraestructura en AWS Dev
```powershell
cd infrastructure\live\dev

# Inicializar
terragrunt run-all init

# Ver el plan (qué va a crear)
terragrunt run-all plan

# Aplicar (crear todo en AWS)
terragrunt run-all apply
```

> ⚠️ **IMPORTANTE**: Esto creará recursos reales en AWS y podría generar costos. Verifica el plan antes de aplicar.

### 3.6 Verificar en AWS Console
- Ve a **AWS Console** → **VPC** → Debes ver la nueva VPC
- Ve a **RDS** → Debes ver la base de datos PostgreSQL
- Ve a **S3** → Debes ver el bucket de recetas
- Ve a **EC2** → Debes ver la instancia corriendo

### 3.7 Conectar tu aplicación a AWS Dev
Actualiza tu `.env`:
```env
# Reemplaza con los valores reales que te da Terragrunt
DATABASE_URL=postgresql://donaciones_admin:TuPasswordSegura123!@TU_RDS_ENDPOINT:5432/donaciones
AWS_REGION=us-east-1
# SIN endpoint URL (usa AWS real)
S3_BUCKET_NAME=donaciones-dev-recetas
```

Para obtener los valores reales:
```powershell
cd infrastructure\live\dev\database
terragrunt output db_endpoint

cd infrastructure\live\dev\s3
terragrunt output bucket_name
```

---

## FASE 4: Configurar CI/CD (GitHub Actions)

### 4.1 Subir tu código a GitHub
```powershell
# Si ya tienes el repositorio, asegúrate de que esté actualizado
git status
git add .
git commit -m "feat: add Terragrunt infrastructure modules"
git push origin main
```

### 4.2 Configurar Secrets en GitHub
1. Ve a tu repositorio en GitHub
2. Ve a **Settings** → **Secrets and variables** → **Actions** → **New repository secret**
3. Agrega estos secrets:

| Secret Name | Value | ¿Cómo obtenerlo? |
|-------------|-------|------------------|
| `AWS_ROLE_ARN_DEV` | `arn:aws:iam::123456789:role/donaciones-gha-dev-role` | Crea un rol OIDC (ver `infrastructure/docs/OIDC_SETUP.md`) |
| `AWS_ROLE_ARN_PROD` | `arn:aws:iam::123456789:role/donaciones-gha-prod-role` | Crea un rol OIDC para producción |
| `DB_PASSWORD` | `TuPasswordSegura123!` | La misma contraseña de PostgreSQL |
| `DB_USERNAME` | `donaciones_admin` | El usuario de la base de datos |

### 4.3 Crear un Pull Request para probar el pipeline
1. Crea una nueva rama:
```powershell
git checkout -b test-infrastructure
```

2. Haz un cambio pequeño en cualquier archivo de `infrastructure/live/dev/`
3. Commitea y pushea:
```powershell
git add .
git commit -m "test: infrastructure change"
git push origin test-infrastructure
```

4. Ve a GitHub y crea un **Pull Request** a `main`
5. Verás que el pipeline se ejecuta automáticamente y deja un comentario con el `plan`

### 4.4 Aprobar y mergear
1. Revisa el plan en el comentario del PR
2. Si todo se ve bien, haz **Merge** a `main`
3. El pipeline se ejecutará automáticamente y aplicará los cambios en **dev**

---

## FASE 5: Configurar Producción (Prod)

### 5.1 Crear recursos para producción
```powershell
# Bucket de estado para prod
aws s3 mb s3://donaciones-terraform-state-prod --region us-east-1

# Tabla de bloqueos para prod
aws dynamodb create-table `
  --table-name donaciones-terraform-locks-prod `
  --attribute-definitions AttributeName=LockID,AttributeType=S `
  --key-schema AttributeName=LockID,KeyType=HASH `
  --billing-mode PAY_PER_REQUEST `
  --region us-east-1
```

### 5.2 Aplicar infraestructura en Prod
```powershell
cd infrastructure\live\prod

# Si quieres hacerlo manualmente (no recomendado):
terragrunt run-all init
terragrunt run-all plan
terragrunt run-all apply

# La forma correcta es a través de GitHub Actions:
# Ve a Actions → Infrastructure CI/CD → Run workflow
# Selecciona environment: prod, action: plan
```

### 5.3 Protección de producción
En GitHub, ve a **Settings** → **Environments** → **New environment**:
- Nombre: `production`
- **Protection rules**: ✅ Require review (agrega a los reviewers que deben aprobar)

Ahora, cuando el pipeline intente hacer `apply` en prod, requerirá aprobación manual.

---

## 🗂️ Resumen de Comandos Rápidos

```powershell
# ===== LOCAL =====
.\infrastructure\scripts\localstack-init.ps1     # Levantar LocalStack
.\infrastructure\scripts\localstack-apply.ps1   # Aplicar infraestructura local
.\infrastructure\scripts\localstack-destroy.ps1   # Destruir todo local

# ===== DEV =====
cd infrastructure\live\dev
terragrunt run-all plan
terragrunt run-all apply

# ===== PROD =====
cd infrastructure\live\prod
terragrunt run-all plan
terragrunt run-all apply
```

---

## ✅ Checklist Final

- [ ] Docker Desktop instalado y corriendo
- [ ] Terraform instalado
- [ ] Terragrunt instalado
- [ ] LocalStack levantado correctamente
- [ ] PostgreSQL local accesible en `localhost:5432`
- [ ] Infraestructura local aplicada con Terragrunt
- [ ] Cuenta de AWS creada
- [ ] Usuario IAM `terraform-deploy` creado
- [ ] Bucket S3 `donaciones-terraform-state-dev` creado
- [ ] Tabla DynamoDB `donaciones-terraform-locks-dev` creada
- [ ] Infraestructura dev aplicada en AWS
- [ ] Secrets configurados en GitHub
- [ ] Pipeline de GitHub Actions ejecutado exitosamente
- [ ] Pull request mergeado a `main`
- [ ] Infraestructura dev desplegada automáticamente
- [ ] Entorno `production` configurado en GitHub

---

## 🆘 ¿Problemas?

| Problema | Solución |
|----------|----------|
| Terragrunt no se reconoce | Verifica que `terragrunt.exe` está en tu PATH |
| Docker no arranca | Reinicia Docker Desktop. Si persiste, ejecuta `wsl --update` en PowerShell |
| LocalStack timeout | Aumenta la espera en el script o ejecuta `docker-compose logs localstack` |
| AWS "Access Denied" | Verifica que las credenciales están correctas con `aws sts get-caller-identity` |
| Terraform plan vacío | Verifica que estás en la carpeta correcta (`infrastructure\live\dev`) |
| Puerto 5432 ocupado | Ejecuta `netstat -ano \| findstr 5432` y mata el proceso, o cambia el puerto en docker-compose.yml |

---

## 📚 Documentación Adicional

- `infrastructure/README.md` — Guía general de infraestructura
- `infrastructure/docs/LOCALSTACK.md` — Guía detallada de LocalStack
- `infrastructure/docs/OIDC_SETUP.md` — Configuración de autenticación AWS
- `infrastructure/.github/workflows/infrastructure.yml` — Pipeline CI/CD

---

**¡Estás listo!** 🚀

Comienza por la **FASE 1** (instalar herramientas), luego la **FASE 2** (LocalStack). Cuando te sientas cómodo, avanza a la **FASE 3** (AWS real).
