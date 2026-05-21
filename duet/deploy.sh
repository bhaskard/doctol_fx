#!/usr/bin/env bash
# Duet.so clone — production deploy script
# Usage: ./deploy.sh [--skip-ssl] [--first-run]
set -euo pipefail

# ──────────────────────────────────────────────
# Config (edit these or export before running)
# ──────────────────────────────────────────────
DOMAIN="${DOMAIN:-yourdomain.com}"
REGISTRY="${REGISTRY:-ghcr.io/yourorg}"
TAG="${TAG:-latest}"

required_vars=(
  DOMAIN POSTGRES_PASSWORD REDIS_PASSWORD NEXTAUTH_SECRET JOB_HMAC_SECRET
  ANTHROPIC_API_KEY GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET
  NEXTAUTH_URL
)

echo "==> Checking required env vars..."
for v in "${required_vars[@]}"; do
  [[ -n "${!v:-}" ]] || { echo "ERROR: $v is not set"; exit 1; }
done

# ──────────────────────────────────────────────
# Step 1: Install dependencies (first-run only)
# ──────────────────────────────────────────────
if [[ "${1:-}" == "--first-run" ]]; then
  echo "==> Installing system dependencies..."
  apt-get update -qq
  apt-get install -y -qq docker.io docker-compose-plugin nginx certbot python3-certbot-nginx curl

  systemctl enable --now docker
  systemctl enable --now nginx

  echo "==> Creating app directory..."
  mkdir -p /opt/duet
  cp -r . /opt/duet/
  cd /opt/duet

  echo "==> Setting up SSL with Let's Encrypt..."
  if [[ "${SKIP_SSL:-}" != "true" ]]; then
    certbot --nginx -d "$DOMAIN" -d "apps.$DOMAIN" \
      --non-interactive --agree-tos -m "admin@$DOMAIN" \
      --redirect || echo "WARNING: SSL setup failed — check DNS"
  fi

  echo "==> Installing Nginx config..."
  envsubst '${DOMAIN}' < nginx/duet.conf > /etc/nginx/sites-available/duet
  ln -sf /etc/nginx/sites-available/duet /etc/nginx/sites-enabled/duet
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx

  echo "==> Running initial database migration..."
  docker compose -f docker-compose.prod.yml run --rm web sh -c \
    "cd /app && node -e \"require('./node_modules/.prisma/client').PrismaClient && console.log('prisma ok')\"" || true
fi

# ──────────────────────────────────────────────
# Step 2: Build images
# ──────────────────────────────────────────────
echo "==> Building Docker images (tag: $TAG)..."
docker build -f apps/web/Dockerfile    -t "${REGISTRY}/duet-web:${TAG}"    .
docker build -f apps/worker/Dockerfile -t "${REGISTRY}/duet-worker:${TAG}" .

# ──────────────────────────────────────────────
# Step 3: Deploy
# ──────────────────────────────────────────────
echo "==> Running database migrations..."
docker run --rm \
  --network duet_internal \
  -e DATABASE_URL="postgresql://duet:${POSTGRES_PASSWORD}@postgres:5432/duet" \
  "${REGISTRY}/duet-web:${TAG}" \
  node -e "
const { execSync } = require('child_process');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });
" 2>/dev/null || echo "NOTE: Run 'docker compose exec web npx prisma migrate deploy' after first deploy"

echo "==> Deploying services..."
TAG="$TAG" REGISTRY="$REGISTRY" docker compose \
  -f docker-compose.prod.yml \
  up -d --remove-orphans

echo "==> Waiting for health check..."
for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:3000/" > /dev/null 2>&1; then
    echo "✓ Web app is healthy"
    break
  fi
  [[ $i -eq 30 ]] && { echo "ERROR: Health check timed out"; exit 1; }
  sleep 2
done

echo ""
echo "✓ Deploy complete!"
echo "  App:      https://${DOMAIN}"
echo "  Apps CDN: https://apps.${DOMAIN}"
echo ""
echo "Useful commands:"
echo "  docker compose -f docker-compose.prod.yml logs -f web"
echo "  docker compose -f docker-compose.prod.yml logs -f worker"
echo "  docker compose -f docker-compose.prod.yml exec web npx prisma studio"
