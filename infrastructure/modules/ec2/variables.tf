variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "donaciones"
}

variable "environment" {
  description = "Ambiente"
  type        = string
}

variable "ami_id" {
  description = "AMI ID personalizado (para LocalStack u otras AMIs específicas)"
  type        = string
  default     = ""
}

variable "vpc_id" {
  description = "ID de la VPC"
  type        = string
}

variable "subnet_id" {
  description = "ID de la subnet pública"
  type        = string
}

variable "instance_type" {
  description = "Tipo de instancia EC2"
  type        = string
  default     = "t3.micro"
}

variable "root_volume_size" {
  description = "Tamaño del volumen raíz (GB)"
  type        = number
  default     = 20
}

variable "create_key_pair" {
  description = "Crear un nuevo key pair"
  type        = bool
  default     = false
}

variable "existing_key_name" {
  description = "Nombre de un key pair existente"
  type        = string
  default     = ""
}

variable "public_key_path" {
  description = "Ruta al archivo de clave pública SSH"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

variable "assign_eip" {
  description = "Asignar Elastic IP"
  type        = bool
  default     = false
}

variable "app_port" {
  description = "Puerto de la aplicación"
  type        = number
  default     = 3000
}

variable "node_version" {
  description = "Versión de Node.js a instalar"
  type        = string
  default     = "20"
}

variable "db_host" {
  description = "Host de la base de datos"
  type        = string
}

variable "db_name" {
  description = "Nombre de la base de datos"
  type        = string
  default     = "donaciones"
}

variable "db_user" {
  description = "Usuario de la base de datos"
  type        = string
  default     = "donaciones_admin"
}

variable "db_password" {
  description = "Contraseña de la base de datos"
  type        = string
  sensitive   = true
}

variable "aws_region" {
  description = "Región de AWS"
  type        = string
  default     = "us-east-1"
}

variable "s3_bucket" {
  description = "Nombre del bucket S3 para imágenes"
  type        = string
}
