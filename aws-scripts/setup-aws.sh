#!/bin/bash
# Master script to set up AWS infrastructure

# Exit on error
set -e

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo "=== AWS Infrastructure Setup ==="

echo "Step 0: Configuring AWS CLI"
$SCRIPT_DIR/step0-aws-cli-setup.sh

echo "Step 1: Setting up VPC and Networking"
$SCRIPT_DIR/step1-vpc-setup.sh

echo "Step 2: Setting up RDS"
$SCRIPT_DIR/step2-rds-setup.sh

echo "Step 3: Setting up ECR and pushing Docker image"
$SCRIPT_DIR/step3-ecr-setup.sh

echo "Step 4: Setting up ECS"
$SCRIPT_DIR/step4-ecs-setup.sh

echo "Step 5: Setting up Route 53 and ACM"
$SCRIPT_DIR/step5-route53-setup.sh

echo "Step 6: Setting up Secrets Manager"
$SCRIPT_DIR/step6-secrets-setup.sh

echo "=== AWS infrastructure setup completed successfully! ==="
echo "Your application will be available at: http://purely-srikanthcupertino1" 