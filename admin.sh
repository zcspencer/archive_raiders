#!/usr/bin/env bash
# Local administration script for Archive Raiders / Odyssey.
# Usage: ./admin.sh <command> [args...]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# --- Docker ---

cmd_docker_up() {
  docker compose up -d --build
}

cmd_docker_down() {
  docker compose down
}

cmd_docker_client() {
  docker compose up -d --build client
}

cmd_docker_admin() {
  docker compose up -d --build admin
}

cmd_docker_logs() {
  docker compose logs -f "${1:-}"
}

# --- Databases ---

cmd_psql() {
  docker compose exec postgres psql -U odyssey -d odyssey_dev "$@"
}

cmd_redis_cli() {
  docker compose exec redis redis-cli "$@"
}

# --- AWS SES ---

cmd_ses_verify() {
  local email="${1:?Usage: $0 ses-verify <email-address>}"
  aws ses verify-email-identity --email-address "$email" --region us-west-2
}

# --- Production SSH ---

cmd_prod_ssh() {
  ssh -i ~/.ssh/odyssey-deploy.pem ec2-user@44.239.182.72 "$@"
}

# --- Quality / Dev ---

cmd_quality() {
  pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm content:validate
}

cmd_dev() {
  pnpm dev
}

# --- Help ---

cmd_help() {
  cat <<'EOF'
admin.sh - Local administration commands

Usage: ./admin.sh <command> [args...]

Docker:
  docker:up         Build and start all services (postgres, redis, server, client, admin)
  docker:down       Stop all services
  docker:client     Build and start client only (requires server running)
  docker:admin      Build and start admin only (requires server running)
  docker:logs [svc] Follow logs (optional service name)

Databases:
  psql [args...]    Open Postgres console (odyssey/odyssey_dev)
  redis [args...]   Open Redis CLI

AWS:
  ses-verify EMAIL  Run aws ses verify-email-identity for EMAIL (region us-west-2)

Production:
  prod-ssh [cmd]    SSH to prod EC2 (odyssey-deploy.pem)

Dev:
  quality           Run typecheck, lint, test, build, content:validate
  dev               Run pnpm dev (local dev servers)
EOF
}

# --- Dispatch ---

case "${1:-help}" in
  docker:up)      cmd_docker_up ;;
  docker:down)    cmd_docker_down ;;
  docker:client)  cmd_docker_client ;;
  docker:admin)   cmd_docker_admin ;;
  docker:logs)    shift; cmd_docker_logs "$@" ;;
  psql)           shift; cmd_psql "$@" ;;
  redis)          shift; cmd_redis_cli "$@" ;;
  ses-verify)     shift; cmd_ses_verify "$@" ;;
  prod-ssh)       shift; cmd_prod_ssh "$@" ;;
  quality)        cmd_quality ;;
  dev)            cmd_dev ;;
  help|--help|-h) cmd_help ;;
  *)              echo "Unknown command: $1"; cmd_help; exit 1 ;;
esac
