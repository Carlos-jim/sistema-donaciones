include "root" {
  path = find_in_parent_folders("root.hcl")
}

dependency "vpc" {
  config_path = "../vpc"
}

terraform {
  source = "${get_repo_root()}/infrastructure/modules/s3//"
}

inputs = {
  enable_versioning       = true
  allowed_origins       = ["https://donaciones.com", "https://www.donaciones.com"]
  allowed_principal_arn = "*"
}
