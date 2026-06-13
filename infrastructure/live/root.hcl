locals {
  environment_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  environment      = local.environment_vars.locals.environment
  project_name     = "donaciones"
  aws_region       = "us-east-1"
}

# Generar el proveedor AWS
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite"
  contents  = <<EOF
provider "aws" {
  region = "${local.aws_region}"
  default_tags {
    tags = {
      Environment = "${local.environment}"
      Project     = "${local.project_name}"
      ManagedBy   = "terragrunt"
    }
  }
}
EOF
}

# Configuración del backend S3
remote_state {
  backend = "s3"
  config = {
    bucket         = "${local.project_name}-terraform-state-${local.environment}"
    key            = "${path_relative_to_include()}/terraform.tfstate"
    region         = local.aws_region
    encrypt        = true
    dynamodb_table = "${local.project_name}-terraform-locks-${local.environment}"
  }
  generate = {
    path      = "backend.tf"
    if_exists = "overwrite"
  }
}

# Inputs globales (merge con env.hcl)
inputs = merge(
  try(local.environment_vars.inputs, {}),
  {
    project_name = local.project_name
    environment  = local.environment
    aws_region   = local.aws_region
  }
)
