#!/bin/bash

echo "=== VPC Cleanup Script ==="

# Get the VPC ID from the environment file if it exists
if [ -f "aws-resources.env" ]; then
    source aws-resources.env
    echo "Using VPC ID from aws-resources.env: $VPC_ID"
else
    # If no environment file, get all non-default VPCs
    VPC_IDS=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=false" --query 'Vpcs[*].VpcId' --output text)
    if [ -z "$VPC_IDS" ]; then
        echo "No non-default VPCs found."
        exit 0
    fi
    VPC_ID=$VPC_IDS
    echo "Using VPC ID: $VPC_ID"
fi

echo "Starting cleanup for VPC: $VPC_ID"

# 1. Delete security groups (except default)
echo "Step 1: Deleting security groups..."
for sg_id in $(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=!default" --query 'SecurityGroups[*].GroupId' --output text); do
    echo "  Deleting security group: $sg_id"
    aws ec2 delete-security-group --group-id $sg_id || true
done

# 2. Delete subnets
echo "Step 2: Deleting subnets..."
for subnet_id in $(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].SubnetId' --output text); do
    echo "  Deleting subnet: $subnet_id"
    aws ec2 delete-subnet --subnet-id $subnet_id || true
done

# 3. Delete route tables (except main)
echo "Step 3: Deleting route tables..."
for rt_id in $(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" "Name=association.main,Values=false" --query 'RouteTables[*].RouteTableId' --output text); do
    echo "  Deleting route table: $rt_id"
    aws ec2 delete-route-table --route-table-id $rt_id || true
done

# 4. Detach and delete internet gateway
echo "Step 4: Detaching and deleting internet gateway..."
IGW_ID=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query 'InternetGateways[0].InternetGatewayId' --output text)
if [ ! -z "$IGW_ID" ] && [ "$IGW_ID" != "None" ]; then
    echo "  Detaching internet gateway: $IGW_ID"
    aws ec2 detach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID || true
    echo "  Deleting internet gateway: $IGW_ID"
    aws ec2 delete-internet-gateway --internet-gateway-id $IGW_ID || true
fi

# 5. Delete VPC
echo "Step 5: Deleting VPC..."
aws ec2 delete-vpc --vpc-id $VPC_ID || true

echo "=== Cleanup completed ===" 