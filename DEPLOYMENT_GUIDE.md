# Call Analyzer Application - Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Call Analyzer Application to production.

## Deployment Options

### Option 1: AWS (Recommended for Production)
### Option 2: Heroku (Quick Deploy)
### Option 3: DigitalOcean (Cost-Effective)
### Option 4: Self-Hosted Server

---

## Option 1: AWS Deployment (Recommended)

### Architecture Overview
- **Frontend**: AWS S3 + CloudFront
- **Backend**: AWS EC2 (or ECS)
- **Database**: AWS RDS (MySQL)
- **File Storage**: AWS S3
- **Email**: SendGrid
- **Task Queue**: AWS SQS + Lambda (optional)

### Prerequisites
1. AWS Account
2. AWS CLI installed
3. Domain name (optional)
4. SendGrid account
5. OpenAI API key

### Step 1: Setup RDS Database

```bash
# Create MySQL database on RDS
aws rds create-db-instance \
  --db-instance-identifier voice-flow-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --master-username admin \
  --master-user-password YourStrongPassword123! \
  --allocated-storage 20
```

**Or via AWS Console:**
1. Go to RDS → Create database
2. Select MySQL
3. Choose Free Tier (db.t3.micro)
4. Set database name: `voice_flow`
5. Set username: `admin`
6. Set password
7. Note the endpoint URL

### Step 2: Setup S3 Buckets

```bash
# Create bucket for audio files
aws s3 mb s3://voice-flow-audio

# Create bucket for PDFs
aws s3 mb s3://voice-flow-pdfs

# Create bucket for frontend
aws s3 mb s3://voice-flow-frontend

# Set CORS for audio bucket
aws s3api put-bucket-cors \
  --bucket voice-flow-audio \
  --cors-configuration file://cors.json
```

**cors.json:**
```json
{
  "CORSRules": [{
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"]
  }]
}
```

### Step 3: Deploy Backend to EC2

**Launch EC2 Instance:**
1. EC2 → Launch Instance
2. Select Ubuntu 22.04 LTS
3. Instance type: t3.small (minimum)
4. Configure security group:
   - SSH (22) from your IP
   - HTTP (80) from anywhere
   - HTTPS (443) from anywhere
5. Create and download key pair

**Connect and Setup:**
```bash
# SSH into instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.10
sudo apt install python3.10 python3-pip python3-venv -y

# Install Nginx
sudo apt install nginx -y

# Install MySQL client
sudo apt install mysql-client -y
```

**Deploy Backend:**
```bash
# Clone repository (or upload files)
git clone your-repo-url
cd voice_flow/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install gunicorn boto3  # boto3 for S3

# Create .env file
nano .env
```

**Production .env:**
```env
FLASK_ENV=production
SECRET_KEY=<generate-strong-key>
JWT_SECRET_KEY=<generate-strong-key>

# RDS Database
DATABASE_URL=mysql+pymysql://admin:password@your-rds-endpoint/voice_flow

# OpenAI
OPENAI_API_KEY=your-openai-key

# SendGrid
SENDGRID_API_KEY=your-sendgrid-key
FROM_EMAIL=noreply@yourdomain.com

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
S3_BUCKET_AUDIO=voice-flow-audio
S3_BUCKET_PDFS=voice-flow-pdfs

# Frontend
FRONTEND_URL=https://yourdomain.com
```

**Run Database Migrations:**
```bash
flask db upgrade
```

**Setup Gunicorn Service:**
```bash
sudo nano /etc/systemd/system/voiceflow.service
```

```ini
[Unit]
Description=Voice Flow Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/voice_flow/backend
Environment="PATH=/home/ubuntu/voice_flow/backend/venv/bin"
ExecStart=/home/ubuntu/voice_flow/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 run:app

[Install]
WantedBy=multi-user.target
```

```bash
# Start service
sudo systemctl enable voiceflow
sudo systemctl start voiceflow
sudo systemctl status voiceflow
```

**Configure Nginx:**
```bash
sudo nano /etc/nginx/sites-available/voiceflow
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Increase timeout for long analyses
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Increase max upload size for audio files
    client_max_body_size 500M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/voiceflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Setup SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api.yourdomain.com
```

### Step 4: Deploy Frontend to S3 + CloudFront

**Build Frontend:**
```bash
cd voice_flow/frontend

# Update .env.production
echo "VITE_API_BASE_URL=https://api.yourdomain.com/api" > .env.production

# Build
npm run build
```

**Deploy to S3:**
```bash
# Upload build files
aws s3 sync dist/ s3://voice-flow-frontend --delete

# Configure bucket for static website hosting
aws s3 website s3://voice-flow-frontend \
  --index-document index.html \
  --error-document index.html
```

**Setup CloudFront:**
1. CloudFront → Create Distribution
2. Origin domain: `voice-flow-frontend.s3.amazonaws.com`
3. Viewer protocol policy: Redirect HTTP to HTTPS
4. Default root object: `index.html`
5. Custom error responses:
   - 403 → /index.html (200)
   - 404 → /index.html (200)
6. Add CNAME: `www.yourdomain.com`
7. Request SSL certificate via ACM

**Update DNS:**
- Point `www.yourdomain.com` to CloudFront distribution
- Point `api.yourdomain.com` to EC2 IP

---

## Option 2: Heroku Deployment (Quick Deploy)

### Prerequisites
1. Heroku account
2. Heroku CLI installed
3. Git repository

### Backend Deployment

