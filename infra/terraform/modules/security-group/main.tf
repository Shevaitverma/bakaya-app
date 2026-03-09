################################################################################
# ALB Security Group
################################################################################

resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-alb-sg"
  description = "Security group for the Application Load Balancer"
  vpc_id      = var.vpc_id

  tags = {
    Name        = "${var.project_name}-${var.environment}-alb-sg"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_security_group_rule" "alb_ingress_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow HTTPS inbound"
  security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "alb_ingress_http" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow HTTP inbound for redirect"
  security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "alb_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
  security_group_id = aws_security_group.alb.id
}

################################################################################
# EC2 Security Group
################################################################################

resource "aws_security_group" "ec2" {
  name        = "${var.project_name}-${var.environment}-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = var.vpc_id

  tags = {
    Name        = "${var.project_name}-${var.environment}-ec2-sg"
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_security_group_rule" "ec2_ingress_http_from_alb" {
  type                     = "ingress"
  from_port                = 80
  to_port                  = 80
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  description              = "Allow HTTP inbound from ALB only"
  security_group_id        = aws_security_group.ec2.id
}

resource "aws_security_group_rule" "ec2_ingress_ssh" {
  count = length(var.ssh_allowed_cidrs) > 0 ? 1 : 0

  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = var.ssh_allowed_cidrs
  description       = "Allow SSH inbound from allowed CIDRs"
  security_group_id = aws_security_group.ec2.id
}

resource "aws_security_group_rule" "ec2_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow all outbound traffic"
  security_group_id = aws_security_group.ec2.id
}
