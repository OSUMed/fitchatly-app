# modules/load_balancer/outputs.tf

output "alb_dns_name" {
  description = "The DNS name of the Application Load Balancer."
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "The Zone ID of the Application Load Balancer (needed for Route 53 Alias records)."
  value       = aws_lb.main.zone_id
}

output "target_group_arn" {
  description = "The ARN of the target group."
  value       = aws_lb_target_group.app.arn
}

output "https_listener_arn" {
  description = "The ARN of the HTTPS listener."
  value       = aws_lb_listener.https.arn
} 