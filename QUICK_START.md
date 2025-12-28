# Quick Start Deployment Guide for qliq.info

This guide will help you quickly deploy the Voice Flow application on your server.

## Prerequisites

- Server with Docker and Docker Compose installed
- DNS records configured:
  - `qliq.info` → Your server IP
  - `backend.qliq.info` → Your server IP

## Step-by-Step Deployment

### 1. SSH into Your Server

```bash
ssh root@your-server-ip
```

### 2. Navigate to Project Directory

```bash
cd /opt/voice_flow
```

### 3. Pull Latest Changes

```bash
git pull origin master
```

### 4. Create Environment Files

#### Create Docker Compose .env file:

```bash
nano .env
```

Add:
```env
MYSQL_ROOT_PASSWORD=YourStrongPasswordHere123!
MYSQL_PASSWORD=YourStrongPasswordHere123!
```

#### Create Backend Production .env:

```bash
cp backend/.env.example backend/.env.production
nano backend/.env.production
```

Update these values:
- `SECRET_KEY` - Generate a strong random key
- `JWT_SECRET_KEY` - Generate a strong random key
- `OPENAI_API_KEY` - Your OpenAI API key
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret
- `MAIL_USERNAME` - Your email
- `MAIL_PASSWORD` - Your email app password

### 5. Stop Old Containers (if any)

```bash
docker-compose down
```

### 6. Build and Start Containers

```bash
chmod +x deploy.sh
./deploy.sh
```

OR manually:

```bash
docker-compose build --no-cache
docker-compose up -d
```

### 7. Check Container Status

```bash
docker-compose ps
```

All containers should show as "Up" or "healthy".

### 8. View Logs

```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f backend
docker-compose logs -f frontend
```

### 9. Setup Nginx Reverse Proxy

#### Install Nginx:

```bash
sudo apt install nginx -y
```

#### Copy Nginx Configurations:

```bash
# Frontend configuration
sudo cp nginx-config/qliq.info.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/qliq.info.conf /etc/nginx/sites-enabled/

# Backend configuration
sudo cp nginx-config/backend.qliq.info.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/backend.qliq.info.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 10. Setup SSL Certificates

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL for frontend
sudo certbot --nginx -d qliq.info -d www.qliq.info

# Get SSL for backend
sudo certbot --nginx -d backend.qliq.info
```

### 11. Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 12. Verify Deployment

1. Frontend: Open https://qliq.info in your browser
2. Backend: Test with `curl https://backend.qliq.info/api/auth/me`
3. Register a new user and test login

## Port Mapping

- **Frontend Container**: Internal 80 → Host 8080 → Nginx Proxy → Port 80/443
- **Backend Container**: Internal 5000 → Host 5000 → Nginx Proxy → Port 80/443
- **MySQL**: Internal 3306 (not exposed to host)

## Troubleshooting

### Port 80 Already in Use

If you get "address already in use" error:

```bash
# Check what's using port 80
sudo lsof -i :80

# Stop nginx if running
sudo systemctl stop nginx

# Then try deployment again
./deploy.sh
```

### Container Won't Start

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check if MySQL is healthy
docker-compose ps mysql
```

### Database Connection Error

```bash
# Verify environment variables
cat backend/.env.production | grep DATABASE_URL

# Check MySQL logs
docker-compose logs mysql
```

### Frontend Build Fails

```bash
# Check if build args are passed correctly
docker-compose config

# Rebuild without cache
docker-compose build --no-cache frontend
```

## Useful Commands

```bash
# Restart services
docker-compose restart

# Stop all services
docker-compose down

# View resource usage
docker stats

# Access MySQL
docker-compose exec mysql mysql -u root -p

# Run database migrations
docker-compose exec backend flask db upgrade

# Update application
git pull && ./deploy.sh
```

## Need Help?

See the full DEPLOYMENT.md guide for more detailed information and advanced configuration.
