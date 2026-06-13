output "instance_id" {
  description = "ID de la instancia EC2"
  value       = aws_instance.app.id
}

output "instance_public_ip" {
  description = "IP pública de la instancia"
  value       = aws_instance.app.public_ip
}

output "instance_public_dns" {
  description = "DNS público de la instancia"
  value       = aws_instance.app.public_dns
}

output "elastic_ip" {
  description = "Elastic IP asignada"
  value       = var.assign_eip ? aws_eip.app[0].public_ip : null
}

output "security_group_id" {
  description = "ID del security group de EC2"
  value       = aws_security_group.ec2.id
}

output "ssh_command" {
  description = "Comando SSH para conectarse"
  value       = "ssh -i ~/.ssh/id_rsa ec2-user@${var.assign_eip ? aws_eip.app[0].public_ip : aws_instance.app.public_ip}"
}
