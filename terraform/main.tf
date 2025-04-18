# Root main.tf - Calls modules to create infrastructure

module "networking" {
  source = "./modules/networking"

  app_name             = var.app_name
  aws_region           = var.aws_region
  vpc_cidr             = var.vpc_cidr
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  availability_zones   = var.availability_zones
  my_ip_address        = var.my_ip_address
  # app_port and db_port use defaults defined in the module's variables.tf
}

module "secrets" {
  source = "./modules/secrets"

  project_name         = var.project_name
  app_name             = var.app_name
  database_password    = var.db_password
  db_username          = module.database.db_username
  db_endpoint          = module.database.db_instance_endpoint
  db_port              = module.database.db_instance_port
  db_name              = module.database.db_name
  openai_api_key       = var.openai_api_key
  nextauth_secret      = var.nextauth_secret
  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
  nextauth_url         = "https://${var.domain_name}"
}

module "database" {
  source = "./modules/database"

  app_name              = var.app_name
  db_password           = var.db_password
  private_subnet_ids    = module.networking.private_subnet_ids
  rds_security_group_id = module.networking.rds_security_group_id
  vpc_id                = module.networking.vpc_id
  # db_name, db_username, instance_class, allocated_storage use defaults
}

module "ecr" {
  source = "./modules/ecr"

  app_name = var.app_name
}

module "load_balancer" {
  source = "./modules/load_balancer"

  app_name              = var.app_name
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  alb_security_group_id = module.networking.alb_security_group_id
  acm_certificate_arn   = module.dns_cert.acm_certificate_arn
  # app_port and health_check_path use defaults
}

module "dns_cert" {
  source = "./modules/dns_cert"

  app_name     = var.app_name
  domain_name  = var.domain_name
  alb_dns_name = module.load_balancer.alb_dns_name
  alb_zone_id  = module.load_balancer.alb_zone_id
}

module "ecs" {
  source = "./modules/ecs"

  app_name                       = var.app_name
  aws_region                     = var.aws_region
  vpc_id                         = module.networking.vpc_id
  private_subnet_ids             = module.networking.private_subnet_ids
  ecs_instance_security_group_id = module.networking.ecs_instance_security_group_id
  ecr_repository_url             = module.ecr.repository_url
  target_group_arn               = module.load_balancer.target_group_arn

  # Database details for DATABASE_URL secret
  db_endpoint = module.database.db_instance_endpoint
  db_port     = module.database.db_instance_port
  db_name     = module.database.db_name
  db_username = module.database.db_username
  db_password = var.db_password

  # Defaults for desired_task_count, ec2_instance_type, task_cpu, task_memory will be used
}

# We will add other module calls here step-by-step

# Example:
# module "secrets" {
#   source = "./modules/secrets"
#
#   app_name       = var.app_name
#   openai_api_key = var.openai_api_key
# }

# ... other modules will be added here 