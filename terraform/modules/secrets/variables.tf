# modules/secrets/variables.tf

variable "app_name" {
  description = "The name of the application."
  type        = string
}

variable "project_name" {
  description = "The base name for resources"
  type        = string
}

variable "database_password" {
  description = "Password for the RDS database master user"
  type        = string
  sensitive   = true
}

# Add variables needed to construct DATABASE_URL
variable "db_username" {
  description = "Username for the RDS database"
  type        = string
  sensitive   = true # Technically part of credentials
}

variable "db_endpoint" {
  description = "Endpoint address of the RDS database"
  type        = string
}

variable "db_port" {
  description = "Port number of the RDS database"
  type        = number
}

variable "db_name" {
  description = "Name of the database within the RDS instance"
  type        = string
}

variable "openai_api_key" {
  description = "API Key for OpenAI"
  type        = string
  sensitive   = true
}

# New Variables for NextAuth
variable "nextauth_secret" {
  description = "A strong secret for NextAuth.js JWT signing (generate with: openssl rand -base64 32)"
  type        = string
  sensitive   = true
}

variable "google_client_id" {
  description = "Google OAuth Client ID"
  type        = string
  sensitive   = true // Treat as sensitive although technically public
}

variable "google_client_secret" {
  description = "Google OAuth Client Secret"
  type        = string
  sensitive   = true
}

variable "nextauth_url" {
  description = "The public URL of the application for NextAuth callbacks"
  type        = string
} 