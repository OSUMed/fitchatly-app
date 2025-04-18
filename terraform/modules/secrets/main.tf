# modules/secrets/main.tf

resource "aws_secretsmanager_secret" "database_url" {
  name                    = "${var.app_name}/database_url"
  recovery_window_in_days = 0
  force_overwrite_replica_secret = true
  
  lifecycle {
    ignore_changes = [
      recovery_window_in_days,
    ]
  }
}

resource "aws_secretsmanager_secret_version" "database_url" {
  secret_id     = aws_secretsmanager_secret.database_url.id
  secret_string = "mysql://${var.db_username}:${var.database_password}@${var.db_endpoint}/${var.db_name}?ssl=true"
  
  lifecycle {
    ignore_changes = all
  }
}

resource "aws_secretsmanager_secret" "openai" {
  name                    = "${var.app_name}/openai_api_key"
  recovery_window_in_days = 0
  force_overwrite_replica_secret = true
  
  lifecycle {
    ignore_changes = [
      recovery_window_in_days,
    ]
  }
}

resource "aws_secretsmanager_secret_version" "openai" {
  secret_id     = aws_secretsmanager_secret.openai.id
  secret_string = var.openai_api_key
  
  lifecycle {
    ignore_changes = all
  }
}

# --- New Secrets for NextAuth --- 

# NEXTAUTH_SECRET
resource "aws_secretsmanager_secret" "nextauth_secret" {
  name                    = "${var.app_name}/nextauth_secret"
  recovery_window_in_days = 0
  force_overwrite_replica_secret = true
  
  lifecycle {
    ignore_changes = [
      recovery_window_in_days,
    ]
  }
}

resource "aws_secretsmanager_secret_version" "nextauth_secret" {
  secret_id     = aws_secretsmanager_secret.nextauth_secret.id
  secret_string = var.nextauth_secret
  
  lifecycle {
    ignore_changes = all
  }
}

# GOOGLE_CLIENT_ID
resource "aws_secretsmanager_secret" "google_client_id" {
  name                    = "${var.app_name}/google_client_id"
  recovery_window_in_days = 0
  force_overwrite_replica_secret = true
  
  lifecycle {
    ignore_changes = [
      recovery_window_in_days,
    ]
  }
}

resource "aws_secretsmanager_secret_version" "google_client_id" {
  secret_id     = aws_secretsmanager_secret.google_client_id.id
  secret_string = var.google_client_id
  
  lifecycle {
    ignore_changes = all
  }
}

# GOOGLE_CLIENT_SECRET
resource "aws_secretsmanager_secret" "google_client_secret" {
  name                    = "${var.app_name}/google_client_secret"
  recovery_window_in_days = 0
  force_overwrite_replica_secret = true
  
  lifecycle {
    ignore_changes = [
      recovery_window_in_days,
    ]
  }
}

resource "aws_secretsmanager_secret_version" "google_client_secret" {
  secret_id     = aws_secretsmanager_secret.google_client_secret.id
  secret_string = var.google_client_secret
  
  lifecycle {
    ignore_changes = all
  }
}

# NEXTAUTH_URL (Stored as secret for consistency, though not sensitive)
resource "aws_secretsmanager_secret" "nextauth_url" {
  name                    = "${var.app_name}/nextauth_url"
  recovery_window_in_days = 0
  force_overwrite_replica_secret = true
  
  lifecycle {
    ignore_changes = [
      recovery_window_in_days,
    ]
  }
}

resource "aws_secretsmanager_secret_version" "nextauth_url" {
  secret_id     = aws_secretsmanager_secret.nextauth_url.id
  secret_string = var.nextauth_url
  
  lifecycle {
    ignore_changes = all
  }
} 