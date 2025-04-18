# modules/ecr/main.tf

resource "aws_ecr_repository" "app" {
  name                 = var.app_name
  image_tag_mutability = "MUTABLE" # Or "IMMUTABLE" if you prefer

  image_scanning_configuration {
    scan_on_push = true
  }

  # Add force_delete to allow deletion even if images exist
  force_delete = true

  tags = {
    Name = "${var.app_name}-ecr-repo"
  }
} 