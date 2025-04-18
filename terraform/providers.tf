terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0" # Specify a compatible version range
    }
  }
}

provider "aws" {
  region = var.aws_region
} 