# modules/load_balancer/variables.tf

variable "app_name" {
  description = "The name of the application."
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC."
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB."
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "The ID of the security group for the ALB."
  type        = string
}

variable "app_port" {
  description = "The port the application container listens on."
  type        = number
  default     = 3000
}

variable "health_check_path" {
  description = "The path for the ALB health check."
  type        = string
  default     = "/api/health" # Default based on previous scripts
}

variable "acm_certificate_arn" {
  description = "The ARN of the ACM certificate for HTTPS."
  type        = string
  # This will be passed in from the dns_cert module later
} 