output "vpc_id" {
  description = "ID de la VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs de subnets públicas"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs de subnets privadas"
  value       = aws_subnet.private[*].id
}

output "database_security_group_id" {
  description = "ID del SG de base de datos"
  value       = aws_security_group.database.id
}

output "app_security_group_id" {
  description = "ID del SG de aplicación"
  value       = aws_security_group.app.id
}
