include "root" {
  path = find_in_parent_folders("root.hcl")
}

terraform {
  source = "${get_repo_root()}/infrastructure/modules/s3//"
}

inputs = {
  enable_versioning     = true
  allowed_origins       = ["http://localhost:3000", "https://dev.donaciones.com"]
  allowed_principal_arn = "*"
}
