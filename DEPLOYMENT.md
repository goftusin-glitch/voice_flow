# Voice Flow - Production Deployment Guide

This comprehensive guide will help you deploy the Voice Flow application with the following setup:
- **Frontend**: https://qliq.info
- **Backend API**: https://backend.qliq.info

## Prerequisites

- Server with Ubuntu/Debian (tested on Ubuntu 22.04 LTS)
- Root or sudo access
- Docker and Docker Compose installed
- Domain names configured:
  - `qliq.info` → Points to your server IP
  - `backend.qliq.info` → Points to your server IP
- MySQL password for production database
- OpenAI API key for transcription and analysis

---

## Step 1: Initial Server Setup

### 1.1 Connect to your server via SSH
```bash
ssh root@your-server-ip
# Or with a specific user:
# ssh username@your-server-ip
```

### 1.2 Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Docker and Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose -y

# Add your user to docker group (optional, to run docker without sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

### 1.4 Install Git
```bash
sudo apt install git -y
```

---

## Step 2: Clone the Repository

```bash
# Navigate to your preferred directory
cd /opt

# Clone the repository (replace with your actual repo URL)
sudo git clone <your-repository-url> voice_flow

# Change ownership to your user
sudo chown -R $USER:$USER voice_flow

# Navigate to the project directory
cd voice_flow
```

---

## Step 3: Configure Environment Variables

### 3.1 Create Docker Compose Environment File

Create a `.env` file in the project root for Docker Compose variables:

```bash
nano .env
```

Add the following content (replace with your actual passwords):

```env
# MySQL Configuration
MYSQL_ROOT_PASSWORD=your-very-strong-mysql-root-password
MYSQL_PASSWORD=your-very-strong-mysql-user-password
```

**Important**: Use strong, unique passwords for production!

### 3.2 Backend Production Configuration

The backend production environment is already configured in `backend/.env.production`. However, you need to update the `MYSQL_PASSWORD` placeholder:

```bash
nano backend/.env.production
```

Update the `DATABASE_URL` line if you changed the MySQL password:
```env
DATABASE_URL=mysql+pymysql://voiceflow:your-very-strong-mysql-user-password@mysql:3306/voice_flow
```

**Note**: All other settings are already configured for qliq.info domain.

### 3.3 Frontend Configuration

The frontend is already configured in `frontend/.env.production`:
```env
VITE_API_BASE_URL=https://backend.qliq.info/api
VITE_GOOGLE_CLIENT_ID=340882310731-lc15dar6ibgdnuaucg9bvbc0fbsnsb55.apps.googleusercontent.com
```

No changes needed unless you want to modify the Google Client ID.

---

## Step 4: Configure DNS Records

Before deployment, ensure your domains point to your server:

1. Log in to your domain registrar (e.g., GoDaddy, Namecheap, Cloudflare)
2. Add/Update A records:
   - **Name**: `@` (or root) → **Points to**: Your server IP address → **Domain**: qliq.info
   - **Name**: `backend` → **Points to**: Your server IP address → **Domain**: backend.qliq.info

3. Wait for DNS propagation (can take 5 minutes to 48 hours)

**Verify DNS propagation:**
```bash
dig qliq.info
dig backend.qliq.info

# Or use nslookup
nslookup qliq.info
nslookup backend.qliq.info
```

Both should return your server IP address.

---

## Step 5: Build and Deploy with Docker Compose

### 5.1 Build the Docker images
```bash
# Make sure you're in the project root directory
cd /opt/voice_flow

# Build all containers (this may take 5-10 minutes)
docker-compose build
```

### 5.2 Start all services
```bash
# Start all containers in detached mode
docker-compose up -d

# Check if containers are running
docker-compose ps
```

You should see:
- `voice_flow_mysql` - healthy
- `voice_flow_backend` - up
- `voice_flow_frontend` - up

### 5.3 Check logs for any errors
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

Press `Ctrl+C` to exit log viewing.

### 5.4 Wait for MySQL to be healthy
The backend will automatically run database migrations once MySQL is healthy. This might take 30-60 seconds on first startup.

---

## Step 6: Setup SSL/HTTPS with Nginx and Certbot

### 6.1 Install Nginx on the host (not in Docker)
```bash
sudo apt install nginx -y
```

### 6.2 Create Nginx configuration for qliq.info (frontend)
```bash
sudo nano /etc/nginx/sites-available/qliq.info
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name qliq.info www.qliq.info;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6.3 Create Nginx configuration for backend.qliq.info
```bash
sudo nano /etc/nginx/sites-available/backend.qliq.info
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name backend.qliq.info;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 500M;
    }
}
```

### 6.4 Enable the sites
```bash
# Create symbolic links
sudo ln -s /etc/nginx/sites-available/qliq.info /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/backend.qliq.info /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 6.5 Install Certbot for SSL certificates
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 6.6 Obtain SSL certificates
```bash
# For frontend domain
sudo certbot --nginx -d qliq.info -d www.qliq.info

# For backend domain
sudo certbot --nginx -d backend.qliq.info
```

