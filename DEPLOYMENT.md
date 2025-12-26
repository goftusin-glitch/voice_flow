# Voice Flow - Deployment Guide for Hostinger KPS VM

This guide will help you deploy the Voice Flow application on Hostinger KPS VM using Docker.

## Prerequisites

- Hostinger KPS VM with Ubuntu/Debian
- Root or sudo access
- Domain names configured:
  - `localuae.com` → Points to your VM IP
  - `backend.localuae.com` → Points to your VM IP

## Step 1: Initial Server Setup

### 1.1 Connect to your VM
```bash
ssh root@your-vm-ip
```

### 1.2 Update system packages
```bash
apt update && apt upgrade -y
```

### 1.3 Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

### 1.4 Install Git
```bash
apt install git -y
```

## Step 2: Clone the Repository

```bash
# Navigate to your preferred directory
cd /opt

# Clone the repository
git clone https://github.com/goftusin-glitch/voice_flow.git

# Navigate to the project directory
cd voice_flow
```

## Step 3: Configure Environment Variables

### 3.1 Backend Configuration
```bash
# Copy the production environment template
cp backend/.env.production backend/.env

# Edit the backend .env file
nano backend/.env
```

**Fill in the following values:**
```env
# Flask
SECRET_KEY=your-super-secret-key-here-min-32-chars
FLASK_ENV=production
FLASK_DEBUG=False

# Database (will connect to MySQL container)
DATABASE_URL=mysql+pymysql://voiceflow:your_mysql_password@mysql:3306/voice_flow

# JWT
JWT_SECRET_KEY=your-jwt-secret-key-here-min-32-chars

# OpenAI (REQUIRED - Get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your-openai-api-key

# Email (SMTP - Gmail example)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password

# Frontend URL
FRONTEND_URL=https://localuae.com
```

### 3.2 Create Docker Environment File
```bash
# Create .env file for docker-compose
nano .env
```

**Add:**
```env
MYSQL_ROOT_PASSWORD=your-strong-mysql-root-password
MYSQL_PASSWORD=your-strong-mysql-user-password
```

### 3.3 Frontend Configuration
The frontend is already configured for production in `.env.production`. No changes needed.

## Step 4: Configure Domains (DNS)

Before proceeding, ensure your domains are pointing to your VM:

1. Log in to your domain registrar
2. Add/Update A records:
   - `localuae.com` → Your VM IP address
   - `backend.localuae.com` → Your VM IP address

**Verify DNS propagation:**
```bash
dig localuae.com
dig backend.localuae.com
```

## Step 5: Initial Deployment (HTTP Only)

### 5.1 Modify nginx configuration temporarily
Before SSL is configured, we need to run without SSL:

```bash
# Backup the original config
cp nginx/conf.d/voice_flow.conf nginx/conf.d/voice_flow.conf.backup

# Create HTTP-only config
cat > nginx/conf.d/voice_flow.conf << 'EOF'
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
EOF
```

### 5.2 Build and start containers
```bash
# Build and start all containers
docker-compose up -d --build

# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f
```

**Wait for all containers to be healthy (especially MySQL).**

## Step 6: Obtain SSL Certificates

### 6.1 Run Certbot
```bash
# Stop nginx temporarily
docker-compose stop nginx

# Obtain certificates for both domains
docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d localuae.com \
  -d www.localuae.com

docker run -it --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  -d backend.localuae.com
```

### 6.2 Restore Full nginx configuration
```bash
# Restore the backup with SSL configuration
cp nginx/conf.d/voice_flow.conf.backup nginx/conf.d/voice_flow.conf

# Restart nginx
docker-compose start nginx
```

## Step 7: Verify Deployment

### 7.1 Check all containers
```bash
docker-compose ps
```

All containers should show as "Up" or "healthy".

### 7.2 Test the application
1. Frontend: `https://localuae.com`
2. Backend: `https://backend.localuae.com/api/health` (if health endpoint exists)

### 7.3 Create initial admin user
Access the frontend and register your first user.

## Step 8: Post-Deployment

### 8.1 Set up automatic SSL renewal
The certbot container is already configured to auto-renew. Verify with:
```bash
docker-compose logs certbot
```

### 8.2 Set up automated backups
```bash
# Create backup script
cat > /opt/backup-voice-flow.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/voice_flow"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MySQL database
docker exec voice_flow_mysql mysqldump -u root -p'your-mysql-root-password' voice_flow > $BACKUP_DIR/db_$DATE.sql

# Backup uploaded files
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/voice_flow/backend/uploads

# Keep only last 7 days of backups
find $BACKUP_DIR -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/backup-voice-flow.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
# 0 2 * * * /opt/backup-voice-flow.sh >> /var/log/voice-flow-backup.log 2>&1
```

## Maintenance Commands

### View Logs
```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
docker-compose logs -f nginx
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
```

### Update Application
```bash
# Pull latest code
cd /opt/voice_flow
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Database Migrations
```bash
# Run migrations
docker-compose exec backend flask db upgrade

# Create new migration (if needed)
docker-compose exec backend flask db migrate -m "description"
```

### Access MySQL
```bash
docker-compose exec mysql mysql -u root -p
# Enter password when prompted
# Then: USE voice_flow;
```

### Stop All Services
```bash
docker-compose down
```

### Remove Everything (Including Data)
```bash
docker-compose down -v
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend

# Check if port is already in use
netstat -tulpn | grep :5000
```

### Database connection error
```bash
# Check if MySQL is healthy
docker-compose ps mysql

# Check database logs
docker-compose logs mysql

# Verify connection string in backend/.env
```

### SSL certificate issues
```bash
# Check certificate files
ls -la certbot/conf/live/localuae.com/

# Renew manually
docker-compose run --rm certbot renew
```

### Application not accessible
```bash
# Check if nginx is running
docker-compose ps nginx

# Check nginx logs
docker-compose logs nginx

# Verify DNS
dig localuae.com
```

## Security Recommendations

1. **Change all default passwords** in `.env` files
2. **Enable firewall:**
   ```bash
   ufw allow 22    # SSH
   ufw allow 80    # HTTP
   ufw allow 443   # HTTPS
   ufw enable
   ```

3. **Set up fail2ban** for SSH protection
4. **Regular backups** - Use the backup script provided
5. **Monitor logs** regularly for suspicious activity
6. **Keep Docker images updated:**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## Support

For issues, contact support or create an issue on GitHub.

## License

[Your License Here]
