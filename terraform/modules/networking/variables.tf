# modules/networking/variables.tf

variable "app_name" {
  description = "The name of the application."
  type        = string
}

variable "aws_region" {
  description = "The AWS region."
  type        = string
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC."
  type        = string
}

variable "public_subnet_cidrs" {
  description = "List of CIDR blocks for public subnets."
  type        = list(string)
}

variable "private_subnet_cidrs" {
  description = "List of CIDR blocks for private subnets."
  type        = list(string)
}

variable "availability_zones" {
  description = "List of Availability Zones to use."
  type        = list(string)
}

variable "db_port" {
  description = "The port the RDS database will listen on."
  type        = number
  default     = 3306 # MySQL default
}

variable "app_port" {
  description = "The port the application container listens on."
  type        = number
  default     = 3000
}

variable "my_ip_address" {
  description = "Your current public IP address to allow direct DB access."
  type        = string
} 