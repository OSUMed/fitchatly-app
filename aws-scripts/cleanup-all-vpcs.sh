#!/bin/bash

echo "=== Cleaning up all non-default VPCs ==="

# Get all non-default VPC IDs
VPC_IDS=$(aws ec2 describe-vpcs --filters "Name=is-default,Values=false" --query 'Vpcs[*].VpcId' --output text)

for VPC_ID in $VPC_IDS; do
    echo "Cleaning up VPC: $VPC_ID"

    # Delete security groups (except default)
    echo "Deleting security groups..."
    aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=!default" --query 'SecurityGroups[*].GroupId' --output text | while read sg_id; do
        echo "Deleting security group: $sg_id"
        aws ec2 delete-security-group --group-id $sg_id
    done

    # Delete all route table associations (including main)
    echo "Deleting route table associations..."
    for rt_id in $(aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[*].RouteTableId' --output text); do
        for assoc_id in $(aws ec2 describe-route-tables --route-table-id $rt_id --query 'RouteTables[*].Associations[*].RouteTableAssociationId' --output text); do
            echo "Disassociating route table: $assoc_id"
            aws ec2 disassociate-route-table --association-id $assoc_id || true
        done
    done

    # Delete route tables (except main)
    echo "Deleting route tables..."
    aws ec2 describe-route-tables --filters "Name=vpc-id,Values=$VPC_ID" "Name=association.main,Values=false" --query 'RouteTables[*].RouteTableId' --output text | while read rt_id; do
        echo "Deleting route table: $rt_id"
        aws ec2 delete-route-table --route-table-id $rt_id || true
    done

    # Delete subnets
    echo "Deleting subnets..."
    for subnet_id in $(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[*].SubnetId' --output text); do
        echo "Deleting subnet: $subnet_id"
        aws ec2 delete-subnet --subnet-id $subnet_id || true
    done

    # Delete network interfaces
    echo "Deleting network interfaces..."
    for eni_id in $(aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$VPC_ID" --query 'NetworkInterfaces[*].NetworkInterfaceId' --output text); do
        echo "Deleting network interface: $eni_id"
        aws ec2 delete-network-interface --network-interface-id $eni_id || true
    done

    # Delete NAT Gateways
    echo "Deleting NAT Gateways..."
    for nat_id in $(aws ec2 describe-nat-gateways --filter "Name=vpc-id,Values=$VPC_ID" --query 'NatGateways[*].NatGatewayId' --output text); do
        echo "Deleting NAT Gateway: $nat_id"
        aws ec2 delete-nat-gateway --nat-gateway-id $nat_id || true
    done

    # Delete VPC Endpoints
    echo "Deleting VPC Endpoints..."
    for endpoint_id in $(aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=$VPC_ID" --query 'VpcEndpoints[*].VpcEndpointId' --output text); do
        echo "Deleting VPC Endpoint: $endpoint_id"
        aws ec2 delete-vpc-endpoints --vpc-endpoint-ids $endpoint_id || true
    done

    # Detach and delete internet gateway
    echo "Detaching and deleting internet gateway..."
    IGW_ID=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query 'InternetGateways[0].InternetGatewayId' --output text)
    if [ ! -z "$IGW_ID" ] && [ "$IGW_ID" != "None" ]; then
        echo "Detaching internet gateway: $IGW_ID"
        aws ec2 detach-internet-gateway --internet-gateway-id $IGW_ID --vpc-id $VPC_ID || true
        echo "Deleting internet gateway: $IGW_ID"
        aws ec2 delete-internet-gateway --internet-gateway-id $IGW_ID || true
    fi

    # Delete VPC
    echo "Deleting VPC: $VPC_ID"
    aws ec2 delete-vpc --vpc-id $VPC_ID || true
done

echo "=== VPC cleanup completed ===" 