locals {
  environment_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  environment      = local.environment_vars.locals.environment
  project_name     = "donaciones"
  aws_region       = "us-east-1"
  
  # Detectar si estamos en LocalStack
  is_localstack = true
}

# Generar el proveedor AWS apuntando a LocalStack
generate "provider" {
  path      = "provider.tf"
  if_exists = "overwrite"
  contents  = <<EOF
provider "aws" {
  region = "${local.aws_region}"
  
  access_key = "test"
  secret_key = "test"
  
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_requesting_account_id  = true
  
  endpoints {
    ec2            = "http://localhost:4566"
    s3             = "http://s3.localhost.localstack.cloud:4566"
    rds            = "http://localhost:4566"
    iam            = "http://localhost:4566"
    sts            = "http://localhost:4566"
    elbv2          = "http://localhost:4566"
    cloudwatch     = "http://localhost:4566"
    cloudwatchlogs = "http://localhost:4566"
    dynamodb       = "http://localhost:4566"
  }
  
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

# Configuración del backend local (no S3 para local)
remote_state {
  backend = "local"
  config = {
    path = "${get_repo_root()}/infrastructure/.terragrunt-local/${path_relative_to_include()}/terraform.tfstate"
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
