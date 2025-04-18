# modules/database/main.tf

# Create a DB subnet group using the private subnets
resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-db-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.app_name}-db-subnet-group"
  }
}

# Create the RDS MySQL instance
resource "aws_db_instance" "main" {
  identifier             = "${var.app_name}-db"
  engine                 = "mysql"
  engine_version         = "8.0" # Specify a version, e.g., 8.0
  instance_class         = var.instance_class
  allocated_storage      = var.allocated_storage
  storage_type           = "gp2"
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.rds_security_group_id]
  publicly_accessible    = false # Changed to false for private subnet access
  skip_final_snapshot    = true # For demo purposes, easier cleanup

  tags = {
    Name = "${var.app_name}-db"
  }
} 