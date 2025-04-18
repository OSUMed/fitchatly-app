# modules/ecs/main.tf

# --- IAM Roles ---

# Role for ECS Task Execution (Agent Permissions: pull images, get secrets, write logs)
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "${var.app_name}-ecs-task-exec-role"

  assume_role_policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Action    = "sts:AssumeRole",
        Effect    = "Allow",
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.app_name}-ecs-task-exec-role"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Role for ECS Tasks to interact with other AWS services (Secrets Manager, etc.)
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.app_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Action    = "sts:AssumeRole",
        Effect    = "Allow",
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.app_name}-ecs-task-role"
  }
}

# Policy to allow reading specific secrets
resource "aws_iam_policy" "ecs_secrets_policy" {
  name        = "${var.app_name}-ecs-secrets-policy"
  description = "Allow ECS tasks to read specific secrets from Secrets Manager"

  policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "secretsmanager:GetSecretValue"
        ],
        Resource = [
          "arn:aws:secretsmanager:${var.aws_region}:*:secret:${var.app_name}/*"
        ]
      }
    ]
  })
}

# Policy to allow ECS Exec functionality (SSM Session Manager)
resource "aws_iam_policy" "ecs_exec_policy" {
  name        = "${var.app_name}-ecs-exec-policy"
  description = "Allow ECS Exec functionality for container debugging"

  policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = [
          "ssmmessages:CreateControlChannel",
          "ssmmessages:CreateDataChannel",
          "ssmmessages:OpenControlChannel",
          "ssmmessages:OpenDataChannel"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_secrets" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = aws_iam_policy.ecs_secrets_policy.arn
}

resource "aws_iam_role_policy_attachment" "ecs_task_exec" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.ecs_exec_policy.arn
}

# Role for ECS Service Agent (needed for EC2 launch type)
resource "aws_iam_role" "ecs_service_role" {
  name = "${var.app_name}-ecs-service-role"

  assume_role_policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Action    = "sts:AssumeRole",
        Effect    = "Allow",
        Principal = {
          Service = "ecs.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.app_name}-ecs-service-role"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_service_role_policy" {
  role       = aws_iam_role.ecs_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceRole" # Managed policy for ECS service
}


# Role for EC2 instances in the ECS cluster
resource "aws_iam_role" "ecs_instance_role" {
  name = "${var.app_name}-ecs-instance-role"

  assume_role_policy = jsonencode({
    Version   = "2012-10-17",
    Statement = [
      {
        Action    = "sts:AssumeRole",
        Effect    = "Allow",
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.app_name}-ecs-instance-role"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_instance_role_policy" {
  role       = aws_iam_role.ecs_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role" # Managed policy for ECS instances
}

resource "aws_iam_instance_profile" "ecs_instance_profile" {
  name = "${var.app_name}-ecs-instance-profile"
  role = aws_iam_role.ecs_instance_role.name
}

# --- Cluster --- 
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-cluster"
  
  # Enable execute command functionality at cluster level
  configuration {
    execute_command_configuration {
      logging = "OVERRIDE"
      log_configuration {
        cloud_watch_log_group_name = aws_cloudwatch_log_group.ecs.name
      }
    }
  }

  tags = {
    Name = "${var.app_name}-cluster"
  }
}

# --- EC2 Instances for ECS --- 

# Find the latest ECS-optimized Amazon Linux 2 AMI
data "aws_ami" "ecs_ami" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-ecs-hvm-*-x86_64-ebs"] # ECS-optimized AMI filter
  }
}

# User data script to register the instance with the ECS cluster
locals {
  ecs_user_data = <<-EOT
                    #!/bin/bash
                    echo ECS_CLUSTER=${aws_ecs_cluster.main.name} >> /etc/ecs/ecs.config
                    EOT
}

# Create Launch Template instead of Launch Configuration
resource "aws_launch_template" "ecs" {
  name_prefix   = "${var.app_name}-ecs-"
  image_id      = data.aws_ami.ecs_ami.id
  instance_type = var.ec2_instance_type

  iam_instance_profile {
    arn = aws_iam_instance_profile.ecs_instance_profile.arn
  }

  network_interfaces {
    associate_public_ip_address = false # Don't assign public IPs in private subnet
    security_groups             = [var.ecs_instance_security_group_id]
    # delete_on_termination = true # Default is true
  }

  user_data = base64encode(local.ecs_user_data)

  # Add tags if needed, e.g., for cost allocation
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.app_name}-ecs-instance"
    }
  }
  tag_specifications {
    resource_type = "volume"
    tags = {
      Name = "${var.app_name}-ecs-volume"
    }
  }

  # Required for EC2 launch type with ECS
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "ecs" {
  name                      = "${var.app_name}-ecs-asg"
  # Remove launch_configuration argument
  # launch_configuration      = aws_launch_configuration.ecs.name
  min_size                  = 1 # Start with at least one instance
  max_size                  = 3 # Allow scaling up to 3 instances
  desired_capacity          = var.desired_task_count # Match desired tasks initially
  vpc_zone_identifier       = var.private_subnet_ids
  health_check_type         = "EC2"
  health_check_grace_period = 300

  # Use launch_template instead
  launch_template {
    id      = aws_launch_template.ecs.id
    version = "$Latest" # Always use the latest version of the launch template
  }

  # Ensure instances are replaced if launch config changes
  # Also helps with rolling updates later if needed
  # replace_on_change = true # <--- REMOVED EARLIER

  tag {
    key                 = "Name"
    value               = "${var.app_name}-ecs-instance"
    propagate_at_launch = true
  }
  tag {
    key                 = "AmazonECSManaged"
    value               = "true"
    propagate_at_launch = true
  }
}

