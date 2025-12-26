# Production Deployment to Hostinger VM - Step by Step

## Server Details
- **IP:** 72.61.244.159
- **User:** root
- **Password:** Eagles@121295
- **Domain Frontend:** localuae.com
- **Domain Backend:** backend.localuae.com

---

## Quick Deploy (Copy-Paste Commands)

### Step 1: Connect to Server

Open your terminal (PowerShell or Git Bash) and connect:

```bash
ssh root@72.61.244.159
# Password: Eagles@121295
```

---

### Step 2: Update System & Install Docker

Once connected, run these commands:

```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose git -y

# Verify installations
docker --version
docker-compose --version
git --version
```

---

### Step 3: Clone Repository

```bash
# Navigate to /opt
cd /opt

# Remove old directory if exists
rm -rf voice_flow

# Clone repository
git clone https://github.com/goftusin-glitch/voice_flow.git

# Navigate to project
cd voice_flow
```

---

### Step 4: Configure Environment Variables

#### Create Root .env File

```bash
cat > .env << 'EOF'
MYSQL_ROOT_PASSWORD=VoiceFlow_Prod_Root_2024_SecurePass!
MYSQL_PASSWORD=VoiceFlow_Prod_User_2024_SecurePass!
EOF
```

#### Create Backend .env File

```bash
# Generate secret keys
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)
JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || openssl rand -hex 32)

# Create backend/.env
cat > backend/.env << EOF
# Flask
SECRET_KEY=${SECRET_KEY}
FLASK_ENV=production
FLASK_DEBUG=False

# Database
DATABASE_URL=mysql+pymysql://voiceflow:VoiceFlow_Prod_User_2024_SecurePass!@mysql:3306/voice_flow

# JWT
JWT_SECRET_KEY=${JWT_SECRET_KEY}

# OpenAI - ADD YOUR KEY HERE
OPENAI_API_KEY=sk-your-openai-api-key-here

# Email (SMTP - Gmail example)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password

# Frontend URL
FRONTEND_URL=https://localuae.com
EOF
```

#### Edit backend/.env to Add Your API Keys

```bash
nano backend/.env
```

**Replace these values:**
- `OPENAI_API_KEY` - Your OpenAI API key
- `MAIL_USERNAME` - Your email address
- `MAIL_PASSWORD` - Your email app password

Press `Ctrl+X`, then `Y`, then `Enter` to save.

---

### Step 5: Create Required Directories

```bash
mkdir -p certbot/conf
mkdir -p certbot/www
mkdir -p backend/uploads/audio
mkdir -p backend/generated/pdfs
```

---

### Step 6: Configure Firewall

```bash
# Install UFW
apt install ufw -y

# Configure firewall
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS

# Check status
ufw status
```

---

### Step 7: Configure DNS (Do This Before Continuing)

**IMPORTANT:** Before deploying, ensure your DNS is configured:

1. Go to your domain registrar (where you registered localuae.com)
2. Add these A records:
   - `localuae.com` → `72.61.244.159`
   - `www.localuae.com` → `72.61.244.159`
   - `backend.localuae.com` → `72.61.244.159`

3. Verify DNS propagation:
```bash
# Check DNS
dig localuae.com
dig backend.localuae.com
```

Wait for DNS to propagate (can take 5-60 minutes).

---

### Step 8: Initial Deployment (HTTP Only - For SSL Setup)

#### Create HTTP-only nginx config

```bash
# Backup original config
cp nginx/conf.d/voice_flow.conf nginx/conf.d/voice_flow.conf.backup

# Create HTTP-only config
cat > nginx/conf.d/voice_flow.conf << 'EOF'
# Backend API
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

# Frontend
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
EOF
```

#### Build and Start Containers

```bash
# Build containers (this will take 5-10 minutes)
docker-compose build --no-cache

# Start all services
docker-compose up -d

# Wait for services to start
sleep 30

# Check status
docker-compose ps
```

---

### Step 9: Verify HTTP Deployment

```bash
# Check container logs
docker-compose logs -f

# Press Ctrl+C to exit logs

# Test locally
curl -I http://localhost
```

**Test in browser:**
- http://72.61.244.159 (Should show frontend)
- http://72.61.244.159:5000 (Should show backend response)

Once DNS propagates:
- http://localuae.com
- http://backend.localuae.com

---

### Step 10: Obtain SSL Certificates

**ONLY do this after DNS is working!**

```bash
# Stop nginx temporarily
docker-compose stop nginx

# Obtain certificate for frontend
docker run -it --rm \
  -v /opt/voice_flow/certbot/conf:/etc/letsencrypt \
  -v /opt/voice_flow/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d localuae.com \
  -d www.localuae.com

# Obtain certificate for backend
docker run -it --rm \
  -v /opt/voice_flow/certbot/conf:/etc/letsencrypt \
  -v /opt/voice_flow/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d backend.localuae.com
```

---

### Step 11: Enable HTTPS

```bash
# Restore full nginx config with SSL
cp nginx/conf.d/voice_flow.conf.backup nginx/conf.d/voice_flow.conf

# Restart nginx
docker-compose start nginx

# Restart all services
docker-compose restart
```

---

### Step 12: Verify HTTPS Deployment

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

**Test in browser:**
- https://localuae.com
- https://backend.localuae.com

---

## Post-Deployment

### Create First User

1. Go to https://localuae.com
2. Click "Register"
3. Create your admin account

### Set Up Automatic Backups

```bash
# Create backup script
cat > /opt/backup-voice-flow.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/voice_flow"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec voice_flow_mysql mysqldump -u root -p'VoiceFlow_Prod_Root_2024_SecurePass!' voice_flow > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/voice_flow/backend/uploads

# Keep only last 7 days
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/backup-voice-flow.sh

# Test backup
/opt/backup-voice-flow.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/backup-voice-flow.sh >> /var/log/voice-flow-backup.log 2>&1") | crontab -
```

---

## Useful Commands

### View Logs
```bash
cd /opt/voice_flow

# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart Services
```bash
docker-compose restart
docker-compose restart backend
```

### Update Application
```bash
cd /opt/voice_flow
git pull origin master
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Database Access
```bash
docker-compose exec mysql mysql -u root -p
# Password: VoiceFlow_Prod_Root_2024_SecurePass!
```

### Stop Everything
```bash
docker-compose down
```

---

## Troubleshooting

### Containers Won't Start
```bash
docker-compose logs
docker-compose ps
```

### Database Connection Error
```bash
docker-compose logs mysql
docker-compose logs backend
```

### SSL Certificate Issues
```bash
ls -la certbot/conf/live/
docker-compose logs nginx
```

### Check Disk Space
```bash
df -h
docker system df
```

---

## Security Checklist

- [x] Firewall configured (ports 22, 80, 443)
- [ ] OpenAI API key configured
- [ ] Email credentials configured
- [ ] SSL certificates obtained
- [ ] First admin user created
- [ ] Automatic backups configured
- [ ] DNS properly configured

---

## Support

For issues, check:
- Container logs: `docker-compose logs -f`
- System logs: `journalctl -xe`
- Disk space: `df -h`
- Memory: `free -h`

---

**Deployment completed! 🚀**

Your Voice Flow application should now be running on:
- https://localuae.com
- https://backend.localuae.com
