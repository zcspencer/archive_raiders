output "public_ip" {
  description = "Elastic IP address of the EC2 instance"
  value       = aws_eip.app.public_ip
}

output "domain" {
  description = "Application domain name"
  value       = var.domain
}

output "app_url" {
  description = "Full application URL"
  value       = "https://${var.domain}"
}

output "admin_url" {
  description = "Admin dashboard URL"
  value       = "https://${var.domain}/admin"
}

output "ses_dkim_tokens" {
  description = "DKIM tokens for SES domain verification (add as CNAME records if not using Route53)"
  value       = aws_ses_domain_dkim.app.dkim_tokens
}

output "ssh_command" {
  description = "SSH command to connect to the instance"
  value       = "ssh -i ~/.ssh/${var.ssh_key_name}.pem ec2-user@${aws_eip.app.public_ip}"
}
