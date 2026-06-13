include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "vpc" {
  config_path = "../vpc"
}

terraform {
  source = "${get_repo_root()}/infrastructure/modules/database//"
}

inputs = {
  subnet_ids        = dependency.vpc.outputs.private_subnet_ids
  security_group_id = dependency.vpc.outputs.database_security_group_id
  instance_class    = "db.t3.small"
  allocated_storage = 50
  skip_final_snapshot = false
  deletion_protection = true
  backup_retention_period = 14
}
