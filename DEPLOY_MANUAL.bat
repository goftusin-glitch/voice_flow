@echo off
REM Voice Flow Manual Deployment Script
REM Run this from your local Windows machine

setlocal enabledelayedexpansion

echo ================================================
echo Voice Flow Production Deployment
echo ================================================
echo.

echo Connecting to server: root@72.61.244.159
echo Password: Eagles@121295
echo.

echo STEP 1: Connecting to server and running deployment...
echo.

REM Create the deployment script
echo Creating deployment commands...

REM Open SSH connection and run commands
ssh root@72.61.244.159

REM If SSH opens successfully, paste these commands:
echo.
echo ================================================
echo PASTE THESE COMMANDS IN THE SSH SESSION:
echo ================================================
echo.
type << 'COMMANDS'

cd /opt
rm -rf voice_flow
git clone https://github.com/goftusin-glitch/voice_flow.git
cd voice_flow

cat > .env << 'ENV_EOF'
MYSQL_ROOT_PASSWORD=VoiceFlow_Prod_Root_2024_SecurePass!
MYSQL_PASSWORD=VoiceFlow_Prod_User_2024_SecurePass!
ENV_EOF

SECRET_KEY=$(openssl rand -hex 32)
JWT_SECRET_KEY=$(openssl rand -hex 32)

cat > backend/.env << ENV_BACKEND
SECRET_KEY=${SECRET_KEY}
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=mysql+pymysql://voiceflow:VoiceFlow_Prod_User_2024_SecurePass!@mysql:3306/voice_flow
JWT_SECRET_KEY=${JWT_SECRET_KEY}
OPENAI_API_KEY=REPLACE_WITH_YOUR_KEY
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
FRONTEND_URL=https://localuae.com
ENV_BACKEND

mkdir -p certbot/conf certbot/www backend/uploads/audio backend/generated/pdfs

ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

cp nginx/conf.d/voice_flow.conf nginx/conf.d/voice_flow.conf.backup

cat > nginx/conf.d/voice_flow.conf << 'NGINX_EOF'
server {
    listen 80;
    server_name backend.localuae.com;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
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
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_EOF

echo "Building Docker containers (5-10 minutes)..."
docker-compose build --no-cache
docker-compose up -d

echo "Waiting for services to start..."
sleep 30

echo "Deployment complete!"
docker-compose ps

COMMANDS

pause
