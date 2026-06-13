output "db_endpoint" {
  description = "Endpoint de la base de datos"
  value       = aws_db_instance.main.endpoint
}

output "db_name" {
  description = "Nombre de la base de datos"
  value       = aws_db_instance.main.db_name
}

output "db_username" {
  description = "Usuario de la base de datos"
  value       = aws_db_instance.main.username
}

output "db_port" {
  description = "Puerto de la base de datos"
  value       = aws_db_instance.main.port
}

output "db_instance_id" {
  description = "ID de la instancia RDS"
  value       = aws_db_instance.main.id
}
