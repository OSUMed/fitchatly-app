#!/bin/bash
# Step 6: Set up Route 53 and ACM

# Source the environment variables
source aws-resources.env
APP_NAME="ai-chat-app"
AWS_REGION="us-east-1"
DOMAIN_NAME="purely-srikanthcupertino1.com"

echo "=== Setting up Route 53 and ACM ==="

# Create Hosted Zone
echo "Creating Route 53 Hosted Zone..."
HOSTED_ZONE_ID=$(aws route53 create-hosted-zone \
    --name $DOMAIN_NAME \
    --caller-reference $(date +%s) \
    --query 'HostedZone.Id' \
    --output text | cut -d'/' -f3)

echo "✅ Hosted Zone created with ID: $HOSTED_ZONE_ID"

# Get Name Servers
NAME_SERVERS=$(aws route53 get-hosted-zone \
    --id $HOSTED_ZONE_ID \
    --query 'DelegationSet.NameServers' \
    --output text)

echo "Name Servers for $DOMAIN_NAME:"
echo "$NAME_SERVERS"

# Request ACM Certificate
echo "Requesting ACM Certificate..."
CERTIFICATE_ARN=$(aws acm request-certificate \
    --domain-name $DOMAIN_NAME \
    --validation-method DNS \
    --query 'CertificateArn' \
    --output text)

echo "✅ Certificate requested with ARN: $CERTIFICATE_ARN"

# Wait for certificate to be issued
echo "Waiting for certificate to be issued..."
aws acm wait certificate-issued --certificate-arn $CERTIFICATE_ARN

# Get DNS validation records
echo "Getting DNS validation records..."
DNS_VALIDATION=$(aws acm describe-certificate \
    --certificate-arn $CERTIFICATE_ARN \
    --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
    --output json)

# Create DNS validation record
echo "Creating DNS validation record..."
cat > dns-validation.json << EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": $(echo $DNS_VALIDATION | jq '.Name'),
                "Type": $(echo $DNS_VALIDATION | jq '.Type'),
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": $(echo $DNS_VALIDATION | jq '.Value')
                    }
                ]
            }
        }
    ]
}
EOF

aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file://dns-validation.json

# Create A record for ALB
echo "Creating A record for ALB..."
cat > alb-record.json << EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$DOMAIN_NAME",
                "Type": "A",
                "AliasTarget": {
                    "HostedZoneId": "Z35SXDOTRQ7X7K",
                    "DNSName": "$ALB_DNS_NAME",
                    "EvaluateTargetHealth": false
                }
            }
        }
    ]
}
EOF

aws route53 change-resource-record-sets \
    --hosted-zone-id $HOSTED_ZONE_ID \
    --change-batch file://alb-record.json

# Create HTTPS Listener
echo "Creating HTTPS Listener..."
HTTPS_LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn=$CERTIFICATE_ARN \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
    --query 'Listeners[0].ListenerArn' \
    --output text)

echo "✅ HTTPS Listener created with ARN: $HTTPS_LISTENER_ARN"

# Save Route 53 and ACM information to environment file
echo "Saving Route 53 and ACM information to aws-resources.env..."
echo "HOSTED_ZONE_ID=$HOSTED_ZONE_ID" >> aws-resources.env
echo "CERTIFICATE_ARN=$CERTIFICATE_ARN" >> aws-resources.env
echo "HTTPS_LISTENER_ARN=$HTTPS_LISTENER_ARN" >> aws-resources.env

echo "=== Route 53 and ACM setup completed successfully! ==="
echo "Your application will be accessible at: https://$DOMAIN_NAME"
echo "Note: It may take some time for DNS propagation and certificate validation." 