###############################################################################
# EC2 Module - Outputs
###############################################################################

output "instance_id" {
  description = "ID of the EC2 instance."
  value       = aws_instance.this.id
}

output "instance_public_ip" {
  description = "Public IP address of the instance (Elastic IP)."
  value       = aws_eip.this.public_ip
}

output "instance_private_ip" {
  description = "Private IP address of the instance."
  value       = aws_instance.this.private_ip
}
