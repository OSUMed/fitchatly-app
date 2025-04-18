# modules/dns_cert/variables.tf

variable "app_name" {
  description = "The name of the application."
  type        = string
}

variable "domain_name" {
  description = "The domain name for the application (e.g., fitchatly.com)."
  type        = string
}

variable "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer."
  type        = string
}

variable "alb_zone_id" {
  description = "The Zone ID of the Application Load Balancer."
  type        = string
} 