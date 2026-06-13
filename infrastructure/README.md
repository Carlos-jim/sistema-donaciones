# Infrastructure

Infraestructura como código (IaC) para el Sistema de Donaciones usando **Terragrunt** + **Terraform** sobre **AWS**.

## 📁 Estructura

```
infrastructure/
├── local/              # Docker Compose para LocalStack (desarrollo local sin costos)
│   ├── docker-compose.yml
│   └── env.local
├── modules/            # Módulos reutilizables de Terraform
│   ├── vpc/            # VPC, subnets, security groups, NAT
│   ├── database/       # RDS PostgreSQL
│   ├── ec2/            # EC2 para servidor Next.js
│   ├── s3/             # S3 para imágenes de recetas médicas
│   └── app/            # ECS Fargate + ALB (alternativa a EC2)
├── live/               # Configuración por ambiente
│   ├── root.hcl        # Configuración global de Terragrunt
│   ├── local/          # Ambiente local (LocalStack)
│   ├── dev/
│   └── prod/
├── scripts/            # Scripts de ayuda
│   ├── localstack-init.sh
│   ├── localstack-apply.sh
│   └── localstack-destroy.sh
└── docs/
    └── OIDC_SETUP.md
```

## 🚀 Servicios AWS Provisionados

| Servicio | Uso | Módulo |
|----------|-----|--------|
| **EC2** | Servidor Next.js con Docker + Nginx | `modules/ec2` |
| **RDS** | Base de datos PostgreSQL | `modules/database` |
| **S3** | Almacenamiento de imágenes de recetas médicas | `modules/s3` |
| **VPC** | Red privada, subnets, security groups | `modules/vpc` |
| **ECS** | *(Alternativa)* Contenedores Fargate + ALB | `modules/app` |

## 🧪 Desarrollo Local con LocalStack (Sin Costos)

### Prerrequisitos

1. **Docker** y **Docker Compose**
2. **AWS CLI** (opcional, para pruebas manuales)
3. **Terraform** >= 1.5.0
4. **Terragrunt** >= 0.50.0

### Iniciar LocalStack

```bash
# Desde la raíz del proyecto
infrastructure/scripts/localstack-init.sh
```

Esto levanta:
- **LocalStack** en `http://localhost:4566` (simula EC2, S3, IAM, etc.)
- **PostgreSQL** en `localhost:5432` (simula RDS)
- **Next.js App** en `localhost:3000` (opcional, ver docker-compose)

### Aplicar infraestructura contra LocalStack

```bash
# Script automatizado
infrastructure/scripts/localstack-apply.sh

# O manualmente:
cd infrastructure/live/local
terragrunt run-all init
terragrunt run-all plan
terragrunt run-all apply
```

### Verificar servicios

```bash
# Listar buckets S3 locales
aws --endpoint-url=http://localhost:4566 s3 ls

# Listar instancias EC2 locales
aws --endpoint-url=http://localhost:4566 ec2 describe-instances

# Conectar a PostgreSQL local
psql -h localhost -U donaciones_admin -d donaciones
```

### Destruir infraestructura local

```bash
infrastructure/scripts/localstack-destroy.sh
```

### ⚠️ Notas sobre LocalStack

- **LocalStack CE**: Soporta EC2, S3, IAM, VPC, etc. RDS tiene limitaciones en CE.
- **PostgreSQL**: Usamos un contenedor Docker separado para simular RDS en desarrollo local.
- **RDS**: El módulo `database` funciona contra LocalStack Pro. Para CE, usa el contenedor PostgreSQL.
- **AMIs**: LocalStack usa AMIs mock. En producción, Terraform busca la AMI real de Amazon Linux 2.

## 🔐 Secrets de GitHub Actions (AWS Real)

Configura los siguientes secrets en tu repositorio de GitHub:

| Secret | Descripción | Requerido |
|--------|-------------|-----------|
| `AWS_ROLE_ARN_DEV` | ARN del rol de OIDC para **dev** | ✅ |
| `AWS_ROLE_ARN_PROD` | ARN del rol de OIDC para **prod** | ✅ |
| `DB_PASSWORD` | Contraseña de PostgreSQL RDS | ✅ |
| `DB_USERNAME` | Usuario de PostgreSQL RDS (default: `donaciones_admin`) | Opcional |

### Configurar OIDC

