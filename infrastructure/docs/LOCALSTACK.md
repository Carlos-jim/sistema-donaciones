# Guía de LocalStack para Desarrollo Local

Esta guía te ayuda a usar **LocalStack** para desarrollar y probar la infraestructura AWS sin incurrir en costos.

## ¿Qué es LocalStack?

LocalStack es un emulador de AWS que corre en Docker. Permite probar servicios de AWS localmente sin necesidad de una cuenta AWS ni costos de facturación.

## Servicios soportados en LocalStack CE

| Servicio | Estado | Uso en el proyecto |
|----------|--------|-------------------|
| **S3** | ✅ Disponible | Almacenamiento de imágenes de recetas |
| **EC2** | ✅ Disponible | Servidor Next.js (mock) |
| **IAM** | ✅ Disponible | Roles y políticas |
| **VPC** | ✅ Disponible | Redes y subnets (simplificado) |
| **RDS** | ⚠️ Limitado | PostgreSQL se simula con contenedor Docker |
| **CloudWatch** | ✅ Disponible | Logs y métricas |

## 🚀 Inicio rápido

### 1. Iniciar el entorno

```bash
# Windows (PowerShell)
.\infrastructure\scripts\localstack-init.ps1

# Linux/macOS
./infrastructure/scripts/localstack-init.sh
```

Este paso levanta `localstack` y `local-postgres`. La app de Next.js es opcional y se puede iniciar aparte con:

```bash
docker compose -f infrastructure/local/docker-compose.yml --profile app up -d app
```

### 2. Aplicar infraestructura

```bash
# Windows (PowerShell)
.\infrastructure\scripts\localstack-apply.ps1

# Linux/macOS
./infrastructure/scripts/localstack-apply.sh
```

### 3. Verificar

```bash
# Listar buckets S3
aws --endpoint-url=http://localhost:4566 s3 ls

# Listar instancias EC2
aws --endpoint-url=http://localhost:4566 ec2 describe-instances

# Conectar a PostgreSQL
psql -h localhost -U donaciones_admin -d donaciones
```

## 🔧 Configuración del Provider para LocalStack

El archivo `infrastructure/live/local/root.hcl` configura automáticamente el provider de AWS para apuntar a LocalStack:

```hcl
provider "aws" {
  region = "us-east-1"
  
  access_key = "test"
  secret_key = "test"
  
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  
  endpoints {
    ec2 = "http://localhost:4566"
    s3  = "http://s3.localhost.localstack.cloud:4566"
    # ... más servicios
  }
}
```

## 🗄️ PostgreSQL (Simulación de RDS)

LocalStack CE tiene limitaciones con RDS. Usamos un contenedor PostgreSQL separado:

```yaml
# docker-compose.yml
postgres:
  image: postgres:15-alpine
  ports:
    - "5432:5432"
  environment:
    POSTGRES_USER: donaciones_admin
    POSTGRES_PASSWORD: localpassword123
    POSTGRES_DB: donaciones
```

Desde la aplicación, la cadena de conexión es:
```
postgresql://donaciones_admin:localpassword123@localhost:5432/donaciones
```

## 🖥️ EC2 en LocalStack

LocalStack simula EC2 pero no crea instancias reales. Es útil para:
- Validar la sintaxis de Terraform
- Probar security groups y networking
- Verificar IAM roles

Para obtener una IP pública simulada:
```bash
aws --endpoint-url=http://localhost:4566 ec2 describe-instances
```

## 🪣 S3 en LocalStack

### Subir archivos
```bash
aws --endpoint-url=http://localhost:4566 s3 cp receta.jpg s3://donaciones-local-recetas/recetas/
```

### Listar archivos
```bash
aws --endpoint-url=http://localhost:4566 s3 ls s3://donaciones-local-recetas/recetas/
```

### Descargar archivos
```bash
aws --endpoint-url=http://localhost:4566 s3 cp s3://donaciones-local-recetas/recetas/receta.jpg ./
```

## 🧪 Pruebas con AWS CLI

Configura el perfil de AWS para LocalStack:

```bash
aws configure --profile localstack
# Access Key: test
# Secret Key: test
# Region: us-east-1
# Output: json
```

Luego usa:
```bash
export AWS_PROFILE=localstack
aws --endpoint-url=http://localhost:4566 s3 ls
```

O configura un alias:
```bash
alias awsls='aws --endpoint-url=http://localhost:4566'
awsls s3 ls
```

## 📝 Diferencias con AWS Real

| Aspecto | AWS Real | LocalStack |
|---------|----------|------------|
| Costos | Sí | No |
| EC2 | Instancias reales | Mock |
| RDS | Instancia gestionada | Contenedor PostgreSQL |
| S3 | Almacenamiento real | En memoria/volumen Docker |
| IAM | Políticas reales | Simuladas |
| AMIs | AMIs de AWS | AMIs mock |

## 🆘 Troubleshooting

### LocalStack no inicia
```bash
docker compose -f infrastructure/local/docker-compose.yml logs localstack
```

### Puerto 4566 ocupado
```bash
# Encuentra el proceso
lsof -i :4566
# O en Windows
netstat -ano | findstr :4566
```

### Terraform timeout con LocalStack
Aumenta el timeout en el provider:
```hcl
provider "aws" {
  # ... otros configs
  max_retries = 5
}
```

### PostgreSQL no accesible
```bash
# Verificar que el contenedor está corriendo
docker compose -f infrastructure/local/docker-compose.yml ps

# Verificar logs
docker compose -f infrastructure/local/docker-compose.yml logs postgres

# Probar conexión
docker compose -f infrastructure/local/docker-compose.yml exec postgres psql -U donaciones_admin -d donaciones
```

## 🔄 Flujo de desarrollo recomendado

1. **Desarrollo local**: Usa LocalStack para probar cambios de infraestructura
2. **PR a main**: El pipeline ejecuta `plan` en dev y prod
3. **Merge a main**: Se aplica automáticamente en dev
4. **Aprobación manual**: Se aplica en prod

## 📚 Recursos

- [LocalStack Docs](https://docs.localstack.cloud/)
- [LocalStack GitHub](https://github.com/localstack/localstack)
- [AWS CLI](https://aws.amazon.com/cli/)
