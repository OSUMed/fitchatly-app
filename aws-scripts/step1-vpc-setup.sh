#!/bin/bash
# Step 1: Set up VPC and Networking

APP_NAME="ai-chat-app"
AWS_REGION="us-east-1"

echo "=== Setting up VPC and Networking ==="

# Create VPC
echo "Creating VPC..."
VPC_ID=$(aws ec2 create-vpc \
    --cidr-block 10.0.0.0/16 \
    --tag-specifications "ResourceType=vpc,Tags=[{Key=Name,Value=${APP_NAME}-vpc}]" \
    --query 'Vpc.VpcId' \
    --output text)

if [ -z "$VPC_ID" ]; then
    echo "❌ Failed to create VPC"
    exit 1
fi

echo "✅ VPC created with ID: $VPC_ID"
echo "VPC_ID=$VPC_ID" > aws-deploy/outputs/vpc-outputs.txt

# Enable DNS hostnames
aws ec2 modify-vpc-attribute \
    --vpc-id $VPC_ID \
    --enable-dns-hostnames "{\"Value\":true}"

# Create Internet Gateway
echo "Creating Internet Gateway..."
IGW_ID=$(aws ec2 create-internet-gateway \
    --tag-specifications "ResourceType=internet-gateway,Tags=[{Key=Name,Value=${APP_NAME}-igw}]" \
    --query 'InternetGateway.InternetGatewayId' \
    --output text)

if [ -z "$IGW_ID" ]; then
    echo "❌ Failed to create Internet Gateway"
    exit 1
fi

echo "✅ Internet Gateway created with ID: $IGW_ID"
echo "IGW_ID=$IGW_ID" >> aws-deploy/outputs/vpc-outputs.txt

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway \
    --vpc-id $VPC_ID \
    --internet-gateway-id $IGW_ID

# Create Public Subnets
echo "Creating Public Subnets..."
PUBLIC_SUBNET_1_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.1.0/24 \
    --availability-zone ${AWS_REGION}a \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${APP_NAME}-public-1},{Key=Type,Value=Public}]" \
    --query 'Subnet.SubnetId' \
    --output text)

if [ -z "$PUBLIC_SUBNET_1_ID" ]; then
    echo "❌ Failed to create Public Subnet in ${AWS_REGION}a"
    exit 1
fi

echo "✅ Public Subnet created in ${AWS_REGION}a with ID: $PUBLIC_SUBNET_1_ID"
echo "PUBLIC_SUBNET_1_ID=$PUBLIC_SUBNET_1_ID" >> aws-deploy/outputs/vpc-outputs.txt

PUBLIC_SUBNET_2_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.2.0/24 \
    --availability-zone ${AWS_REGION}b \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${APP_NAME}-public-2},{Key=Type,Value=Public}]" \
    --query 'Subnet.SubnetId' \
    --output text)

if [ -z "$PUBLIC_SUBNET_2_ID" ]; then
    echo "❌ Failed to create Public Subnet in ${AWS_REGION}b"
    exit 1
fi

echo "✅ Public Subnet created in ${AWS_REGION}b with ID: $PUBLIC_SUBNET_2_ID"
echo "PUBLIC_SUBNET_2_ID=$PUBLIC_SUBNET_2_ID" >> aws-deploy/outputs/vpc-outputs.txt

# Create Private Subnets
echo "Creating Private Subnets..."
PRIVATE_SUBNET_1_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.3.0/24 \
    --availability-zone ${AWS_REGION}a \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${APP_NAME}-private-1},{Key=Type,Value=Private}]" \
    --query 'Subnet.SubnetId' \
    --output text)

if [ -z "$PRIVATE_SUBNET_1_ID" ]; then
    echo "❌ Failed to create Private Subnet in ${AWS_REGION}a"
    exit 1
fi

echo "✅ Private Subnet created in ${AWS_REGION}a with ID: $PRIVATE_SUBNET_1_ID"
echo "PRIVATE_SUBNET_1_ID=$PRIVATE_SUBNET_1_ID" >> aws-deploy/outputs/vpc-outputs.txt

PRIVATE_SUBNET_2_ID=$(aws ec2 create-subnet \
    --vpc-id $VPC_ID \
    --cidr-block 10.0.4.0/24 \
    --availability-zone ${AWS_REGION}b \
    --tag-specifications "ResourceType=subnet,Tags=[{Key=Name,Value=${APP_NAME}-private-2},{Key=Type,Value=Private}]" \
    --query 'Subnet.SubnetId' \
    --output text)

