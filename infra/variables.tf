variable "domain" {
  description = "Domain name for the application (e.g. play.example.com)"
  type        = string
}

variable "admin_ssh_cidr" {
  description = "CIDR block allowed SSH access (e.g. 1.2.3.4/32)"
  type        = string
}

variable "ssh_key_name" {
  description = "Name of an existing EC2 key pair for SSH access"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3a.small"
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "ebs_size_gb" {
  description = "Size of the pgdata EBS volume in GB"
  type        = number
  default     = 20
}

variable "repo_url" {
  description = "Git clone URL for the application repository"
  type        = string
}

variable "repo_branch" {
  description = "Git branch to deploy"
  type        = string
  default     = "main"
}
