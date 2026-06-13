variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "donaciones"
}

variable "environment" {
  description = "Ambiente"
  type        = string
}

variable "enable_versioning" {
  description = "Habilitar versionado del bucket"
  type        = bool
  default     = true
}

variable "allowed_origins" {
  description = "Orígenes permitidos para CORS"
  type        = list(string)
  default     = ["*"]
}

variable "allowed_principal_arn" {
  description = "ARN del principal IAM permitido (rol de EC2 o usuario)"
  type        = string
  default     = "*"
}

variable "enable_lifecycle" {
  description = "Habilitar configuración de ciclo de vida del bucket"
  type        = bool
  default     = true
}
