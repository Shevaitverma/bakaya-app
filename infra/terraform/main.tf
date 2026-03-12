# -----------------------------------------------------------------------------
# Root Module Composition
# Wires together all infrastructure modules following the dependency graph:
#   vpc -> security-group -> ec2 -> load-balancer
# -----------------------------------------------------------------------------

# -----------------------------------------------------------------------------
# Networking
# -----------------------------------------------------------------------------
module "vpc" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr
}

# -----------------------------------------------------------------------------
# Security Groups
# -----------------------------------------------------------------------------
module "security_group" {
  source = "./modules/security-group"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  ssh_allowed_cidrs = var.ssh_allowed_cidrs
}

# -----------------------------------------------------------------------------
# Compute
# -----------------------------------------------------------------------------
module "ec2" {
  source = "./modules/ec2"

  project_name      = var.project_name
  environment       = var.environment
  instance_type     = var.instance_type
  subnet_id         = module.vpc.public_subnet_ids[0]
  security_group_id = module.security_group.ec2_security_group_id
  key_pair_name     = var.key_pair_name
}

# -----------------------------------------------------------------------------
# Load Balancer
# -----------------------------------------------------------------------------
module "load_balancer" {
  source = "./modules/load-balancer"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.security_group.alb_security_group_id
  target_instance_id    = module.ec2.instance_id
  certificate_arn       = var.certificate_arn
}
