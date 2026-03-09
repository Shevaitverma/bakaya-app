variable "project_name" {
  description = "Name of the project, used for resource naming and tagging"
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC where security groups will be created"
  type        = string
}

variable "ssh_allowed_cidrs" {
  description = "List of CIDR blocks allowed to SSH into EC2 instances"
  type        = list(string)
  default     = []
}
