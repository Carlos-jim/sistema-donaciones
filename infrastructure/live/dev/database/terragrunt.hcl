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
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  skip_final_snapshot = true
  deletion_protection = false
}
