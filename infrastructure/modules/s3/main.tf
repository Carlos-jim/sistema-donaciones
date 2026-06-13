terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  required_version = ">= 1.5.0"
}

# Bucket S3 para imágenes de recetas médicas
resource "aws_s3_bucket" "recetas" {
  bucket = "${var.project_name}-${var.environment}-recetas"

  tags = {
    Name        = "${var.project_name}-${var.environment}-recetas"
    Environment = var.environment
    Project     = var.project_name
    Purpose     = "Almacenamiento de imágenes de recetas médicas"
  }
}

# Configuración de propiedad del bucket
resource "aws_s3_bucket_ownership_controls" "recetas" {
  bucket = aws_s3_bucket.recetas.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

# Acceso público bloqueado por defecto (más seguro)
resource "aws_s3_bucket_public_access_block" "recetas" {
  bucket = aws_s3_bucket.recetas.id

  block_public_acls       = true
  block_public_policy       = true
  ignore_public_acls        = true
  restrict_public_buckets   = true
}

# Versionado para protección de datos médicos
resource "aws_s3_bucket_versioning" "recetas" {
  bucket = aws_s3_bucket.recetas.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Disabled"
  }
}

# Encriptación en reposo (AES-256)
resource "aws_s3_bucket_server_side_encryption_configuration" "recetas" {
  bucket = aws_s3_bucket.recetas.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# CORS para acceso desde el frontend Next.js
resource "aws_s3_bucket_cors_configuration" "recetas" {
  bucket = aws_s3_bucket.recetas.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET", "DELETE"]
    allowed_origins = var.allowed_origins
    expose_headers  = ["ETag", "x-amz-server-side-encryption", "x-amz-request-id"]
    max_age_seconds = 3000
  }
}

# Política de bucket para acceso restringido
# Solo se aplica cuando se especifica un principal ARN concreto (no "*")
resource "aws_s3_bucket_policy" "recetas" {
  count  = var.allowed_principal_arn != "*" ? 1 : 0
  bucket = aws_s3_bucket.recetas.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowAppAccess"
        Effect    = "Allow"
        Principal = {
          AWS = var.allowed_principal_arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.recetas.arn,
          "${aws_s3_bucket.recetas.arn}/*"
        ]
      }
    ]
  })
}

# Lifecycle para archivos antiguos
resource "aws_s3_bucket_lifecycle_configuration" "recetas" {
  count  = var.enable_lifecycle ? 1 : 0
  bucket = aws_s3_bucket.recetas.id

  rule {
    id     = "archive-old-recetas"
    status = "Enabled"

    filter {
      prefix = "recetas/"
    }

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 365
      storage_class = "GLACIER"
    }

    # No expiramos recetas médicas por temas legales/regulatorios
    # expiration { days = 2555 } # 7 años - descomentar si aplica
  }
}

# Carpeta prefijo para organizar imágenes
resource "aws_s3_object" "recetas_prefix" {
  bucket  = aws_s3_bucket.recetas.id
  key     = "recetas/"
  content = ""
}
