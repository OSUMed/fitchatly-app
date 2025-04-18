# modules/networking/main.tf

# Get availability zones data
data "aws_availability_zones" "available" {
  state = "available"
}

# Ensure the number of AZs matches the number of subnets requested
locals {
  subnet_count = min(length(var.public_subnet_cidrs), length(var.private_subnet_cidrs), length(var.availability_zones))
}

# ------------------------------------------------------------------------------
# VPC
# ------------------------------------------------------------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.app_name}-vpc"
  }
}

# ------------------------------------------------------------------------------
# Internet Gateway
# ------------------------------------------------------------------------------
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.app_name}-igw"
  }
}

# ------------------------------------------------------------------------------
# NAT Gateway
# ------------------------------------------------------------------------------
# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
  
  tags = {
    Name = "${var.app_name}-nat-eip"
  }
}

# NAT Gateway (in public subnet)
resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id  # Place in first public subnet
  
  tags = {
    Name = "${var.app_name}-nat-gateway"
  }
  
  depends_on = [aws_internet_gateway.gw]
}

# ------------------------------------------------------------------------------
# Subnets
# ------------------------------------------------------------------------------
resource "aws_subnet" "public" {
  count                   = local.subnet_count
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true # Instances launched here get public IPs

  tags = {
    Name = "${var.app_name}-public-subnet-${var.availability_zones[count.index]}"
    Tier = "Public"
  }
}

resource "aws_subnet" "private" {
  count             = local.subnet_count
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "${var.app_name}-private-subnet-${var.availability_zones[count.index]}"
    Tier = "Private"
  }
}

# ------------------------------------------------------------------------------
# Routing
# ------------------------------------------------------------------------------
# Public Route Table (for public subnets)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name = "${var.app_name}-public-rtb"
  }
}

# Private Route Table (for private subnets) - Routes through NAT Gateway
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = {
    Name = "${var.app_name}-private-rtb"
  }
}

# Associate public subnets with the public route table
resource "aws_route_table_association" "public" {
  count          = local.subnet_count
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Associate private subnets with the private route table
resource "aws_route_table_association" "private" {
  count          = local.subnet_count
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ------------------------------------------------------------------------------
# Security Groups
# ------------------------------------------------------------------------------

# Security Group for the Application Load Balancer (ALB)
resource "aws_security_group" "alb" {
  name        = "${var.app_name}-alb-sg"
  description = "Allow HTTP/HTTPS traffic to ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-alb-sg"
  }
}

# Security Group for the ECS EC2 Instances
resource "aws_security_group" "ecs_instances" {
  name        = "${var.app_name}-ecs-instance-sg"
  description = "Allow traffic to ECS instances"
  vpc_id      = aws_vpc.main.id

  # Allow traffic from ALB on the application port
  ingress {
    description     = "Allow traffic from ALB"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # Allow all outbound traffic (needed for pulling images, talking to OpenAI, etc.)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-ecs-instance-sg"
  }
}

# Security Group for the RDS Database
resource "aws_security_group" "rds" {
  name        = "${var.app_name}-rds-sg"
  description = "Allow traffic to RDS instance"
  vpc_id      = aws_vpc.main.id

  # Allow traffic from ECS instances on the DB port
  ingress {
    description     = "Allow traffic from ECS instances"
    from_port       = var.db_port
    to_port         = var.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_instances.id]
  }

  # Allow traffic from Your IP on the DB port
  ingress {
    description = "Allow MySQL access from my IP"
    from_port   = var.db_port
    to_port     = var.db_port
    protocol    = "tcp"
    cidr_blocks = ["${var.my_ip_address}"] # Use proper CIDR format
  }

  # Allow all outbound (generally not needed for RDS, but safe default)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-rds-sg"
  }
} 