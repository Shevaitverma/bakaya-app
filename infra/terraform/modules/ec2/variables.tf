###############################################################################
# EC2 Module - Variables
###############################################################################

variable "project_name" {
  description = "Name of the project, used for resource naming and tagging."
  type        = string
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)."
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type."
  type        = string
  default     = "t3.small"
}

variable "subnet_id" {
  description = "ID of the subnet to launch the instance in."
  type        = string
}

variable "security_group_id" {
  description = "ID of the security group to attach to the instance."
  type        = string
}

variable "public_key" {
  description = "SSH public key material for the EC2 key pair."
  type        = string
  sensitive   = true
}

variable "root_volume_size" {
  description = "Size of the root EBS volume in GB."
  type        = number
  default     = 20
}
