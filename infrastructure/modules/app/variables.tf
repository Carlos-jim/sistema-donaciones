variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "donaciones"
}

variable "environment" {
  description = "Ambiente"
  type        = string
}

variable "aws_region" {
  description = "Región de AWS"
  type        = string
  default     = "us-east-1"
}

variable "vpc_id" {
  description = "ID de la VPC"
  type        = string
}

variable "public_subnet_ids" {
  description = "IDs de subnets públicas"
  type        = list(string)
}

variable "app_security_group_id" {
  description = "ID del SG de aplicación"
  type        = string
}

variable "container_image" {
  description = "Imagen del contenedor (ECR URL)"
  type        = string
}

variable "cpu" {
  description = "CPU para Fargate"
  type        = string
  default     = "256"
}

variable "memory" {
  description = "Memoria para Fargate"
  type        = string
  default     = "512"
}

variable "desired_count" {
  description = "Cantidad de tareas deseadas"
  type        = number
  default     = 1
}

variable "db_endpoint" {
  description = "Endpoint de la base de datos"
  type        = string
}

variable "db_name" {
  description = "Nombre de la base de datos"
  type        = string
}

variable "db_username" {
  description = "Usuario de la base de datos"
  type        = string
}

variable "db_password" {
  description = "Contraseña de la base de datos"
  type        = string
  sensitive   = true
}

variable "api_url" {
  description = "URL pública de la API"
  type        = string
  default     = ""
}
