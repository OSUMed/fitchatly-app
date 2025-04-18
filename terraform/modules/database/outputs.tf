# modules/database/outputs.tf

output "db_instance_endpoint" {
  description = "The connection endpoint for the database instance."
  value       = aws_db_instance.main.endpoint
}

output "db_instance_port" {
  description = "The port the database instance is listening on."
  value       = aws_db_instance.main.port
}

output "db_name" {
  description = "The name of the database."
  value       = aws_db_instance.main.db_name
}

output "db_username" {
  description = "The master username for the database."
  value       = aws_db_instance.main.username
} 