**Create Heroku app:**
```bash
cd backend
heroku create voice-flow-api

# Add MySQL addon
heroku addons:create jawsdb:kitefin

# Set environment variables
heroku config:set SECRET_KEY=your-secret-key
heroku config:set JWT_SECRET_KEY=your-jwt-secret
heroku config:set OPENAI_API_KEY=your-openai-key
heroku config:set SENDGRID_API_KEY=your-sendgrid-key
heroku config:set FROM_EMAIL=noreply@yourdomain.com
heroku config:set FRONTEND_URL=https://your-frontend.vercel.app
```

**Create Procfile:**
```
web: gunicorn run:app
```

**Create runtime.txt:**
```
python-3.10.12
```

**Deploy:**
```bash
git push heroku main

# Run migrations
heroku run flask db upgrade
```

### Frontend Deployment (Vercel)

```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod
```

Set environment variable in Vercel:
- `VITE_API_BASE_URL`: Your Heroku API URL

---

## Option 3: DigitalOcean Deployment

### Backend on Droplet

1. Create Droplet (Ubuntu, $12/month)
2. Follow EC2 setup instructions above
3. Use DigitalOcean Managed MySQL

### Frontend on App Platform

1. Create App
2. Connect Git repository
3. Select `frontend` directory
4. Set build command: `npm run build`
5. Set output directory: `dist`
6. Set environment variables

---

## Option 4: Self-Hosted Server

### Requirements
- Linux server with public IP
- Minimum 2GB RAM, 2 CPUs
- 50GB storage
- MySQL 8.0
- Domain name pointing to server

### Setup Steps
1. Follow EC2 backend setup
2. Setup Nginx for frontend:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/voice-flow;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://127.0.0.1:5000;
        # ... proxy settings
    }
}
```

---

## Post-Deployment Configuration

### 1. Update S3 Storage Service

Update `backend/app/services/storage_service.py`:

```python
import boto3
from flask import current_app

class StorageService:
    @staticmethod
    def upload_audio(file, filename):
        s3 = boto3.client('s3')
        s3.upload_fileobj(
            file,
            current_app.config['S3_BUCKET_AUDIO'],
            filename
        )
        return f"s3://{current_app.config['S3_BUCKET_AUDIO']}/{filename}"

    @staticmethod
    def upload_pdf(file_path, filename):
        s3 = boto3.client('s3')
        s3.upload_file(
            file_path,
            current_app.config['S3_BUCKET_PDFS'],
            filename
        )
        return f"s3://{current_app.config['S3_BUCKET_PDFS']}/{filename}"
```

### 2. Setup Monitoring

**Sentry (Error Tracking):**
```bash
pip install sentry-sdk[flask]
```

```python
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FlaskIntegration()]
)
```

**CloudWatch (AWS):**
- Enable CloudWatch logs for EC2
- Setup alarms for CPU, memory, disk

### 3. Setup Backups

**Database Backups (RDS):**
```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier voice-flow-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00"
```

**S3 Versioning:**
```bash
aws s3api put-bucket-versioning \
  --bucket voice-flow-audio \
  --versioning-configuration Status=Enabled
```

### 4. Setup CI/CD (Optional)

**GitHub Actions:**

`.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_KEY }}
          script: |
            cd /home/ubuntu/voice_flow/backend
            git pull
            source venv/bin/activate
            pip install -r requirements.txt
            sudo systemctl restart voiceflow

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and Deploy
        run: |
          cd frontend
          npm install
          npm run build
          aws s3 sync dist/ s3://voice-flow-frontend
```

---

## Security Checklist

- [ ] HTTPS enabled everywhere
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] Firewall configured
- [ ] SSH key-based authentication only
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF tokens implemented
- [ ] File upload validation
- [ ] Error messages don't expose secrets

---

## Performance Optimization

### Backend
- [ ] Enable Gzip compression
- [ ] Use Redis for caching
- [ ] Implement Celery for async tasks
- [ ] Connection pooling for database
- [ ] CDN for static files

### Frontend
- [ ] Code splitting enabled
- [ ] Images optimized
- [ ] Lazy loading components
- [ ] Service worker for caching

---

## Monitoring & Maintenance

### Health Checks
```bash
# Backend health
curl https://api.yourdomain.com/api/health

# Database connectivity
mysql -h rds-endpoint -u admin -p voice_flow -e "SELECT 1"
```

### Log Monitoring
```bash
# Backend logs
sudo journalctl -u voiceflow -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Maintenance Tasks
- Weekly: Check disk space
- Weekly: Review error logs
- Monthly: Update dependencies
- Monthly: Database optimization
- Quarterly: Security audit
- Quarterly: Performance review

---

## Rollback Plan

If deployment fails:

1. **Backend Rollback:**
```bash
cd /home/ubuntu/voice_flow/backend
git reset --hard previous-commit-hash
sudo systemctl restart voiceflow
```

2. **Frontend Rollback:**
```bash
# Restore previous S3 version
aws s3 sync s3://backup-bucket s3://voice-flow-frontend
```

3. **Database Rollback:**
```bash
flask db downgrade
```

---

## Support & Troubleshooting

### Common Issues

**Backend not starting:**
- Check logs: `sudo journalctl -u voiceflow`
- Verify .env file
- Check database connection

**502 Bad Gateway:**
- Backend service down
- Nginx misconfigured
- Check: `sudo systemctl status voiceflow`

**Frontend not loading:**
- Check CloudFront distribution status
- Verify S3 bucket permissions
- Check browser console for errors

**Slow performance:**
- Check database queries
- Review server resources
- Enable caching
- Optimize images

---

## Conclusion

Follow this guide carefully for a successful deployment. Always test in a staging environment before deploying to production.

**Need Help?**
- Review application logs
- Check documentation
- Contact support team

**Good luck with your deployment!** 🚀
