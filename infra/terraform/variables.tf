# -----------------------------------------------------------------------------
# Root Variables
# -----------------------------------------------------------------------------

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
}

variable "project_name" {
  description = "Name of the project, used for resource naming and tagging"
  type        = string
  default     = "bakaya"
}

variable "environment" {
  description = "Deployment environment (e.g., production, staging)"
  type        = string
  default     = "production"
}

variable "key_pair_name" {
  description = "Name of an existing AWS key pair for EC2 SSH access"
  type        = string
}

variable "ssh_allowed_cidrs" {
  description = "List of CIDR blocks allowed to SSH into the EC2 instance"
  type        = list(string)
  default     = []
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS on the ALB"
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for the application (e.g., bakaya.example.com)"
  type        = string
  default     = ""
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}