Follow the prompts:
- Enter your email address
- Agree to Terms of Service
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

Certbot will automatically:
- Obtain SSL certificates
- Update Nginx configuration
- Set up auto-renewal

### 6.7 Verify SSL auto-renewal
```bash
sudo certbot renew --dry-run
```

---

## Step 7: Configure Firewall

```bash
# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Step 8: Verify Deployment

### 8.1 Check all Docker containers
```bash
docker-compose ps
```

All containers should show as "Up" or "healthy".

### 8.2 Test the application

1. **Frontend**: Open your browser and navigate to:
   - https://qliq.info

2. **Backend API Health**: Test the backend is accessible:
   ```bash
   curl https://backend.qliq.info/api/auth/me
   # Should return: {"message": "Token is missing", "success": false}
   # This confirms the API is accessible
   ```

3. **Register a new account**: Go to https://qliq.info/register and create your first user account.

4. **Login**: Test the login functionality at https://qliq.info/login

---

## Step 9: Post-Deployment Tasks

### 9.1 Setup Automated Backups

Create a backup script:
```bash
sudo nano /opt/backup-voice-flow.sh
```

Add the following content:
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/voice_flow"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup MySQL database
docker exec voice_flow_mysql mysqldump -u root -p'your-mysql-root-password' voice_flow > $BACKUP_DIR/db_$DATE.sql

# Backup uploaded files
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/voice_flow/backend/uploads

# Backup generated PDFs
tar -czf $BACKUP_DIR/generated_$DATE.tar.gz /opt/voice_flow/backend/generated

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Make it executable:
```bash
sudo chmod +x /opt/backup-voice-flow.sh
```

Schedule daily backups with cron:
```bash
sudo crontab -e
```

Add this line (runs daily at 2 AM):
```
0 2 * * * /opt/backup-voice-flow.sh >> /var/log/voice-flow-backup.log 2>&1
```

### 9.2 Setup Log Rotation

Create a logrotate configuration:
```bash
sudo nano /etc/logrotate.d/voice-flow
```

Add:
```
/var/log/voice-flow-backup.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
```

### 9.3 Monitor Application Health

Create a simple health check script:
```bash
sudo nano /opt/health-check-voice-flow.sh
```

Add:
```bash
#!/bin/bash
FRONTEND_URL="https://qliq.info"
BACKEND_URL="https://backend.qliq.info/api/auth/me"

# Check frontend
if curl -f -s "$FRONTEND_URL" > /dev/null; then
    echo "$(date): Frontend is UP"
else
    echo "$(date): Frontend is DOWN - restarting containers"
    cd /opt/voice_flow && docker-compose restart frontend
fi

# Check backend
if curl -f -s "$BACKEND_URL" > /dev/null; then
    echo "$(date): Backend is UP"
else
    echo "$(date): Backend is DOWN - restarting containers"
    cd /opt/voice_flow && docker-compose restart backend
fi
```

Make it executable:
```bash
sudo chmod +x /opt/health-check-voice-flow.sh
```

Schedule health checks (every 5 minutes):
```bash
sudo crontab -e
```

Add:
```
*/5 * * * * /opt/health-check-voice-flow.sh >> /var/log/voice-flow-health.log 2>&1
```

---

## Maintenance Commands

### View Logs
```bash
# All containers
docker-compose logs -f

# Specific container
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Restart Services
```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
docker-compose restart frontend
docker-compose restart mysql
```

### Stop All Services
```bash
docker-compose down
```

### Start All Services
```bash
docker-compose up -d
```

### Update Application (Deploy New Version)
```bash
# Navigate to project directory
cd /opt/voice_flow

# Pull latest code
git pull origin master  # or main

# Rebuild and restart containers
docker-compose down
docker-compose build
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Run Database Migrations
```bash
# If you make database schema changes
docker-compose exec backend flask db migrate -m "description of changes"
docker-compose exec backend flask db upgrade
```

### Access MySQL Database
```bash
# Connect to MySQL
docker-compose exec mysql mysql -u root -p
# Enter password when prompted

# Use voice_flow database
USE voice_flow;

# Show tables
SHOW TABLES;

# Example query
SELECT * FROM users;

# Exit
EXIT;
```

### Check Container Resource Usage
```bash
docker stats
```

### Remove Unused Docker Resources
```bash
# Remove unused images, containers, networks
docker system prune -a

