#!/bin/bash
# Step 0: Configure AWS CLI

echo "=== Configuring AWS CLI ==="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    echo "For macOS, you can install it using: brew install awscli"
    exit 1
fi

# Prompt for AWS credentials
read -p "Enter your AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -p "Enter your AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
read -p "Enter your AWS Region (default: us-east-1): " AWS_REGION
AWS_REGION=${AWS_REGION:-us-east-1}

# Configure AWS CLI
aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID"
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY"
aws configure set region "$AWS_REGION"
aws configure set output json

# Verify configuration
echo "Verifying AWS configuration..."
aws sts get-caller-identity

if [ $? -eq 0 ]; then
    echo "✅ AWS CLI configured successfully!"
    echo "Region: $AWS_REGION"
else
    echo "❌ Failed to configure AWS CLI. Please check your credentials."
    exit 1
fi

# Create output directory for AWS resources
mkdir -p aws-deploy/outputs

echo "=== AWS CLI configuration completed! ===" 