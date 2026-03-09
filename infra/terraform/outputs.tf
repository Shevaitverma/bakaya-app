# -----------------------------------------------------------------------------
# Root Outputs
# -----------------------------------------------------------------------------

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.load_balancer.alb_dns_name
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance (Elastic IP)"
  value       = module.ec2.instance_public_ip
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}