# Remove unused volumes (be careful!)
docker volume prune
```

---

## Troubleshooting

### Issue: Frontend not loading

**Check:**
1. Is the container running?
   ```bash
   docker-compose ps frontend
   ```

2. Check frontend logs:
   ```bash
   docker-compose logs frontend
   ```

3. Is Nginx running?
   ```bash
   sudo systemctl status nginx
   ```

4. Check Nginx logs:
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

### Issue: Backend API not responding

**Check:**
1. Is backend container running?
   ```bash
   docker-compose ps backend
   ```

2. Check backend logs:
   ```bash
   docker-compose logs backend
   ```

3. Is MySQL healthy?
   ```bash
   docker-compose ps mysql
   ```

4. Test direct connection:
   ```bash
   curl http://localhost:5000/api/auth/me
   ```

### Issue: Database connection errors

**Check:**
1. MySQL container status:
   ```bash
   docker-compose ps mysql
   ```

2. MySQL logs:
   ```bash
   docker-compose logs mysql
   ```

3. Verify environment variables:
   ```bash
   cat backend/.env.production
   cat .env
   ```

4. Try connecting to MySQL:
   ```bash
   docker-compose exec mysql mysql -u voiceflow -p
   # Enter MYSQL_PASSWORD
   ```

### Issue: SSL certificate errors

**Check:**
1. Certificate files exist:
   ```bash
   sudo ls -la /etc/letsencrypt/live/qliq.info/
   sudo ls -la /etc/letsencrypt/live/backend.qliq.info/
   ```

2. Renew certificates manually:
   ```bash
   sudo certbot renew --force-renewal
   ```

3. Check Nginx configuration:
   ```bash
   sudo nginx -t
   ```

### Issue: High memory/CPU usage

**Check:**
1. Resource usage:
   ```bash
   docker stats
   ```

2. Increase container resources in `docker-compose.yml` if needed

3. Optimize database queries

### Issue: Audio upload fails

**Check:**
1. File size limit in Nginx:
   ```bash
   # Edit Nginx config
   sudo nano /etc/nginx/sites-available/backend.qliq.info
   # Ensure: client_max_body_size 500M;
   ```

2. Backend upload folder permissions:
   ```bash
   sudo chown -R 1000:1000 /opt/voice_flow/backend/uploads
   ```

3. Check backend logs:
   ```bash
   docker-compose logs backend | grep -i upload
   ```

---

## Security Best Practices

### 1. Change Default Passwords
- Use strong, unique passwords for:
  - MySQL root password
  - MySQL user password
  - SECRET_KEY in backend .env
  - JWT_SECRET_KEY in backend .env

### 2. Secure SSH Access
```bash
# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Use SSH keys instead of passwords
# Restart SSH
sudo systemctl restart sshd
```

### 3. Install Fail2Ban
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 4. Keep System Updated
```bash
# Regular updates
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

### 5. Monitor Logs Regularly
```bash
# Check for suspicious activity
sudo tail -f /var/log/auth.log
docker-compose logs -f backend | grep -i error
```

### 6. Backup Encryption
Consider encrypting backups:
```bash
# Install gpg
sudo apt install gnupg -y

# Encrypt backup
gpg -c /opt/backups/voice_flow/db_*.sql
```

---

## Performance Optimization

### 1. Enable Gzip Compression in Nginx
Already enabled in frontend nginx.conf, but verify:
```bash
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf | grep gzip
```

### 2. Setup Redis for Caching (Optional)
Add Redis to docker-compose.yml if you plan to implement caching.

### 3. Database Optimization
```bash
# Connect to MySQL
docker-compose exec mysql mysql -u root -p

# Optimize tables
USE voice_flow;
OPTIMIZE TABLE users, reports, call_analyses;
```

### 4. Monitor Performance
```bash
# Install htop
sudo apt install htop -y
htop

# Monitor Docker
docker stats
```

---

## Useful Commands Summary

| Task | Command |
|------|---------|
| View all logs | `docker-compose logs -f` |
| View specific log | `docker-compose logs -f backend` |
| Restart all services | `docker-compose restart` |
| Stop all services | `docker-compose down` |
| Start all services | `docker-compose up -d` |
| Check container status | `docker-compose ps` |
| Access MySQL | `docker-compose exec mysql mysql -u root -p` |
| Run migrations | `docker-compose exec backend flask db upgrade` |
| Update application | `git pull && docker-compose up -d --build` |
| Check Nginx status | `sudo systemctl status nginx` |
| Renew SSL | `sudo certbot renew` |
| View firewall rules | `sudo ufw status` |
| Monitor resources | `docker stats` |

---

## Support and Documentation

- **Project Documentation**: Check the README.md and CLAUDE.md files
- **Docker Documentation**: https://docs.docker.com/
- **Flask Documentation**: https://flask.palletsprojects.com/
- **React Documentation**: https://react.dev/
- **Nginx Documentation**: https://nginx.org/en/docs/

---

## Conclusion

Your Voice Flow application should now be successfully deployed at:
- **Frontend**: https://qliq.info
- **Backend API**: https://backend.qliq.info/api

If you encounter any issues, refer to the Troubleshooting section or check the logs for detailed error messages.

**Important**: Remember to:
1. ✅ Keep backups running daily
2. ✅ Monitor application health
3. ✅ Keep system and Docker images updated
4. ✅ Review logs regularly for errors
5. ✅ Maintain strong security practices

Good luck with your deployment!
