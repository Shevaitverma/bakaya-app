# -----------------------------------------------------------------------------
# Load Balancer Module - Variables
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Name of the project, used for resource naming and tagging"
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g., production, staging)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC where the target group will be created"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for the ALB (minimum 2 in different AZs)"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "Security group ID to attach to the ALB"
  type        = string
}

variable "target_instance_id" {
  description = "EC2 instance ID to register with the target group"
  type        = string
}

variable "certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS listener"
  type        = string
  default     = ""
}

variable "health_check_path" {
  description = "Path for ALB health check requests"
  type        = string
  default     = "/live"
}
