include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "vpc" {
  config_path = "../vpc"
}

dependency "database" {
  config_path = "../database"
}

terraform {
  source = "${get_repo_root()}/infrastructure/modules/app//"
}

inputs = {
  vpc_id              = dependency.vpc.outputs.vpc_id
  public_subnet_ids   = dependency.vpc.outputs.public_subnet_ids
  app_security_group_id = dependency.vpc.outputs.app_security_group_id
  db_endpoint         = dependency.database.outputs.db_endpoint
  db_name             = dependency.database.outputs.db_name
  db_username         = dependency.database.outputs.db_username
  container_image     = "nginx:latest"  # Placeholder: reemplazar con la imagen de ECR
  desired_count       = 1
  cpu                 = "256"
  memory              = "512"
}
