# modules/dns_cert/main.tf

# 1. Create Route 53 Hosted Zone (if it doesn't exist)
# Note: If the zone already exists in your account, Terraform can import it or you can use a data source.
# For simplicity here, we assume it needs to be created.
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name = "${var.app_name}-hosted-zone"
  }
}

# 2. Request ACM Certificate
resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  tags = {
    Name = "${var.app_name}-certificate"
  }

  # Ensure the certificate isn't created until the hosted zone is available
  lifecycle {
    create_before_destroy = true
  }
}

# 3. Create DNS Validation Records in Route 53
# Create a record for each validation option provided by ACM
resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.main.domain_validation_options :
    dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true # Recommended for validation records
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60 # Lower TTL for faster validation
  type            = each.value.type
  zone_id         = aws_route53_zone.main.zone_id
}

# 4. Wait for Certificate Validation
resource "aws_acm_certificate_validation" "main" {
  certificate_arn         = aws_acm_certificate.main.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# 5. Create Route 53 Alias Record pointing to ALB
resource "aws_route53_record" "app_alias" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
} 