# --- ECS Capacity Provider --- 
# Links the Auto Scaling Group to the ECS cluster
resource "aws_ecs_capacity_provider" "ecs" {
  name = "${var.app_name}-cp"

  auto_scaling_group_provider {
    auto_scaling_group_arn         = aws_autoscaling_group.ecs.arn
    managed_scaling {
      status                    = "ENABLED"
      target_capacity           = 75 # Example: Target 75% CPU utilization
      minimum_scaling_step_size = 1
      maximum_scaling_step_size = 2
    }
    managed_termination_protection = "DISABLED"
  }
}

resource "aws_ecs_cluster_capacity_providers" "ecs" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = [aws_ecs_capacity_provider.ecs.name]

  default_capacity_provider_strategy {
    base              = 1 # Minimum number of tasks to run using this provider
    weight            = 100 # Percentage of tasks to run using this provider
    capacity_provider = aws_ecs_capacity_provider.ecs.name
  }
}

# --- Logging --- 
resource "aws_cloudwatch_log_group" "ecs" {
  name = "/ecs/${var.app_name}"

  tags = {
    Name = "${var.app_name}-ecs-logs"
  }
}

# --- Task Definition --- 
resource "aws_ecs_task_definition" "app" {
  family                   = var.app_name
  network_mode             = "awsvpc" # Required for EC2 with public IPs if using secrets/service discovery
  requires_compatibilities = ["EC2"]
  cpu                      = var.task_cpu
  memory                   = var.task_memory
  task_role_arn            = aws_iam_role.ecs_task_role.arn
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn
  # execution_role_arn needed for Fargate, less critical for EC2 but good practice for pulling images/logs
  # For EC2, the instance role handles pulling images primarily.

  container_definitions = jsonencode([
    {
      name      = var.app_name
      image     = "${var.ecr_repository_url}:latest" # Assumes image tagged 'latest'
      essential = true
      cpu       = var.task_cpu   # Can specify per container or task level
      memory    = var.task_memory # Can specify per container or task level
      portMappings = [
        {
          containerPort = var.app_port
          # hostPort is omitted for awsvpc networking unless using bridge mode
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
      # Add environment variables directly here if they are not secrets
      environment = [
        {
          name  = "AUTH_TRUST_HOST" # Tell NextAuth to trust the host header
          value = "true"
        },
        # Add other non-sensitive env vars here if needed
      ]
      secrets = [
        {
          name      = "OPENAI_API_KEY"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:183295439509:secret:ai-chat-app/openai_api_key"
        },
        {
          name      = "DATABASE_URL"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:183295439509:secret:ai-chat-app/database_url"
        },
        {
          name      = "NEXTAUTH_SECRET"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:183295439509:secret:ai-chat-app/nextauth_secret"
        },
        {
          name      = "GOOGLE_CLIENT_ID"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:183295439509:secret:ai-chat-app/google_client_id"
        },
        {
          name      = "GOOGLE_CLIENT_SECRET"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:183295439509:secret:ai-chat-app/google_client_secret"
        },
        {
          name      = "NEXTAUTH_URL"
          valueFrom = "arn:aws:secretsmanager:${var.aws_region}:183295439509:secret:ai-chat-app/nextauth_url"
        }
      ]
      # Add health check if your app supports it at var.app_port
      # healthCheck = {
      #   command = [ "CMD-SHELL", "curl -f http://localhost:${var.app_port}/api/health || exit 1" ]
      #   interval = 30
      #   timeout = 5
      #   retries = 3
      #   startPeriod = 60
      # }
    }
  ])

  tags = {
    Name = "${var.app_name}-task-def"
  }
}

# --- ECS Service --- 
resource "aws_ecs_service" "app" {
  name            = "${var.app_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  desired_count   = var.desired_task_count
  # Add a grace period before starting health checks
  health_check_grace_period_seconds = 90
  
  # Enable ECS Exec for debugging
  enable_execute_command = true

  # Use the capacity provider strategy defined at the cluster level
  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ecs.name
    weight            = 100
  }

  load_balancer {
    target_group_arn = var.target_group_arn
    container_name   = var.app_name
    container_port   = var.app_port
  }

  # Required for awsvpc network mode
  network_configuration {
    subnets         = var.private_subnet_ids
    security_groups = [var.ecs_instance_security_group_id]
    # assign_public_ip = true # REMOVING: Not supported/needed for EC2 launch type
  }

  # Required for EC2 launch type if the service role needs to interact with ALB/ELB
  # iam_role = aws_iam_role.ecs_service_role.arn # REMOVING: Cannot specify role when SLR is required/used

  # Ensure ASG is up before service tries to place tasks
  depends_on = [
    aws_autoscaling_group.ecs,
    aws_iam_role_policy_attachment.ecs_service_role_policy
  ]

  tags = {
    Name = "${var.app_name}-service"
  }
} 