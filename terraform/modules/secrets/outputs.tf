# modules/secrets/outputs.tf

output "database_url_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the database URL"
  value       = aws_secretsmanager_secret.database_url.arn
}

output "openai_api_key_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the OpenAI API Key"
  value       = aws_secretsmanager_secret.openai.arn
}

# --- New Outputs --- 

output "nextauth_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the NEXTAUTH_SECRET"
  value       = aws_secretsmanager_secret.nextauth_secret.arn
}

output "google_client_id_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the GOOGLE_CLIENT_ID"
  value       = aws_secretsmanager_secret.google_client_id.arn
}

output "google_client_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the GOOGLE_CLIENT_SECRET"
  value       = aws_secretsmanager_secret.google_client_secret.arn
}

output "nextauth_url_secret_arn" {
  description = "ARN of the Secrets Manager secret containing the NEXTAUTH_URL"
  value       = aws_secretsmanager_secret.nextauth_url.arn
} 