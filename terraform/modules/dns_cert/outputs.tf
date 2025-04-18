# modules/dns_cert/outputs.tf

output "acm_certificate_arn" {
  description = "The ARN of the validated ACM certificate."
  value       = aws_acm_certificate_validation.main.certificate_arn
}

output "route53_zone_id" {
  description = "The ID of the Route 53 hosted zone."
  value       = aws_route53_zone.main.zone_id
}

output "route53_zone_name_servers" {
  description = "The name servers for the hosted zone."
  value       = aws_route53_zone.main.name_servers
} 