# modules/database/variables.tf

variable "app_name" {
  description = "The name of the application."
  type        = string
}

variable "db_name" {
  description = "The name of the database to create."
  type        = string
  default     = "aichatapp"
}

variable "db_username" {
  description = "The username for the database master user."
  type        = string
  default     = "admin"
}

variable "db_password" {
  description = "The password for the database master user."
  type        = string
  sensitive   = true
}

variable "instance_class" {
  description = "The instance class for the RDS instance."
  type        = string
  default     = "db.t3.micro" # Free tier eligible
}

variable "allocated_storage" {
  description = "The allocated storage in GB."
  type        = number
  default     = 20 # Minimum for free tier eligibility sometimes
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for the DB subnet group."
  type        = list(string)
}

variable "rds_security_group_id" {
  description = "The ID of the security group for the RDS instance."
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC where the RDS instance will be created."
  type        = string
} 