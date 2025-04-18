# modules/ecs/variables.tf

variable "app_name" {
  description = "The name of the application."
  type        = string
}

variable "aws_region" {
  description = "The AWS region."
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC where the ECS cluster will be created."
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs where ECS tasks/instances will be placed."
  type        = list(string)
}

variable "ecs_instance_security_group_id" {
  description = "The ID of the security group for the ECS EC2 instances."
  type        = string
}

variable "ecr_repository_url" {
  description = "The URL of the ECR repository containing the application image."
  type        = string
}

variable "app_port" {
  description = "The port the application container listens on."
  type        = number
  default     = 3000
}

variable "target_group_arn" {
  description = "The ARN of the ALB Target Group to associate the ECS service with."
  type        = string
}

# Database connection details (needed to construct DATABASE_URL secret)
variable "db_endpoint" {
  description = "Database instance endpoint."
  type        = string
}
variable "db_port" {
  description = "Database instance port."
  type        = number
  default     = 3306
}
variable "db_name" {
  description = "Database name."
  type        = string
}
variable "db_username" {
  description = "Database master username."
  type        = string
}
variable "db_password" {
  description = "Database master password."
  type        = string
  sensitive   = true
}

# ECS Configuration
variable "desired_task_count" {
  description = "The desired number of tasks (containers) to run."
  type        = number
  default     = 1 # Start with one instance for demo
}

variable "ec2_instance_type" {
  description = "The EC2 instance type for the ECS cluster nodes."
  type        = string
  default     = "t3.micro"
}

variable "task_cpu" {
  description = "The number of CPU units to reserve for the task."
  type        = number
  default     = 256 # 1/4 vCPU
}

variable "task_memory" {
  description = "The amount of memory (in MiB) to reserve for the task."
  type        = number
  default     = 512 # 0.5 GB
} 