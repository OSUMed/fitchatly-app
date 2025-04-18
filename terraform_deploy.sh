#!/bin/bash
# Deployment script for the AI Chat App using Terraform and Docker

# Exit immediately if a command exits with a non-zero status.
set -e

# --- Configuration ---
AWS_REGION="us-east-1"
TERRAFORM_DIR="./terraform"
IMAGE_NAME="ai-chat-app" # Local Docker image name

# --- Terraform Deployment ---
echo "🚀 Starting Terraform deployment..."

cd "$TERRAFORM_DIR"

echo "   -> Initializing Terraform..."
terraform init -upgrade # Use -upgrade to update providers/modules if needed

echo "   -> Applying Terraform configuration (this might take several minutes)..."
# Using -auto-approve for automation. Remove if you want to review the plan first.
terraform apply -auto-approve

echo "   -> Fetching ECR repository URL..."
# Use -raw to get the plain string output
ECR_REPOSITORY_URL=$(terraform output -raw ecr_repository_url)

if [ -z "$ECR_REPOSITORY_URL" ]; then
  echo "❌ Error: Could not retrieve ECR Repository URL from Terraform output."
  exit 1
fi
echo "   -> ECR Repository URL: $ECR_REPOSITORY_URL"

# --- Need to define DOMAIN_NAME here to use it in the output message ---
# Assuming it's the same as the one in terraform/variables.tf
DOMAIN_NAME="fitchatly.com"

# Go back to the project root
cd ..

# --- Docker Image Build & Push ---
echo "🐳 Building and pushing Docker image to ECR..."

echo "   -> Logging in to AWS ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPOSITORY_URL

echo "   -> Building Docker image ($IMAGE_NAME:latest)..."
docker build --platform=linux/amd64 -t $IMAGE_NAME .

echo "   -> Tagging image for ECR..."
docker tag ${IMAGE_NAME}:latest ${ECR_REPOSITORY_URL}:latest

echo "   -> Pushing image to ECR (${ECR_REPOSITORY_URL}:latest)..."
docker push ${ECR_REPOSITORY_URL}:latest

echo "✅ Docker image pushed successfully!"

# --- Final Information & Manual Steps ---
echo "🎉 Deployment infrastructure created and image pushed!"

# Get final outputs from Terraform again
cd "$TERRAFORM_DIR"
APP_URL=$(terraform output -raw application_url)
NAME_SERVERS=$(terraform output route53_zone_name_servers) # Get formatted list

cd .. # Go back to root for script exit

echo ""
echo "--------------------------------------------------"
echo " Application URL: $APP_URL"
echo "--------------------------------------------------"
echo ""
echo "🚨 MANUAL ACTION REQUIRED 🚨"
echo "You MUST update the Name Servers (NS) for your domain '$DOMAIN_NAME' at your registrar."
echo "Use the following Name Servers provided by AWS Route 53:"
echo ""
echo "$NAME_SERVERS"
echo ""
echo "It may take some time for DNS changes to propagate after updating the Name Servers."
echo "--------------------------------------------------"

echo "✅ Deployment script finished." 