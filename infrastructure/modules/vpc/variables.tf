variable "project_name" {
  description = "Nombre del proyecto"
  type        = string
  default     = "donaciones"
}

variable "environment" {
  description = "Ambiente (dev, prod, staging)"
  type        = string
}

variable "cidr_block" {
  description = "CIDR block para la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Lista de AZs a usar"
  type        = list(string)
}

variable "enable_nat_gateway" {
  description = "Habilitar NAT Gateway para subnets privadas"
  type        = bool
  default     = false
}
