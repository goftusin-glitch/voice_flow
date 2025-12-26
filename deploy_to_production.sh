#!/bin/bash

# Voice Flow Production Deployment Script
# Target: Hostinger KPS VM (72.61.244.159)

set -e  # Exit on error

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Voice Flow Production Deployment${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# VM Details
VM_IP="72.61.244.159"
VM_USER="root"
REPO_URL="https://github.com/goftusin-glitch/voice_flow.git"

echo -e "${GREEN}Connecting to VM: ${VM_IP}${NC}"
echo ""

# Create deployment script on VM
cat << 'DEPLOYMENT_SCRIPT' | ssh ${VM_USER}@${VM_IP} 'bash -s'

set -e

echo "================================"
echo "Step 1: System Update"
echo "================================"
apt update && apt upgrade -y

echo ""
echo "================================"
echo "Step 2: Install Dependencies"
echo "================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker already installed"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    apt install docker-compose -y
else
    echo "Docker Compose already installed"
fi

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo "Installing Git..."
    apt install git -y
else
    echo "Git already installed"
fi

echo ""
echo "================================"
echo "Step 3: Clone Repository"
echo "================================"

# Navigate to /opt directory
cd /opt

# Remove old directory if exists
if [ -d "voice_flow" ]; then
    echo "Removing old voice_flow directory..."
    rm -rf voice_flow
fi

# Clone repository
echo "Cloning repository from GitHub..."
git clone https://github.com/goftusin-glitch/voice_flow.git
cd voice_flow

echo ""
echo "================================"
echo "Step 4: Environment Configuration"
echo "================================"

# Root .env file
echo "Creating root .env file..."
cat > .env << 'ENV_EOF'
# MySQL Credentials
MYSQL_ROOT_PASSWORD=VoiceFlow_Prod_Root_2024_SecurePass!
MYSQL_PASSWORD=VoiceFlow_Prod_User_2024_SecurePass!
ENV_EOF

# Backend .env file
echo "Creating backend/.env file..."
cd backend

# Generate secret keys
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)
JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)

cat > .env << ENV_BACKEND_EOF
# Flask
SECRET_KEY=${SECRET_KEY}
FLASK_ENV=production
FLASK_DEBUG=False

# Database
DATABASE_URL=mysql+pymysql://voiceflow:VoiceFlow_Prod_User_2024_SecurePass!@mysql:3306/voice_flow

# JWT
JWT_SECRET_KEY=${JWT_SECRET_KEY}

# OpenAI - REPLACE WITH YOUR ACTUAL KEY
OPENAI_API_KEY=sk-your-openai-api-key-here

# Email (SMTP - Gmail example)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password

# Frontend URL
FRONTEND_URL=https://localuae.com
ENV_BACKEND_EOF

cd /opt/voice_flow

echo ""
echo "================================"
echo "Step 5: Create Required Directories"
echo "================================"

mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p backend/uploads/audio
mkdir -p backend/generated/pdfs

echo ""
echo "================================"
echo "Step 6: Configure Firewall"
echo "================================"

# Install UFW if not present
if ! command -v ufw &> /dev/null; then
    apt install ufw -y
fi

# Configure firewall
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw status

echo ""
echo "================================"
echo "Step 7: Initial Deployment (HTTP)"
echo "================================"

# Create temporary HTTP-only nginx config
cp nginx/conf.d/voice_flow.conf nginx/conf.d/voice_flow.conf.backup

cat > nginx/conf.d/voice_flow.conf << 'NGINX_HTTP_EOF'
# Backend API - backend.localuae.com
server {
    listen 80;
    server_name backend.localuae.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://backend:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 500M;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}

# Frontend - localuae.com
server {
    listen 80;
    server_name localuae.com www.localuae.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_HTTP_EOF

echo ""
echo "Building and starting containers..."
docker-compose build --no-cache
docker-compose up -d

echo ""
echo "Waiting for services to start..."
sleep 20

echo ""
echo "================================"
echo "Deployment Status"
echo "================================"
docker-compose ps

echo ""
echo "================================"
echo "IMPORTANT NEXT STEPS"
echo "================================"
echo "1. Edit backend/.env and add your OPENAI_API_KEY"
echo "2. Edit backend/.env and add your email credentials"
echo "3. Verify DNS is pointing to this server:"
echo "   - localuae.com -> $(curl -s ifconfig.me)"
echo "   - backend.localuae.com -> $(curl -s ifconfig.me)"
echo "4. Once DNS is configured, obtain SSL certificates:"
echo "   - Follow DEPLOYMENT.md Section 6"
echo ""
echo "Access your application:"
echo "Frontend: http://localuae.com (or http://$(curl -s ifconfig.me))"
echo "Backend:  http://backend.localuae.com (or http://$(curl -s ifconfig.me):5000)"
echo ""
echo "View logs: cd /opt/voice_flow && docker-compose logs -f"
echo "================================"

DEPLOYMENT_SCRIPT

echo ""
echo -e "${GREEN}Deployment script executed!${NC}"
echo ""
