variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "donaciones"
}

variable "environment" {
  description = "Ambiente"
  type        = string
}

variable "subnet_ids" {
  description = "IDs de subnets privadas"
  type        = list(string)
}

variable "security_group_id" {
  description = "ID del SG de base de datos"
  type        = string
}

variable "db_name" {
  description = "Nombre de la base de datos"
  type        = string
  default     = "donaciones"
}

variable "db_username" {
  description = "Usuario de la base de datos"
  type        = string
  default     = "donaciones_admin"
}

variable "db_password" {
  description = "Contraseña de la base de datos"
  type        = string
  sensitive   = true
}

variable "instance_class" {
  description = "Clase de instancia RDS"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "Almacenamiento asignado (GB)"
  type        = number
  default     = 20
}

variable "engine_version" {
  description = "Versión de PostgreSQL"
  type        = string
  default     = "15.4"
}

variable "skip_final_snapshot" {
  description = "Omitir snapshot final al destruir"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Protección contra borrado"
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Días de retención de backups"
  type        = number
  default     = 7
}

variable "maintenance_window" {
  description = "Ventana de mantenimiento"
  type        = string
  default     = "Mon:03:00-Mon:04:00"
}
