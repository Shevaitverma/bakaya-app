###############################################################################
# EC2 Module - Main
###############################################################################

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# ---------------------------------------------------------------------------
# AMI Lookup - Latest Ubuntu 22.04 LTS
# ---------------------------------------------------------------------------

data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

# ---------------------------------------------------------------------------
# IAM Role & Instance Profile
# ---------------------------------------------------------------------------

resource "aws_iam_role" "ec2" {
  name = "${var.project_name}-${var.environment}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-ec2-role"
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.ec2.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "this" {
  name = "${var.project_name}-${var.environment}-ec2-profile"
  role = aws_iam_role.ec2.name

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-ec2-profile"
  })
}

# ---------------------------------------------------------------------------
# EC2 Instance
# ---------------------------------------------------------------------------

resource "aws_instance" "this" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = [var.security_group_id]
  key_name               = var.key_pair_name
  iam_instance_profile   = aws_iam_instance_profile.this.name

  root_block_device {
    volume_size           = var.root_volume_size
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true
  }

  user_data = <<-EOF
    #!/bin/bash
    set -euo pipefail

    # Update packages
    apt-get update -y
    apt-get upgrade -y

    # Install prerequisites
    apt-get install -y ca-certificates curl gnupg lsb-release

    # Add Docker GPG key
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
      | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    # Add Docker apt repository
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
      https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" \
      | tee /etc/apt/sources.list.d/docker.list > /dev/null

    # Install Docker Engine and Compose plugin
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    # Enable and start Docker
    systemctl enable docker
    systemctl start docker

    # Add ubuntu user to docker group
    usermod -aG docker ubuntu
  EOF

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-server"
  })

  lifecycle {
    ignore_changes = [ami]
  }
}

# ---------------------------------------------------------------------------
# Elastic IP
# ---------------------------------------------------------------------------

resource "aws_eip" "this" {
  instance = aws_instance.this.id
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-eip"
  })
}
