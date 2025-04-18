#!/bin/bash
# Step 5: Set up ECS Cluster and Service

# Source the environment variables
source aws-resources.env
APP_NAME="ai-chat-app"
AWS_REGION="us-east-1"

echo "=== Setting up ECS Cluster and Service ==="

# Create ECS Cluster
echo "Creating ECS Cluster..."
aws ecs create-cluster \
    --cluster-name ${APP_NAME}-cluster \
    --capacity-providers FARGATE \
    --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1

# Create Task Execution Role
echo "Creating Task Execution Role..."
aws iam create-role \
    --role-name ${APP_NAME}-task-execution-role \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }'

# Attach Task Execution Role Policy
aws iam attach-role-policy \
    --role-name ${APP_NAME}-task-execution-role \
    --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Get Task Execution Role ARN
TASK_EXECUTION_ROLE_ARN=$(aws iam get-role \
    --role-name ${APP_NAME}-task-execution-role \
    --query 'Role.Arn' \
    --output text)

# Create Task Role
echo "Creating Task Role..."
aws iam create-role \
    --role-name ${APP_NAME}-task-role \
    --assume-role-policy-document '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "Service": "ecs-tasks.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
            }
        ]
    }'

# Get Task Role ARN
TASK_ROLE_ARN=$(aws iam get-role \
    --role-name ${APP_NAME}-task-role \
    --query 'Role.Arn' \
    --output text)

# Create Task Definition
echo "Creating Task Definition..."
cat > task-definition.json << EOF
{
    "family": "${APP_NAME}",
    "networkMode": "awsvpc",
    "requiresCompatibilities": ["FARGATE"],
    "cpu": "256",
    "memory": "512",
    "executionRoleArn": "${TASK_EXECUTION_ROLE_ARN}",
    "taskRoleArn": "${TASK_ROLE_ARN}",
    "containerDefinitions": [
        {
            "name": "${APP_NAME}",
            "image": "${ECR_REPOSITORY_URI}:latest",
            "essential": true,
            "portMappings": [
                {
                    "containerPort": 3000,
                    "hostPort": 3000,
                    "protocol": "tcp"
                }
            ],
            "environment": [
                {
                    "name": "DATABASE_URL",
                    "value": "mysql://admin:my-secret-password@${RDS_ENDPOINT}:3306/${APP_NAME}"
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": "/ecs/${APP_NAME}",
                    "awslogs-region": "${AWS_REGION}",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "healthCheck": {
                "command": ["CMD-SHELL", "curl -f http://$(hostname -i):3000/api/health || exit 1"],
                "interval": 30,
                "timeout": 5,
                "retries": 3,
                "startPeriod": 60
            }
        }
    ]
}
EOF

aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create CloudWatch Log Group
echo "Creating CloudWatch Log Group..."
aws logs create-log-group --log-group-name "/ecs/${APP_NAME}"

# Create ECS Service
echo "Creating ECS Service..."
aws ecs create-service \
    --cluster ${APP_NAME}-cluster \
    --service-name ${APP_NAME}-service \
    --task-definition ${APP_NAME}:1 \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[${PUBLIC_SUBNET_1_ID},${PUBLIC_SUBNET_2_ID}],securityGroups=[${ECS_SG_ID}],assignPublicIp=ENABLED}" \
    --load-balancers targetGroupArn=${TARGET_GROUP_ARN},containerName=${APP_NAME},containerPort=3000

echo "=== ECS setup completed successfully! ===" 