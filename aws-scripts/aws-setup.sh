#!/bin/bash
# Step 0: Configure AWS CLI
aws configure set aws_access_key_id "YOUR_ACCESS_KEY"
aws configure set aws_secret_access_key "YOUR_SECRET_KEY"
aws configure set region "us-east-1"
aws configure set output "json" 