if [ -z "$PRIVATE_SUBNET_2_ID" ]; then
    echo "❌ Failed to create Private Subnet in ${AWS_REGION}b"
    exit 1
fi

echo "✅ Private Subnet created in ${AWS_REGION}b with ID: $PRIVATE_SUBNET_2_ID"
echo "PRIVATE_SUBNET_2_ID=$PRIVATE_SUBNET_2_ID" >> aws-deploy/outputs/vpc-outputs.txt

# Create Public Route Table
echo "Creating Public Route Table..."
PUBLIC_RTB_ID=$(aws ec2 create-route-table \
    --vpc-id $VPC_ID \
    --tag-specifications "ResourceType=route-table,Tags=[{Key=Name,Value=${APP_NAME}-public-rtb}]" \
    --query 'RouteTable.RouteTableId' \
    --output text)

echo "✅ Public Route Table created with ID: $PUBLIC_RTB_ID"
echo "PUBLIC_RTB_ID=$PUBLIC_RTB_ID" >> aws-deploy/outputs/vpc-outputs.txt

# Add route to Internet Gateway
echo "Adding route to Internet Gateway..."
aws ec2 create-route \
    --route-table-id $PUBLIC_RTB_ID \
    --destination-cidr-block 0.0.0.0/0 \
    --gateway-id $IGW_ID

# Associate Public Subnets with Route Table
echo "Associating Public Subnets with Route Table..."
aws ec2 associate-route-table \
    --subnet-id $PUBLIC_SUBNET_1_ID \
    --route-table-id $PUBLIC_RTB_ID

aws ec2 associate-route-table \
    --subnet-id $PUBLIC_SUBNET_2_ID \
    --route-table-id $PUBLIC_RTB_ID

# Create security group for RDS
echo "Creating RDS Security Group..."
RDS_SG_ID=$(aws ec2 create-security-group \
    --group-name ${APP_NAME}-rds-sg \
    --description "Security group for RDS instance" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

echo "✅ RDS Security Group created with ID: $RDS_SG_ID"
echo "RDS_SG_ID=$RDS_SG_ID" >> aws-deploy/outputs/vpc-outputs.txt

# Allow MySQL traffic from anywhere (for demo purposes)
aws ec2 authorize-security-group-ingress \
    --group-id $RDS_SG_ID \
    --protocol tcp \
    --port 3306 \
    --cidr 0.0.0.0/0

# Create security group for ECS tasks
echo "Creating ECS Security Group..."
ECS_SG_ID=$(aws ec2 create-security-group \
    --group-name ${APP_NAME}-ecs-sg \
    --description "Security group for ECS tasks" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

echo "✅ ECS Security Group created with ID: $ECS_SG_ID"
echo "ECS_SG_ID=$ECS_SG_ID" >> aws-deploy/outputs/vpc-outputs.txt

# Create security group for ALB
echo "Creating ALB Security Group..."
ALB_SG_ID=$(aws ec2 create-security-group \
    --group-name ${APP_NAME}-alb-sg \
    --description "Security group for Application Load Balancer" \
    --vpc-id $VPC_ID \
    --query 'GroupId' \
    --output text)

echo "✅ ALB Security Group created with ID: $ALB_SG_ID"
echo "ALB_SG_ID=$ALB_SG_ID" >> aws-deploy/outputs/vpc-outputs.txt

# Configure security group rules

# Allow HTTP traffic to ALB
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 80 \
    --cidr 0.0.0.0/0

# Allow HTTPS traffic to ALB
aws ec2 authorize-security-group-ingress \
    --group-id $ALB_SG_ID \
    --protocol tcp \
    --port 443 \
    --cidr 0.0.0.0/0

# Allow traffic from ALB to ECS tasks
aws ec2 authorize-security-group-ingress \
    --group-id $ECS_SG_ID \
    --protocol tcp \
    --port 3000 \
    --source-group $ALB_SG_ID

# Create a copy of outputs for backward compatibility
cp aws-deploy/outputs/vpc-outputs.txt aws-resources.env

echo "=== VPC setup completed successfully! ==="
echo "You can verify the setup in the AWS Console:"
echo "1. Go to VPC Dashboard"
echo "2. Check the following resources:"
echo "   - VPC: ${APP_NAME}-vpc"
echo "   - Subnets: 2 Public and 2 Private in different AZs"
echo "   - Security Groups: ${APP_NAME}-rds-sg, ${APP_NAME}-ecs-sg, and ${APP_NAME}-alb-sg"
echo "   - Route Tables" 