# Bakaya — Terraform Infrastructure

Provisions the AWS infrastructure for the Bakaya application: VPC, security groups, EC2 instance (with Docker), and an Application Load Balancer with SSL termination.

## Architecture

```
Internet
   │
   ▼
ALB (HTTPS:443, HTTP:80 → redirect)
   │
   ▼
EC2 Instance (Ubuntu 22.04, Docker)
   ├── nginx       (reverse proxy, port 80)
   ├── bakaya-web  (Next.js,      127.0.0.1:3000)
   └── bakaya-server (Bun API,    127.0.0.1:8080)
```

## Modules

| Module | Description |
|--------|-------------|
| `vpc` | VPC, 2 public subnets across AZs, internet gateway, route table |
| `security-group` | ALB SG (80/443 inbound) and EC2 SG (80 from ALB only, SSH conditional) |
| `ec2` | Ubuntu instance with Docker pre-installed, EIP, IAM role with SSM access |
| `load-balancer` | ALB, target group, HTTPS listener (TLS 1.3), HTTP→HTTPS redirect |

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.5
- AWS CLI configured with credentials (`aws configure`)
- An SSH key pair for EC2 access:
  ```bash
  ssh-keygen -t ed25519 -f ~/.ssh/bakaya-ec2
  ```
- An ACM certificate for your domain (provision via AWS Console or CLI)

## Quick Start

```bash
cd infra/terraform

# 1. Create your variables file
cp terraform.tfvars.example terraform.tfvars

# 2. Fill in your values (SSH key, certificate ARN, etc.)
#    editor terraform.tfvars

# 3. Initialize Terraform
terraform init

# 4. Preview changes
terraform plan

# 5. Provision infrastructure
terraform apply
```

## Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `aws_region` | AWS region | `us-east-1` |
| `project_name` | Project name for naming/tagging | `bakaya` |
| `environment` | Deployment environment | `production` |
| `ssh_public_key` | SSH public key content **(required)** | — |
| `ssh_allowed_cidrs` | CIDRs allowed to SSH into EC2 | `[]` |
| `instance_type` | EC2 instance type | `t3.small` |
| `certificate_arn` | ACM certificate ARN for HTTPS | `""` |
| `domain_name` | Application domain name | `""` |
| `vpc_cidr` | VPC CIDR block | `10.0.0.0/16` |

## Outputs

| Output | Description |
|--------|-------------|
| `alb_dns_name` | ALB DNS name — point your domain CNAME here |
| `instance_public_ip` | EC2 Elastic IP — whitelist this in MongoDB Atlas |
| `vpc_id` | VPC ID |

## Remote State (Optional)

To enable S3 remote state with DynamoDB locking, create the resources first:

```bash
aws s3api create-bucket --bucket bakaya-terraform-state --region us-east-1
aws s3api put-bucket-versioning --bucket bakaya-terraform-state --versioning-configuration Status=Enabled
aws dynamodb create-table \
  --table-name bakaya-terraform-lock \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

Then uncomment the `backend "s3"` block in `provider.tf` and run `terraform init`.

## Instance Sizing

| Workload | Type | vCPU | RAM | ~Monthly Cost |
|----------|------|------|-----|---------------|
| Dev/Staging | `t3.micro` | 2 | 1 GB | ~$8 |
| Small Prod | `t3.small` | 2 | 2 GB | ~$15 |
| Medium Prod | `t3.medium` | 2 | 4 GB | ~$30 |

## After Provisioning

1. Note the `instance_public_ip` and `alb_dns_name` from the Terraform output
2. Point your domain CNAME to the `alb_dns_name`
3. Whitelist `instance_public_ip` in MongoDB Atlas
4. Deploy the application using Ansible (see `infra/ansible/`)

## Destroying Infrastructure

```bash
terraform destroy
```
