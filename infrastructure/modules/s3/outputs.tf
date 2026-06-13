output "bucket_name" {
  description = "Nombre del bucket S3"
  value       = aws_s3_bucket.recetas.id
}

output "bucket_arn" {
  description = "ARN del bucket S3"
  value       = aws_s3_bucket.recetas.arn
}

output "bucket_region" {
  description = "Región del bucket"
  value       = aws_s3_bucket.recetas.region
}

output "recetas_prefix" {
  description = "Prefijo para imágenes de recetas"
  value       = "s3://${aws_s3_bucket.recetas.id}/recetas/"
}
