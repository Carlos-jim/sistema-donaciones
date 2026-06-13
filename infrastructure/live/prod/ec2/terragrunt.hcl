include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "vpc" {
  config_path = "../vpc"
}

dependency "database" {
  config_path = "../database"
}

dependency "s3" {
  config_path = "../s3"
}

terraform {
  source = "${get_repo_root()}/infrastructure/modules/ec2//"
}

inputs = {
  subnet_id         = dependency.vpc.outputs.public_subnet_ids[0]
  instance_type     = "t3.small"
  create_key_pair   = false
  assign_eip        = true
  app_port          = 3000
  
  db_host     = dependency.database.outputs.db_endpoint
  db_name     = dependency.database.outputs.db_name
  db_user     = dependency.database.outputs.db_username
  db_password = "${get_env("TF_VAR_db_password", "changeme123")}"
  s3_bucket   = dependency.s3.outputs.bucket_name
}
