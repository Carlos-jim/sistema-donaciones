include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "vpc" {
  config_path = "../vpc"

  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
  mock_outputs = {
    vpc_id                = "vpc-dev"
    public_subnet_ids     = ["subnet-dev-public-a", "subnet-dev-public-b"]
    app_security_group_id = "sg-dev-app"
  }
}

dependency "database" {
  config_path = "../database"

  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
  mock_outputs = {
    db_endpoint = "donaciones-dev-db.example.com:5432"
    db_name     = "donaciones"
    db_username = "donaciones_admin"
  }
}

terraform {
  source = "${get_repo_root()}/infrastructure/modules/app//"
}

inputs = {
  vpc_id                = dependency.vpc.outputs.vpc_id
  public_subnet_ids     = dependency.vpc.outputs.public_subnet_ids
  app_security_group_id = dependency.vpc.outputs.app_security_group_id
  db_endpoint           = dependency.database.outputs.db_endpoint
  db_name               = dependency.database.outputs.db_name
  db_username           = dependency.database.outputs.db_username
  db_password           = "${get_env("TF_VAR_db_password", "changeme123")}"
  container_image       = "nginx:latest" # Placeholder: reemplazar con la imagen de ECR
  desired_count         = 1
  cpu                   = "256"
  memory                = "512"
}
