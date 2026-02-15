#!/bin/bash
set -euo pipefail
exec > /var/log/user-data.log 2>&1

echo "=== Odyssey bootstrap starting ==="

REGION="${region}"
REPO_URL="${repo_url}"
REPO_BRANCH="${repo_branch}"
DOMAIN="${domain}"
SSM_JWT_SECRET="${ssm_jwt_secret}"
SSM_PG_PASSWORD="${ssm_pg_password}"

# ─── Install Docker ───────────────────────────────────────────────────────

dnf install -y docker git
systemctl enable docker
systemctl start docker

# Install docker compose plugin and buildx
mkdir -p /usr/local/lib/docker/cli-plugins

COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
curl -SL "https://github.com/docker/compose/releases/download/$${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

BUILDX_VERSION=$(curl -s https://api.github.com/repos/docker/buildx/releases/latest | grep '"tag_name"' | cut -d'"' -f4)
curl -SL "https://github.com/docker/buildx/releases/download/$${BUILDX_VERSION}/buildx-$${BUILDX_VERSION}.linux-amd64" \
  -o /usr/local/lib/docker/cli-plugins/docker-buildx
chmod +x /usr/local/lib/docker/cli-plugins/docker-buildx

# ─── Format and mount EBS volume ─────────────────────────────────────────

DEVICE="/dev/xvdf"

# Wait for the EBS volume to be attached
for i in $(seq 1 30); do
  [ -b "$DEVICE" ] && break
  echo "Waiting for EBS volume ($i/30)..."
  sleep 5
done

if [ ! -b "$DEVICE" ]; then
  echo "ERROR: EBS volume $DEVICE not found after 150s"
  exit 1
fi

# Only format if the volume has no filesystem
if ! blkid "$DEVICE"; then
  mkfs.ext4 "$DEVICE"
fi

mkdir -p /mnt/pgdata
mount "$DEVICE" /mnt/pgdata

# Add fstab entry for persistence across reboots
if ! grep -q '/mnt/pgdata' /etc/fstab; then
  echo "$DEVICE /mnt/pgdata ext4 defaults,nofail 0 2" >> /etc/fstab
fi

# Ensure postgres container can write to the volume
chown 70:70 /mnt/pgdata

# ─── Clone repository ────────────────────────────────────────────────────

APP_DIR="/opt/app"
if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git checkout "$REPO_BRANCH"
  git reset --hard "origin/$REPO_BRANCH"
else
  git clone --branch "$REPO_BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# ─── Fetch secrets from SSM Parameter Store ───────────────────────────────

JWT_SECRET=$(aws ssm get-parameter \
  --region "$REGION" \
  --name "$SSM_JWT_SECRET" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text)

POSTGRES_PASSWORD=$(aws ssm get-parameter \
  --region "$REGION" \
  --name "$SSM_PG_PASSWORD" \
  --with-decryption \
  --query 'Parameter.Value' \
  --output text)

# ─── Generate .env file ──────────────────────────────────────────────────

cat > "$APP_DIR/.env" <<ENVEOF
DOMAIN=$DOMAIN
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
JWT_SECRET=$JWT_SECRET
AWS_REGION=$REGION
SES_FROM_EMAIL=noreply@$DOMAIN
ENVEOF

chmod 600 "$APP_DIR/.env"

# ─── Start application ───────────────────────────────────────────────────

cd "$APP_DIR"
docker compose -f docker-compose.prod.yml up -d --build

echo "=== Odyssey bootstrap complete ==="
