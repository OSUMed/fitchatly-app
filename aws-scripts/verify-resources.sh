#!/bin/bash
# Script to verify AWS resources

# Source the environment variables
source aws-resources.env

echo "=== AWS Resources in us-east-1 ==="
echo

# VPC Information
echo "VPC:"
aws ec2 describe-vpcs --vpc-ids $VPC_ID --query 'Vpcs[0].[VpcId,CidrBlock,State]' --output text | while read vpc_id cidr state; do
    echo "ID: $vpc_id"
    echo "CIDR: $cidr"
    echo "State: $state"
done
echo

# Subnets Information
echo "Subnets:"
echo "Public Subnets:"
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Type,Values=Public" --query 'Subnets[*].[SubnetId,CidrBlock,AvailabilityZone,MapPublicIpOnLaunch]' --output text | while read subnet_id cidr az public; do
    echo "ID: $subnet_id"
    echo "CIDR: $cidr"
    echo "AZ: $az"
    echo "Public IP: $public"
    echo
done

echo "Private Subnets:"
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Type,Values=Private" --query 'Subnets[*].[SubnetId,CidrBlock,AvailabilityZone,MapPublicIpOnLaunch]' --output text | while read subnet_id cidr az public; do
    echo "ID: $subnet_id"
    echo "CIDR: $cidr"
    echo "AZ: $az"
    echo "Public IP: $public"
    echo
done

# Security Groups
echo "Security Groups:"
aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[*].[GroupId,GroupName,Description]' --output text | while read group_id name desc; do
    echo "ID: $group_id"
    echo "Name: $name"
    echo "Description: $desc"
    echo
done

# Internet Gateway
echo "Internet Gateway:"
aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query 'InternetGateways[0].[InternetGatewayId,Attachments[0].State]' --output text | while read igw_id state; do
    echo "ID: $igw_id"
    echo "State: $state"
done
echo

# Route Tables
echo "Route Tables:"
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[*].[RouteTableId,Associations[*].SubnetId]' --output text | while read rt_id subnet_ids; do
    echo "ID: $rt_id"
    echo "Associated Subnets: $subnet_ids"
    echo
done 