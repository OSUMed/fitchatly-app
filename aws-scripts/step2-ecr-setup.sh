#!/bin/bash
# Step 2: Set up ECR and push Docker image

# Source the environment variables
source aws-resources.env
APP_NAME="ai-chat-app"
AWS_REGION="us-east-1"

echo "=== Setting up ECR Repository and Pushing Docker Image ==="

# Create ECR repository
echo "Creating ECR repository..."
aws ecr create-repository \
    --repository-name ${APP_NAME} \
    --image-scanning-configuration scanOnPush=true \
    --region $AWS_REGION

# Get ECR repository URI
ECR_REPOSITORY_URI=$(aws ecr describe-repositories \
    --repository-names ${APP_NAME} \
    --query 'repositories[0].repositoryUri' \
    --output text \
    --region $AWS_REGION)

echo "✅ ECR repository created with URI: $ECR_REPOSITORY_URI"

# Authenticate Docker to ECR
echo "Authenticating Docker to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URI

# Build Docker image
echo "Building Docker image..."
docker build -t ${APP_NAME} .

# Tag the image
echo "Tagging Docker image..."
docker tag ${APP_NAME}:latest ${ECR_REPOSITORY_URI}:latest

# Push the image to ECR
echo "Pushing Docker image to ECR..."
docker push ${ECR_REPOSITORY_URI}:latest

# Save ECR information to environment file
echo "Saving ECR information to aws-resources.env..."
echo "ECR_REPOSITORY_URI=$ECR_REPOSITORY_URI" >> aws-resources.env

echo "=== ECR setup completed successfully! ===" 