Sigue la guía completa en: `infrastructure/docs/OIDC_SETUP.md`

## 🏗️ Bootstrap Inicial (AWS Real)

Antes de correr el pipeline por primera vez, crea los buckets de estado y tablas de bloqueo:

```bash
aws s3 mb s3://donaciones-terraform-state-dev --region us-east-1
aws s3 mb s3://donaciones-terraform-state-prod --region us-east-1

aws dynamodb create-table \
  --table-name donaciones-terraform-locks-dev \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1

aws dynamodb create-table \
  --table-name donaciones-terraform-locks-prod \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region us-east-1
```

## 🔄 Pipeline CI/CD

### Pull Requests
1. Detecta archivos modificados en `infrastructure/live/dev` o `prod`
2. Ejecuta `terragrunt run-all init` → `validate` → `plan`
3. Publica el resultado del plan como comentario en el PR

### Merge a `main`
4. **Dev**: Se aplica automáticamente (`apply`)
5. **Prod**: Requiere aprobación manual (GitHub Environment Protection)

### Manual
Desde **Actions** → **Infrastructure CI/CD** → **Run workflow**:
- Selecciona ambiente (`dev` o `prod`)
- Selecciona acción (`plan` o `apply`)

## 🧪 Comandos locales (AWS Real)

```bash
# Ver el plan de dev
cd infrastructure/live/dev
terragrunt run-all plan

# Aplicar cambios en dev
cd infrastructure/live/dev
terragrunt run-all apply

# Destruir dev (⚠️ cuidado)
cd infrastructure/live/dev
terragrunt run-all destroy

# Formatear código
terragrunt run-all fmt
```

## 📝 Módulos

### EC2 (Servidor Next.js)

- **AMI**: Amazon Linux 2 (más reciente)
- **User Data**: Instala Node.js, Docker, Nginx, PM2
- **Seguridad**: Security groups para SSH (22), HTTP (80), App (3000)
- **IAM**: Rol con acceso a S3 y CloudWatch Logs
- **Nginx**: Reverse proxy desde puerto 80 al 3000

### RDS (PostgreSQL)

- **Engine**: PostgreSQL 15
- **Encriptación**: Storage en reposo habilitado
- **Seguridad**: No accesible públicamente, solo desde VPC
- **Backups**: Retención configurable (7 días dev, 14 días prod)

### S3 (Imágenes de Recetas)

- **CORS**: Configurado para acceso desde frontend Next.js
- **Encriptación**: AES-256
- **Versionado**: Habilitado para protección de datos médicos
- **Lifecycle**: Archivado a Glacier después de 1 año
- **Acceso**: Restringido mediante política de bucket (IAM)

## 🌐 Variables de entorno inyectadas

El pipeline inyecta automáticamente:

```yaml
TF_VAR_db_password: ${{ secrets.DB_PASSWORD }}
TF_VAR_db_username: ${{ secrets.DB_USERNAME }}
```

Para agregar más, edita la sección `env` de `.github/workflows/infrastructure.yml`.

## 📝 Notas importantes

- **Container image**: Si usas ECS, reemplaza `nginx:latest` con tu imagen de ECR.
- **EC2 Key Pair**: Genera una clave SSH con `ssh-keygen` y configura `public_key_path` en Terragrunt.
- **SSL/HTTPS**: El ALB/EC2 usa HTTP. Para producción, configura un certificado ACM y HTTPS.
- **Costos**: EC2 (`t3.micro` ~$8/mes), RDS (`db.t3.micro` ~$13/mes), S3 (depende de uso).
- **RDS**: El módulo usa `db.t3.micro` en dev y `db.t3.small` en prod.

## 🆘 Troubleshooting

### LocalStack no responde
```bash
docker-compose logs -f localstack
```

### Terraform no puede conectarse a LocalStack
Verifica que los endpoints en `live/local/root.hcl` apunten a `http://localhost:4566`.

### Error de AMI no encontrada en LocalStack
LocalStack usa AMIs mock. En `modules/ec2`, comenta el `data.aws_ami` y usa una AMI fija para local:
```hcl
ami = "ami-12345678"  # LocalStack mock AMI
```

### PostgreSQL no accesible desde EC2 en LocalStack
En LocalStack, EC2 es un mock. Usa la dirección `host.docker.internal` para conectar al PostgreSQL local desde el contenedor de LocalStack.
