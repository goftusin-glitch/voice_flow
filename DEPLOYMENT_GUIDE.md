# 🚀 Voice Flow - Complete Deployment Guide

## Quick Start Options

### Option 1: Docker (Easiest - 10 minutes) ⭐ RECOMMENDED
### Option 2: VPS/Cloud (45 minutes)

---

## 🐳 OPTION 1: DOCKER DEPLOYMENT (RECOMMENDED)

### Prerequisites
- ✅ Docker & Docker Compose installed
- ✅ Git
- ✅ OpenAI API Key

### Step 1: Prepare Environment

```bash
cd C:\Users\THIRU\Desktop\voice_flow

# Create .env file
cat > .env << 'EOF'
MYSQL_ROOT_PASSWORD=VoiceFlow_Root_2024!
MYSQL_PASSWORD=VoiceFlow_Prod_User_2024_SecurePass!
EOF
```

### Step 2: Update Backend Config

Edit `backend/.env.production` with your values:
```bash
SECRET_KEY=your-production-secret-key-here
FLASK_ENV=production
FLASK_DEBUG=False

DATABASE_URL=mysql+pymysql://voiceflow:VoiceFlow_Prod_User_2024_SecurePass!@mysql:3306/voice_flow

JWT_SECRET_KEY=your-jwt-secret-key-here

OPENAI_API_KEY=sk-proj-YOUR-ACTUAL-KEY-HERE

FRONTEND_URL=https://your-domain.com

MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### Step 3: Build and Deploy

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Step 4: Run Database Migration

```bash
# Access backend container
docker exec -it voice_flow_backend bash

# Run migration
mysql -h mysql -u voiceflow -pVoiceFlow_Prod_User_2024_SecurePass! voice_flow < migrations/add_input_types.sql

# Exit
exit
```

### Step 5: Test Deployment

```bash
# Backend test
curl http://localhost:5000/api/auth/me

# Frontend
# Open: http://localhost:8080
```

### Step 6: Setup Domain & SSL (Optional)

Install Nginx on host machine:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_read_timeout 300s;
    }

    client_max_body_size 500M;
}
```

---

## 🌐 OPTION 2: VPS/CLOUD DEPLOYMENT

### Step 1: Server Setup (Ubuntu 22.04)

```bash
# SSH into server
ssh root@your-server-ip

# Update system
apt update && apt upgrade -y

# Install dependencies
apt install -y python3.11 python3-pip python3-venv mysql-server nginx git nodejs npm
```

### Step 2: MySQL Setup

```bash
sudo mysql_secure_installation

sudo mysql
```

```sql
CREATE DATABASE voice_flow;
CREATE USER 'voiceflow'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON voice_flow.* TO 'voiceflow'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Clone Repository

```bash
cd /opt
git clone https://github.com/your-username/voice_flow.git
cd voice_flow
```

### Step 4: Backend Setup

```bash
cd /opt/voice_flow/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn

# Configure environment
nano .env
# Add your production settings

# Run migration
mysql -u voiceflow -p voice_flow < migrations/add_input_types.sql
flask db upgrade
```

### Step 5: Create Systemd Service

```bash
sudo nano /etc/systemd/system/voiceflow.service
```

```ini
[Unit]
Description=Voice Flow Backend
After=network.target mysql.service

[Service]
User=root
WorkingDirectory=/opt/voice_flow/backend
Environment="PATH=/opt/voice_flow/backend/venv/bin"
ExecStart=/opt/voice_flow/backend/venv/bin/gunicorn --bind 0.0.0.0:5000 --workers 4 --timeout 300 run:app
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable voiceflow
sudo systemctl start voiceflow
sudo systemctl status voiceflow
```

### Step 6: Frontend Setup

```bash
cd /opt/voice_flow/frontend

# Install dependencies
npm install

# Build
npm run build

# Copy to web root
sudo mkdir -p /var/www/voiceflow
sudo cp -r dist/* /var/www/voiceflow/
```

### Step 7: Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/voiceflow
```

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/voiceflow;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_read_timeout 300s;
    }
    
    client_max_body_size 500M;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/voiceflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: SSL Certificate

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## ✅ Post-Deployment Checklist

- [ ] Database migration completed
- [ ] All environment variables set
- [ ] OpenAI API key configured
- [ ] SSL certificate installed
- [ ] Firewall configured (ports 80, 443)
- [ ] Test all features:
  - [ ] Audio upload
  - [ ] Text input
  - [ ] Image upload
  - [ ] Report generation

---

## 🔧 Common Commands

### View Logs (Docker)
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

### View Logs (VPS)
```bash
sudo journalctl -u voiceflow -f
sudo tail -f /var/log/nginx/error.log
```

### Restart Services (Docker)
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Restart Services (VPS)
```bash
sudo systemctl restart voiceflow
sudo systemctl restart nginx
```

### Backup Database
```bash
# Docker
docker exec voice_flow_mysql mysqldump -u root -p voice_flow > backup.sql

# VPS
mysqldump -u voiceflow -p voice_flow > backup.sql
```

### Update Application
```bash
# Docker
git pull
docker-compose build
docker-compose up -d

# VPS
git pull
cd backend && source venv/bin/activate && pip install -r requirements.txt
sudo systemctl restart voiceflow
cd ../frontend && npm install && npm run build
sudo cp -r dist/* /var/www/voiceflow/
```

---

## 🔥 Quick Deploy (One Command)

### Docker
```bash
docker-compose down && docker-compose build && docker-compose up -d && docker-compose logs -f
```

### VPS
```bash
git pull && cd backend && source venv/bin/activate && sudo systemctl restart voiceflow && cd ../frontend && npm run build && sudo cp -r dist/* /var/www/voiceflow/
```

---

## 📊 Monitoring

### Health Checks
```bash
# Backend
curl http://localhost:5000/api/auth/me

# Database
mysql -u voiceflow -p -e "SHOW DATABASES;"

# Disk space
df -h

# Memory
free -m
```

---

## 🚨 Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker-compose logs backend
sudo journalctl -u voiceflow

# Check database connection
mysql -u voiceflow -p voice_flow
```

### Frontend 404
```bash
# Rebuild frontend
cd frontend
npm run build
sudo cp -r dist/* /var/www/voiceflow/

# Check Nginx config
sudo nginx -t
```

### OpenAI API Errors
```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"

# Check account: https://platform.openai.com/account/usage
```

---

## 🎉 Deployment Complete!

Your application is now live at:
- Frontend: https://your-domain.com
- Backend API: https://your-domain.com/api

Test all features and enjoy! 🚀
