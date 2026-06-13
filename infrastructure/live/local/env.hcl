locals {
  environment = "local"
}

inputs = {
  cidr_block = "10.255.0.0/16"
  availability_zones = ["us-east-1a"]
  enable_nat_gateway = false
}
