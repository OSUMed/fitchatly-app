# modules/load_balancer/main.tf

# Create the Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [var.alb_security_group_id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection = false # Set to true for production

  tags = {
    Name = "${var.app_name}-alb"
  }
}

# Create the Target Group (using IP target type for awsvpc network mode)
resource "aws_lb_target_group" "app" {
  # Use name_prefix instead of name to avoid conflicts during replacement
  # Prefix must be 6 characters or less
  name_prefix = "aictg-"
  port        = var.app_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip" # Target task IPs directly for awsvpc mode

  health_check {
    enabled             = true
    path                = var.health_check_path
    port                = "traffic-port"
    protocol            = "HTTP"
    matcher             = "200" # Expect HTTP 200 OK
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name = "${var.app_name}-tg"
  }

  # Ensure the new TG is created before the old one is destroyed
  lifecycle {
    create_before_destroy = true
  }
}

# Create HTTP Listener - Redirects to HTTPS
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# Create HTTPS Listener - Forwards to Target Group
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08" # Choose an appropriate policy
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
} 