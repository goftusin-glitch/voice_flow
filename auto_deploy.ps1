# Voice Flow - Automated Production Deployment Script for Windows
# PowerShell Script to deploy to Hostinger VM

$ErrorActionPreference = "Continue"

# Configuration
$VM_IP = "72.61.244.159"
$VM_USER = "root"
$VM_PASSWORD = "Eagles@121295"
$REPO_URL = "https://github.com/goftusin-glitch/voice_flow.git"

Write-Host "================================" -ForegroundColor Blue
Write-Host "Voice Flow Production Deployment" -ForegroundColor Blue
Write-Host "================================" -ForegroundColor Blue
Write-Host ""

# Function to execute SSH command
function Invoke-SSHCommand {
    param(
        [string]$Command,
        [string]$Description
    )

    Write-Host ">>> $Description" -ForegroundColor Yellow

    # Use plink (PuTTY) or ssh
    $sshCommand = "echo $VM_PASSWORD | ssh -o StrictHostKeyChecking=no ${VM_USER}@${VM_IP} '$Command'"

    try {
        Invoke-Expression $sshCommand
        Write-Host "[OK] $Description completed" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] $Description failed: $_" -ForegroundColor Red
    }

    Write-Host ""
}

# Prompt for API Key
Write-Host "IMPORTANT: Please have ready:" -ForegroundColor Cyan
Write-Host "  1. OpenAI API Key" -ForegroundColor White
Write-Host "  2. Email credentials (Gmail app password)" -ForegroundColor White
Write-Host ""

$OPENAI_KEY = Read-Host "Enter your OpenAI API Key (or press Enter to configure later)"
$EMAIL_USER = Read-Host "Enter your email address (or press Enter to skip)"
$EMAIL_PASS = Read-Host "Enter your email app password (or press Enter to skip)" -AsSecureString

# Convert secure string to plain text
if ($EMAIL_PASS) {
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($EMAIL_PASS)
    $EMAIL_PASS_PLAIN = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
} else {
    $EMAIL_PASS_PLAIN = ""
}

Write-Host ""
Write-Host "Starting deployment..." -ForegroundColor Green
Write-Host ""

# Create deployment script
$DeploymentScript = @"
#!/bin/bash
set -e

echo 'Step 1: Update system'
apt update && apt upgrade -y

echo 'Step 2: Install Docker'
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

echo 'Step 3: Install Docker Compose and Git'
apt install docker-compose git -y

echo 'Step 4: Clone repository'
cd /opt
rm -rf voice_flow
git clone ${REPO_URL}
cd voice_flow

echo 'Step 5: Create environment files'
cat > .env << 'ENV_ROOT'
MYSQL_ROOT_PASSWORD=VoiceFlow_Prod_Root_2024_SecurePass!
MYSQL_PASSWORD=VoiceFlow_Prod_User_2024_SecurePass!
ENV_ROOT

SECRET_KEY=\$(openssl rand -hex 32)
JWT_SECRET_KEY=\$(openssl rand -hex 32)

cat > backend/.env << ENV_BACKEND
SECRET_KEY=\${SECRET_KEY}
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=mysql+pymysql://voiceflow:VoiceFlow_Prod_User_2024_SecurePass!@mysql:3306/voice_flow
JWT_SECRET_KEY=\${JWT_SECRET_KEY}
OPENAI_API_KEY=${OPENAI_KEY}
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=${EMAIL_USER}
MAIL_PASSWORD=${EMAIL_PASS_PLAIN}
FRONTEND_URL=https://localuae.com
ENV_BACKEND

echo 'Step 6: Create directories'
mkdir -p certbot/conf certbot/www backend/uploads/audio backend/generated/pdfs

echo 'Step 7: Configure firewall'
apt install ufw -y
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

echo 'Step 8: Create HTTP-only nginx config'
cp nginx/conf.d/voice_flow.conf nginx/conf.d/voice_flow.conf.backup

cat > nginx/conf.d/voice_flow.conf << 'NGINX_HTTP'
server {
    listen 80;
    server_name backend.localuae.com;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        proxy_pass http://backend:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGINX_HTTP

echo 'Step 9: Build and start containers'
docker-compose build --no-cache
docker-compose up -d

echo 'Step 10: Wait for services'
sleep 30

echo 'Deployment completed!'
echo ''
echo 'Container status:'
docker-compose ps

echo ''
echo '================================'
echo 'Deployment Summary'
echo '================================'
echo 'Server IP: \$(curl -s ifconfig.me)'
echo 'HTTP Access: http://localuae.com (after DNS propagates)'
echo 'Backend: http://backend.localuae.com (after DNS propagates)'
echo ''
echo 'Next steps:'
echo '1. Configure DNS A records for localuae.com and backend.localuae.com'
echo '2. Wait for DNS propagation'
echo '3. Obtain SSL certificates (see PRODUCTION_DEPLOYMENT_STEPS.md)'
echo ''
echo 'View logs: cd /opt/voice_flow && docker-compose logs -f'
echo '================================'
"@

# Save deployment script locally
$DeploymentScript | Out-File -FilePath "deploy_script.sh" -Encoding ASCII

Write-Host "Deployment script created. Uploading and executing on server..." -ForegroundColor Yellow
Write-Host ""

# Instructions for manual deployment if automated fails
Write-Host "================================" -ForegroundColor Cyan
Write-Host "MANUAL DEPLOYMENT INSTRUCTIONS" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If automated deployment doesn't work, follow these steps:" -ForegroundColor White
Write-Host ""
Write-Host "1. Open PowerShell or Git Bash and connect to server:" -ForegroundColor Yellow
Write-Host "   ssh root@72.61.244.159" -ForegroundColor White
Write-Host "   Password: Eagles@121295" -ForegroundColor White
Write-Host ""
Write-Host "2. Once connected, run this one-line command:" -ForegroundColor Yellow
Write-Host ""
Write-Host "curl -sSL https://raw.githubusercontent.com/goftusin-glitch/voice_flow/master/deploy.sh | bash" -ForegroundColor Green
Write-Host ""
Write-Host "OR copy and paste the commands from PRODUCTION_DEPLOYMENT_STEPS.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Try to execute using ssh (requires OpenSSH on Windows)
Write-Host "Attempting automated deployment via SSH..." -ForegroundColor Yellow
Write-Host ""

try {
    # Check if ssh is available
    $sshPath = Get-Command ssh -ErrorAction SilentlyContinue

    if ($sshPath) {
        Write-Host "SSH found. Uploading deployment script..." -ForegroundColor Green

        # Note: This requires ssh-keygen or password input
        Write-Host ""
        Write-Host "Please enter the server password when prompted: Eagles@121295" -ForegroundColor Yellow
        Write-Host ""

        # Upload script
        scp deploy_script.sh root@${VM_IP}:/tmp/deploy_script.sh

        # Execute script
        ssh root@${VM_IP} "chmod +x /tmp/deploy_script.sh && /tmp/deploy_script.sh"

        Write-Host ""
        Write-Host "================================" -ForegroundColor Green
        Write-Host "Deployment completed successfully!" -ForegroundColor Green
        Write-Host "================================" -ForegroundColor Green

    } else {
        Write-Host "SSH not found. Please use manual deployment instructions above." -ForegroundColor Red
    }

} catch {
    Write-Host "Automated deployment failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please use the manual deployment instructions above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Deployment script saved to: deploy_script.sh" -ForegroundColor Cyan
Write-Host "Full instructions in: PRODUCTION_DEPLOYMENT_STEPS.md" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to exit"
