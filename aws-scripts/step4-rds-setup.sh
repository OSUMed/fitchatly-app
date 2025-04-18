#!/bin/bash
# Step 4: Set up RDS instance

# Source the environment variables
source aws-resources.env
APP_NAME="ai-chat-app"
AWS_REGION="us-east-1"
DB_PASSWORD="my-secret-password"
DB_NAME="aichatapp"

echo "=== Setting up RDS Instance ==="

# Clean up existing resources if they exist
echo "Cleaning up existing resources..."
aws rds delete-db-parameter-group --db-parameter-group-name ${APP_NAME}-parameter-group 2>/dev/null || true
aws rds delete-db-subnet-group --db-subnet-group-name ${APP_NAME}-subnet-group 2>/dev/null || true

# Create RDS Subnet Group
echo "Creating RDS Subnet Group..."
aws rds create-db-subnet-group \
    --db-subnet-group-name ${APP_NAME}-subnet-group \
    --db-subnet-group-description "Subnet group for ${APP_NAME} RDS instance" \
    --subnet-ids $PUBLIC_SUBNET_1_ID $PUBLIC_SUBNET_2_ID

# Create RDS Parameter Group
echo "Creating RDS Parameter Group..."
aws rds create-db-parameter-group \
    --db-parameter-group-name ${APP_NAME}-parameter-group \
    --db-parameter-group-family mysql8.0 \
    --description "Parameter group for ${APP_NAME} RDS instance"

# Create RDS Instance
echo "Creating RDS Instance..."
RDS_INSTANCE_IDENTIFIER="${APP_NAME}-db"
aws rds create-db-instance \
    --db-instance-identifier $RDS_INSTANCE_IDENTIFIER \
    --db-instance-class db.t3.micro \
    --engine mysql \
    --engine-version 8.0.35 \
    --master-username admin \
    --master-user-password $DB_PASSWORD \
    --allocated-storage 20 \
    --max-allocated-storage 100 \
    --db-name $DB_NAME \
    --vpc-security-group-ids $RDS_SG_ID \
    --db-subnet-group-name ${APP_NAME}-subnet-group \
    --publicly-accessible \
    --backup-retention-period 7 \
    --preferred-backup-window "03:00-04:00" \
    --preferred-maintenance-window "sun:04:00-sun:05:00" \
    --port 3306 \
    --storage-type gp2 \
    --no-multi-az \
    --auto-minor-version-upgrade \
    --copy-tags-to-snapshot \
    --tags Key=Name,Value=${APP_NAME}-db

echo "Waiting for RDS instance to become available..."
aws rds wait db-instance-available --db-instance-identifier $RDS_INSTANCE_IDENTIFIER

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier $RDS_INSTANCE_IDENTIFIER \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

echo "✅ RDS instance created with endpoint: $RDS_ENDPOINT"

# Save RDS information to environment file
echo "Saving RDS information to aws-resources.env..."
echo "RDS_ENDPOINT=$RDS_ENDPOINT" >> aws-resources.env
echo "RDS_INSTANCE_IDENTIFIER=$RDS_INSTANCE_IDENTIFIER" >> aws-resources.env

echo "=== RDS setup completed successfully! ===" 