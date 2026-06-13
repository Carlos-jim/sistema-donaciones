output "alb_dns_name" {
  description = "DNS del ALB"
  value       = aws_lb.main.dns_name
}

output "ecs_cluster_name" {
  description = "Nombre del cluster ECS"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Nombre del servicio ECS"
  value       = aws_ecs_service.app.name
}

output "target_group_arn" {
  description = "ARN del target group"
  value       = aws_lb_target_group.app.arn
}
