# -----------------------------------------------------------------------------
# Terraform Configuration and AWS Provider
# -----------------------------------------------------------------------------

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment the backend block below to enable remote state storage in S3.
  # Create the S3 bucket and DynamoDB table before enabling this.
  #
  # backend "s3" {
  #   bucket         = "bakaya-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "bakaya-terraform-lock"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
