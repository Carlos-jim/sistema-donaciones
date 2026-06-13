include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "vpc" {
  config_path = "../vpc"

  mock_outputs_allowed_terraform_commands = ["validate", "plan"]
  mock_outputs = {
    private_subnet_ids         = ["subnet-prod-private-a", "subnet-prod-private-b", "subnet-prod-private-c"]
    database_security_group_id = "sg-prod-database"
  }
}

terraform {
  source = "${get_repo_root()}/infrastructure/modules/database//"
}

inputs = {
  subnet_ids              = dependency.vpc.outputs.private_subnet_ids
  security_group_id       = dependency.vpc.outputs.database_security_group_id
  instance_class          = "db.t3.small"
  allocated_storage       = 50
  skip_final_snapshot     = false
  deletion_protection     = true
  backup_retention_period = 14
  db_username             = "${get_env("TF_VAR_db_username", "donaciones_admin")}"
  db_password             = "${get_env("TF_VAR_db_password", "changeme123")}"
}
