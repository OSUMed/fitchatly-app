# Root outputs.tf - Define outputs from the infrastructure\n\n# We will add outputs here as modules are created\n\n# Example:\n# output \"alb_dns_name\" {\n#   description = \"The DNS name of the Application Load Balancer.\"\n#   value       = module.load_balancer.alb_dns_name\n# }\n\n# output \"application_url\" {\n#   description = \"The URL where the application is accessible.\"\n#   value       = \"https://\${var.domain_name}\"\n# }\n

output "application_url" {
  description = "The URL where the application is accessible."
  value       = "https://${var.domain_name}"
}

output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer."
  value       = module.load_balancer.alb_dns_name
}

output "ecr_repository_url" {
  description = "The URL of the ECR repository to push the Docker image to."
  value       = module.ecr.repository_url
}

output "rds_instance_endpoint" {
  description = "The connection endpoint for the database instance."
  value       = module.database.db_instance_endpoint
}

output "route53_zone_name_servers" {
  description = "The name servers for the created Route 53 hosted zone. Update these at your domain registrar."
  value       = module.dns_cert.route53_zone_name_servers
} 