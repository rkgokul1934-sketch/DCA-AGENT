#!/bin/bash
set -e

echo "=== Extracting files ==="
mkdir -p ~/dca-agent
tar -xzf ~/dca_agent_deploy.tar.gz -C ~/dca-agent

echo "=== Creating .env file ==="
cat << 'EOF' > ~/dca-agent/.env
# App Config
PROJECT_NAME="Demo Booking Platform"
API_V1_STR="/api/v1"
SECRET_KEY="your-super-secret-key-for-jwt"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=11520  # 8 days

# Database Config (PostgreSQL in Docker)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/booking_db

# Services config override for Docker networking
REDIS_HOST=redis
REDIS_PORT=6379
MONGODB_URL=mongodb://mongodb:27017
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# AI & Bedrock Config
BEDROCK_API_URL=https://bedrock-mantle.us-east-1.api.aws/v1/chat/completions
BEDROCK_API_KEY=your_bedrock_api_key_here
BEDROCK_MODEL=minimax.minimax-m2.5

SERPAPI_API_KEY=your_serpapi_api_key_here

# Email / SMTP Configuration
SMTP_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your_gmail@gmail.com
SMTP_PASSWORD=your_app_password_here
EOF

echo "=== Environment Setup Complete ==="
