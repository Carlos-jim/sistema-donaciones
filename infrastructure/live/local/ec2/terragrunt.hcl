include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "vpc" {
  config_path = "../vpc"
}

dependency "s3" {
  config_path = "../s3"
}

terraform {
  source = "${get_repo_root()}/infrastructure/modules/ec2//"
}

inputs = {
  subnet_id         = dependency.vpc.outputs.public_subnet_ids[0]
  instance_type     = "t3.micro"
  create_key_pair   = false
  assign_eip        = false
  app_port          = 3000
  ami_id            = "ami-12345678"  # LocalStack mock AMI
  
  # Para LocalStack, apuntamos al contenedor PostgreSQL
  db_host     = "host.docker.internal"
  db_password = "localpassword123"
  s3_bucket   = dependency.s3.outputs.bucket_name
}
