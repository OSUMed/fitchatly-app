# modules/networking/outputs.tf

output "vpc_id" {
  description = "The ID of the VPC."
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "List of IDs of the public subnets."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of IDs of the private subnets."
  value       = aws_subnet.private[*].id
}

output "alb_security_group_id" {
  description = "The ID of the security group for the ALB."
  value       = aws_security_group.alb.id
}

output "ecs_instance_security_group_id" {
  description = "The ID of the security group for the ECS EC2 instances."
  value       = aws_security_group.ecs_instances.id
}

output "rds_security_group_id" {
  description = "The ID of the security group for the RDS instance."
  value       = aws_security_group.rds.id
} 