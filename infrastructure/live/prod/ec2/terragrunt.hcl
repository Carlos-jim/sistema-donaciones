include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "vpc" {
  config_path = "../vpc"

  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
  mock_outputs = {
    vpc_id            = "vpc-prod"
    public_subnet_ids = ["subnet-prod-public-a", "subnet-prod-public-b", "subnet-prod-public-c"]
  }
}

dependency "database" {
  config_path = "../database"

  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
  mock_outputs = {
    db_endpoint = "donaciones-prod-db.example.com:5432"
    db_name     = "donaciones"
    db_username = "donaciones_admin"
  }
}

dependency "s3" {
  config_path = "../s3"

  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
  mock_outputs = {
    bucket_name = "donaciones-prod-recetas"
  }
}

terraform {
  source = "${get_repo_root()}/infrastructure/modules/ec2//"
}

inputs = {
  vpc_id          = dependency.vpc.outputs.vpc_id
  subnet_id       = dependency.vpc.outputs.public_subnet_ids[0]
  instance_type   = "t3.small"
  create_key_pair = false
  assign_eip      = true
  app_port        = 3000

  db_host     = dependency.database.outputs.db_endpoint
  db_name     = dependency.database.outputs.db_name
  db_user     = dependency.database.outputs.db_username
  db_password = "${get_env("TF_VAR_db_password", "changeme123")}"
  s3_bucket   = dependency.s3.outputs.bucket_name
}
