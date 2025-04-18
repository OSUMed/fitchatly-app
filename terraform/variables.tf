# Define root level variables

variable "aws_region" {
  description = "The AWS region to deploy resources in."
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "The name of the application (used for resource naming)"
  type        = string
  default     = "ai-chat-app"
}

variable "project_name" {
  description = "The base name for resources (often same as app_name)"
  type        = string
  default     = "ai-chat-app" # Or use a different name if desired
}

variable "db_password" {
  description = "The password for the RDS database master user."
  type        = string
  sensitive   = true
  # Defaulting to the one specified, but ideally this should be overridden via tfvars or environment variables
}

variable "domain_name" {
  description = "The domain name for the application (e.g., fitchatly.com)."
  type        = string
  default     = "fitchatly.com"
}

variable "openai_api_key" {
  description = "API Key for OpenAI"
  type        = string
  sensitive   = true
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "List of CIDR blocks for public subnets."
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "List of CIDR blocks for private subnets."
  type        = list(string)
  default     = ["10.0.101.0/24", "10.0.102.0/24"] # Changed CIDRs to avoid overlap
}

variable "availability_zones" {
  description = "List of Availability Zones to use."
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "my_ip_address" {
  description = "Your current public IP address to allow DB access from SQL Workbench. Get from https://www.google.com/search?q=what+is+my+ip+address"
  type        = string
  default     = "0.0.0.0/0" # Replace with your actual IP/32 for better security
}

# --- NextAuth Variables --- 

variable "nextauth_secret" {
  description = "A strong secret for NextAuth.js JWT signing (generate with: openssl rand -base64 32). Store the value securely (e.g., in tfvars or environment variable)."
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth Client ID. Store the value securely."
  type        = string
  sensitive   = true // Treat as sensitive for consistency
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret. Store the value securely."
  type        = string
  sensitive   = true
}

# No variable needed for nextauth_url as it's derived from domain_name 