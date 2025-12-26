#!/bin/bash

# Complete Production Deployment Script
# Run this script on your local machine, it will deploy to the server

set -e

VM_IP="72.61.244.159"
VM_USER="root"
VM_PASS="Eagles@121295"

echo "================================"
echo "Voice Flow Production Deployment"
echo "================================"
echo ""

# Check for required OpenAI API key
echo "Please enter your configuration:"
read -p "OpenAI API Key: " OPENAI_KEY
read -p "Email address for SMTP: " EMAIL_USER
read -sp "Email app password: " EMAIL_PASS
echo ""
echo ""

# Create the deployment script that will run on the server
cat > /tmp/server_deploy.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

echo "========================================="
echo "Starting Voice Flow Deployment"
echo "========================================="

# Update system
echo ""
echo "[1/11] Updating system..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

# Install Docker
echo "[2/11] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh > /dev/null 2>&1
    rm get-docker.sh
    echo "Docker installed successfully"
else
    echo "Docker already installed"
fi

# Install Docker Compose
echo "[3/11] Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    apt-get install docker-compose -y -qq
    echo "Docker Compose installed successfully"
else
    echo "Docker Compose already installed"
fi

# Install Git
echo "[4/11] Installing Git..."
if ! command -v git &> /dev/null; then
    apt-get install git -y -qq
fi

# Clone repository
echo "[5/11] Cloning repository..."
cd /opt
rm -rf voice_flow
git clone https://github.com/goftusin-glitch/voice_flow.git
cd voice_flow

# Create root .env
echo "[6/11] Creating environment files..."
cat > .env << 'ENV_ROOT_EOF'
MYSQL_ROOT_PASSWORD=VoiceFlow_Prod_Root_2024_SecurePass!
MYSQL_PASSWORD=VoiceFlow_Prod_User_2024_SecurePass!
ENV_ROOT_EOF

# Generate secrets
SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

# Create backend .env with placeholders
cat > backend/.env << ENV_BACKEND_EOF
SECRET_KEY=${SECRET_KEY}
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=mysql+pymysql://voiceflow:VoiceFlow_Prod_User_2024_SecurePass!@mysql:3306/voice_flow
JWT_SECRET_KEY=${JWT_SECRET_KEY}
OPENAI_API_KEY=__OPENAI_KEY_PLACEHOLDER__
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=__EMAIL_USER_PLACEHOLDER__
MAIL_PASSWORD=__EMAIL_PASS_PLACEHOLDER__
FRONTEND_URL=https://localuae.com
ENV_BACKEND_EOF

# Create directories
echo "[7/11] Creating required directories..."
mkdir -p certbot/conf certbot/www backend/uploads/audio backend/generated/pdfs

# Configure firewall
echo "[8/11] Configuring firewall..."
apt-get install ufw -y -qq
ufw --force enable > /dev/null 2>&1
ufw allow 22/tcp > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1

# Create HTTP-only nginx config
echo "[9/11] Configuring nginx..."
cp nginx/conf.d/voice_flow.conf nginx/conf.d/voice_flow.conf.backup

cat > nginx/conf.d/voice_flow.conf << 'NGINX_CONFIG_EOF'
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
NGINX_CONFIG_EOF

# Build containers
echo "[10/11] Building Docker containers (this may take 5-10 minutes)..."
docker-compose build --no-cache > /tmp/docker-build.log 2>&1 &
BUILD_PID=$!

# Show progress
while kill -0 $BUILD_PID 2>/dev/null; do
    echo -n "."
    sleep 2
done
wait $BUILD_PID
echo " Done!"

# Start services
echo "[11/11] Starting services..."
docker-compose up -d

# Wait for services
echo "Waiting for services to initialize..."
sleep 30

# Show status
echo ""
echo "========================================="
echo "Deployment Status"
echo "========================================="
docker-compose ps

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo "Server IP: $(curl -s ifconfig.me 2>/dev/null || echo '72.61.244.159')"
echo ""
echo "NEXT STEPS:"
echo "1. Update backend/.env with your API credentials:"
echo "   nano /opt/voice_flow/backend/.env"
echo ""
echo "2. Configure DNS A records to point to this server:"
echo "   - localuae.com -> $(curl -s ifconfig.me 2>/dev/null || echo '72.61.244.159')"
echo "   - backend.localuae.com -> $(curl -s ifconfig.me 2>/dev/null || echo '72.61.244.159')"
echo ""
echo "3. After DNS propagates, obtain SSL certificates:"
echo "   See /opt/voice_flow/PRODUCTION_DEPLOYMENT_STEPS.md Step 10"
echo ""
echo "Current access (HTTP only):"
echo "- http://$(curl -s ifconfig.me 2>/dev/null || echo '72.61.244.159')"
echo "- http://$(curl -s ifconfig.me 2>/dev/null || echo '72.61.244.159'):5000/api/health"
echo ""
echo "Logs: docker-compose logs -f"
echo "========================================="

DEPLOY_SCRIPT

# Now update the backend/.env with actual values on server
cat > /tmp/update_env.sh << UPDATE_ENV_EOF
#!/bin/bash
cd /opt/voice_flow
sed -i "s/__OPENAI_KEY_PLACEHOLDER__/${OPENAI_KEY}/" backend/.env
sed -i "s/__EMAIL_USER_PLACEHOLDER__/${EMAIL_USER}/" backend/.env
sed -i "s/__EMAIL_PASS_PLACEHOLDER__/${EMAIL_PASS}/" backend/.env
docker-compose restart backend
echo "Environment variables updated and backend restarted"
UPDATE_ENV_EOF

echo ""
echo "Connecting to server and deploying..."
echo "Password: $VM_PASS"
echo ""

# Upload and execute deployment script
ssh -o StrictHostKeyChecking=no ${VM_USER}@${VM_IP} 'bash -s' < /tmp/server_deploy.sh

# Update environment variables
if [ -n "$OPENAI_KEY" ]; then
    echo ""
    echo "Updating API credentials..."
    ssh -o StrictHostKeyChecking=no ${VM_USER}@${VM_IP} 'bash -s' < /tmp/update_env.sh
fi

echo ""
echo "================================================================"
echo "DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "================================================================"
echo ""
echo "Access your application:"
echo "- Frontend: http://72.61.244.159"
echo "- Backend: http://72.61.244.159:5000"
echo ""
echo "After DNS configuration:"
echo "- Frontend: http://localuae.com"
echo "- Backend: http://backend.localuae.com"
echo ""
echo "To view logs, SSH to server and run:"
echo "  ssh root@72.61.244.159"
echo "  cd /opt/voice_flow"
echo "  docker-compose logs -f"
echo "================================================================"
