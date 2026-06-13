locals {
  environment = "prod"
}

inputs = {
  cidr_block = "10.1.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
  enable_nat_gateway = true
}
