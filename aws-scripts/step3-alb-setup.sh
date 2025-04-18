#!/bin/bash
# Step 3: Set up Application Load Balancer

# Source the environment variables
source aws-resources.env
APP_NAME="ai-chat-app"
AWS_REGION="us-east-1"

echo "=== Setting up Application Load Balancer ==="

# Create Target Group
echo "Creating Target Group..."
TARGET_GROUP_ARN=$(aws elbv2 create-target-group \
    --name ${APP_NAME}-tg \
    --protocol HTTP \
    --port 3000 \
    --vpc-id $VPC_ID \
    --target-type ip \
    --health-check-path /api/health \
    --health-check-interval-seconds 30 \
    --health-check-timeout-seconds 5 \
    --healthy-threshold-count 2 \
    --unhealthy-threshold-count 3 \
    --query 'TargetGroups[0].TargetGroupArn' \
    --output text)

echo "✅ Target Group created with ARN: $TARGET_GROUP_ARN"

# Create Application Load Balancer
echo "Creating Application Load Balancer..."
ALB_ARN=$(aws elbv2 create-load-balancer \
    --name ${APP_NAME}-alb \
    --subnets $PUBLIC_SUBNET_1_ID $PUBLIC_SUBNET_2_ID \
    --security-groups $ALB_SG_ID \
    --scheme internet-facing \
    --type application \
    --query 'LoadBalancers[0].LoadBalancerArn' \
    --output text)

echo "✅ Application Load Balancer created with ARN: $ALB_ARN"

# Create HTTP Listener
echo "Creating HTTP Listener..."
HTTP_LISTENER_ARN=$(aws elbv2 create-listener \
    --load-balancer-arn $ALB_ARN \
    --protocol HTTP \
    --port 80 \
    --default-actions Type=forward,TargetGroupArn=$TARGET_GROUP_ARN \
    --query 'Listeners[0].ListenerArn' \
    --output text)

echo "✅ HTTP Listener created with ARN: $HTTP_LISTENER_ARN"

# Get ALB DNS name
ALB_DNS_NAME=$(aws elbv2 describe-load-balancers \
    --load-balancer-arns $ALB_ARN \
    --query 'LoadBalancers[0].DNSName' \
    --output text)

# Save ALB information to environment file
echo "Saving ALB information to aws-resources.env..."
echo "TARGET_GROUP_ARN=$TARGET_GROUP_ARN" >> aws-resources.env
echo "ALB_ARN=$ALB_ARN" >> aws-resources.env
echo "HTTP_LISTENER_ARN=$HTTP_LISTENER_ARN" >> aws-resources.env
echo "ALB_DNS_NAME=$ALB_DNS_NAME" >> aws-resources.env

echo "=== ALB setup completed successfully! ==="
echo "Your application will be accessible at: http://$ALB_DNS_NAME"
echo "Note: It may take a few minutes for the DNS to propagate." 