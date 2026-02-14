terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.region
}

# ─── Data Sources ─────────────────────────────────────────────────────────

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "al2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_route53_zone" "app" {
  name = join(".", slice(split(".", var.domain), length(split(".", var.domain)) - 2, length(split(".", var.domain))))
}

# ─── Secrets ──────────────────────────────────────────────────────────────

resource "random_password" "jwt_secret" {
  length  = 48
  special = true
}

resource "random_password" "postgres_password" {
  length  = 32
  special = false
}

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "/odyssey/jwt-secret"
  type  = "SecureString"
  value = random_password.jwt_secret.result
}

resource "aws_ssm_parameter" "postgres_password" {
  name  = "/odyssey/postgres-password"
  type  = "SecureString"
  value = random_password.postgres_password.result
}

# ─── VPC & Networking ─────────────────────────────────────────────────────

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "odyssey-vpc" }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "odyssey-igw" }
}

resource "aws_subnet" "public_a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = { Name = "odyssey-public-a" }
}

resource "aws_subnet" "public_b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = { Name = "odyssey-public-b" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "odyssey-public-rt" }
}

resource "aws_route_table_association" "public_a" {
  subnet_id      = aws_subnet.public_a.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_b" {
  subnet_id      = aws_subnet.public_b.id
  route_table_id = aws_route_table.public.id
}

# ─── Security Group ──────────────────────────────────────────────────────

resource "aws_security_group" "app" {
  name_prefix = "odyssey-app-"
  description = "Allow HTTP, HTTPS, and SSH from admin IP"
  vpc_id      = aws_vpc.main.id

  tags = { Name = "odyssey-app-sg" }
}

resource "aws_vpc_security_group_ingress_rule" "http" {
  security_group_id = aws_security_group.app.id
  description       = "HTTP from anywhere"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "https" {
  security_group_id = aws_security_group.app.id
  description       = "HTTPS from anywhere"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "ssh" {
  security_group_id = aws_security_group.app.id
  description       = "SSH from admin IP"
  cidr_ipv4         = var.admin_ssh_cidr
  from_port         = 22
  to_port           = 22
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "all_out" {
  security_group_id = aws_security_group.app.id
  description       = "All outbound traffic"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}

# ─── IAM Role for EC2 ────────────────────────────────────────────────────

resource "aws_iam_role" "ec2_app" {
  name = "odyssey-ec2-app"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "ssm_read" {
  name = "odyssey-ssm-read"
  role = aws_iam_role.ec2_app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ]
      Resource = [
        aws_ssm_parameter.jwt_secret.arn,
        aws_ssm_parameter.postgres_password.arn
      ]
    }]
  })
}

resource "aws_iam_role_policy" "ses_send" {
  name = "odyssey-ses-send"
  role = aws_iam_role.ec2_app.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ]
      Resource = ["*"]
      Condition = {
        StringEquals = {
          "ses:FromAddress" = "noreply@${var.domain}"
        }
      }
    }]
  })
}

resource "aws_iam_instance_profile" "ec2_app" {
  name = "odyssey-ec2-app"
  role = aws_iam_role.ec2_app.name
}

# ─── EC2 Instance ─────────────────────────────────────────────────────────

resource "aws_instance" "app" {
  ami                    = data.aws_ami.al2023.id
  instance_type          = var.instance_type
  key_name               = var.ssh_key_name
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.app.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_app.name

  metadata_options {
    http_tokens   = "required"
    http_endpoint = "enabled"
  }

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
    encrypted   = true
  }

  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    region            = var.region
    repo_url          = var.repo_url
    repo_branch       = var.repo_branch
    domain            = var.domain
    ssm_jwt_secret    = aws_ssm_parameter.jwt_secret.name
    ssm_pg_password   = aws_ssm_parameter.postgres_password.name
  }))

  tags = { Name = "odyssey-app" }
}

# ─── EBS Volume for pgdata ────────────────────────────────────────────────

resource "aws_ebs_volume" "pgdata" {
  availability_zone = data.aws_availability_zones.available.names[0]
  size              = var.ebs_size_gb
  type              = "gp3"
  encrypted         = true

  tags = { Name = "odyssey-pgdata" }
}

resource "aws_volume_attachment" "pgdata" {
  device_name = "/dev/xvdf"
  volume_id   = aws_ebs_volume.pgdata.id
  instance_id = aws_instance.app.id
}

# ─── Elastic IP ───────────────────────────────────────────────────────────

resource "aws_eip" "app" {
  instance = aws_instance.app.id
  domain   = "vpc"

  tags = { Name = "odyssey-eip" }
}

# ─── DNS ──────────────────────────────────────────────────────────────────

resource "aws_route53_record" "app" {
  zone_id = data.aws_route53_zone.app.zone_id
  name    = var.domain
  type    = "A"
  ttl     = 300
  records = [aws_eip.app.public_ip]
}

# ─── SES Domain Identity ─────────────────────────────────────────────────

resource "aws_ses_domain_identity" "app" {
  domain = var.domain
}

resource "aws_ses_domain_dkim" "app" {
  domain = aws_ses_domain_identity.app.domain
}

resource "aws_route53_record" "ses_verification" {
  zone_id = data.aws_route53_zone.app.zone_id
  name    = "_amazonses.${var.domain}"
  type    = "TXT"
  ttl     = 600
  records = [aws_ses_domain_identity.app.verification_token]
}

resource "aws_route53_record" "ses_dkim" {
  count   = 3
  zone_id = data.aws_route53_zone.app.zone_id
  name    = "${aws_ses_domain_dkim.app.dkim_tokens[count.index]}._domainkey"
  type    = "CNAME"
  ttl     = 600
  records = ["${aws_ses_domain_dkim.app.dkim_tokens[count.index]}.dkim.amazonses.com"]
}

resource "aws_ses_domain_identity_verification" "app" {
  domain     = aws_ses_domain_identity.app.id
  depends_on = [aws_route53_record.ses_verification]
}
