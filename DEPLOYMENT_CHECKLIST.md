# Voice Flow - Deployment Checklist

## ✅ Pre-Deployment Verification

All deployment files have been created and verified! Here's what's ready:

### 📦 Docker Configuration
- ✅ `docker-compose.yml` - Main orchestration file
- ✅ `backend/Dockerfile` - Backend container build
- ✅ `frontend/Dockerfile` - Frontend container build (multi-stage)
- ✅ `.env` - MySQL credentials for docker-compose

### 🌐 Nginx Configuration
- ✅ `nginx/nginx.conf` - Main nginx configuration
- ✅ `nginx/conf.d/voice_flow.conf` - Site-specific config with SSL
- ✅ `frontend/nginx.conf` - Frontend container nginx config

### 🔐 Environment Files
- ✅ `backend/.env.production` - Backend production config template
- ✅ `frontend/.env.production` - Frontend production config
- ✅ `.gitignore` - Properly configured to exclude secrets

---

## 🚀 Deployment Steps

### Option 1: Local Deployment (Testing)

#### Step 1: Update Environment Variables
```bash
# 1. Update root .env with strong MySQL passwords
nano .env

# 2. Update backend/.env.production with your API keys
cp backend/.env.production backend/.env
nano backend/.env
# Fill in:
# - SECRET_KEY (generate with: python -c "import secrets; print(secrets.token_hex(32))")
# - JWT_SECRET_KEY (generate with: python -c "import secrets; print(secrets.token_hex(32))")
# - OPENAI_API_KEY (from https://platform.openai.com/api-keys)
# - Email settings (SMTP or SendGrid)
```

#### Step 2: Build and Start Containers
```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

#### Step 3: Access the Application
- Frontend: http://localhost:80
- Backend API: http://localhost:5000
- MySQL: localhost:3306 (only accessible to containers)

#### Step 4: Stop Services
```bash
# Stop all containers
docker-compose down

# Stop and remove volumes (WARNING: deletes database)
docker-compose down -v
```

---

### Option 2: Production Deployment (Hostinger KPS VM)

Follow the comprehensive guide in `DEPLOYMENT.md` which includes:

#### Prerequisites
- [ ] Hostinger KPS VM with Ubuntu/Debian
- [ ] Root or sudo access
- [ ] Domain names configured:
  - [ ] `localuae.com` → Points to VM IP
  - [ ] `backend.localuae.com` → Points to VM IP

#### Required Secrets (Prepare Before Deployment)
- [ ] Strong MySQL root password (min 16 chars)
- [ ] Strong MySQL user password (min 16 chars)
- [ ] Flask SECRET_KEY (32+ chars random)
- [ ] JWT_SECRET_KEY (32+ chars random)
- [ ] OpenAI API key
- [ ] Email credentials (Gmail app password or SendGrid key)

#### Quick Start Commands
```bash
# 1. SSH into VM
ssh root@your-vm-ip

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
apt install docker-compose git -y

# 3. Clone repository
cd /opt
git clone https://github.com/yourusername/voice_flow.git
cd voice_flow

# 4. Configure environment variables
cp backend/.env.production backend/.env
nano backend/.env  # Fill in all secrets
nano .env          # Set MySQL passwords

# 5. Deploy with HTTP first (for SSL certificates)
# Follow steps in DEPLOYMENT.md section 5

# 6. Obtain SSL certificates
# Follow steps in DEPLOYMENT.md section 6

# 7. Start with full HTTPS configuration
docker-compose up -d --build

# 8. Verify deployment
docker-compose ps
docker-compose logs -f
```

---

## 🔍 Verification Steps

### 1. Check Container Health
```bash
docker-compose ps
```
Expected output: All containers should show "Up" or "healthy"

### 2. Check Logs
```bash
# Backend logs
docker-compose logs backend | tail -50

# Frontend logs
docker-compose logs frontend | tail -50

# MySQL logs
docker-compose logs mysql | tail -50

# Nginx logs
docker-compose logs nginx | tail -50
```

### 3. Test Database Connection
```bash
# Access MySQL container
docker-compose exec mysql mysql -u voiceflow -p

# Enter password from .env file
# Run: SHOW DATABASES;
# Should see 'voice_flow' database
```

### 4. Test Backend API
```bash
# Health check endpoint (if implemented)
curl http://localhost:5000/api/health

# Or test registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456","first_name":"Test","last_name":"User"}'
```

### 5. Test Frontend
- Open browser: http://localhost (local) or https://localuae.com (production)
- Try to register a new account
- Try to login
- Upload a test audio file
- Check if analysis works

---

## 🔐 Security Checklist

### Before Going Live
- [ ] Change all default passwords in `.env`
- [ ] Generate strong SECRET_KEY and JWT_SECRET_KEY
- [ ] Set FLASK_DEBUG=False in production
- [ ] Enable firewall (UFW on Ubuntu)
- [ ] Set up SSL certificates (Let's Encrypt)
- [ ] Configure automatic SSL renewal
- [ ] Set up database backups
- [ ] Review nginx security headers
- [ ] Test file upload limits
- [ ] Verify CORS settings

### Firewall Configuration (Production)
```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
ufw status
```

---

## 📊 Monitoring & Maintenance

### View Resource Usage
```bash
# Container stats
docker stats

# Disk usage
docker system df

# Specific container
docker stats voice_flow_backend
```

### Logs Management
```bash
# View last 100 lines
docker-compose logs --tail=100

# Follow logs in real-time
docker-compose logs -f

# Logs for specific service
docker-compose logs -f backend
```

### Database Backups
```bash
# Create backup script (see DEPLOYMENT.md section 8.2)
# Automatic daily backups at 2 AM recommended
```

### Update Application
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build

# Run migrations if needed
docker-compose exec backend flask db upgrade
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Container Won't Start
```bash
# Check logs
docker-compose logs <service-name>

# Check if port is in use
netstat -tulpn | grep :5000
netstat -tulpn | grep :80

# Remove and rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### 2. Database Connection Error
```bash
# Verify MySQL is healthy
docker-compose ps mysql

# Check MySQL logs
docker-compose logs mysql

# Verify DATABASE_URL in backend/.env matches .env passwords
```

#### 3. Frontend Can't Connect to Backend
- Check VITE_API_BASE_URL in frontend/.env.production
- Verify CORS settings in backend
- Check nginx proxy configuration
- Verify firewall isn't blocking ports

#### 4. SSL Certificate Issues
```bash
# Check certificate files
ls -la certbot/conf/live/localuae.com/

# Manually renew
docker-compose run --rm certbot renew

# Check nginx config syntax
docker-compose exec nginx nginx -t
```

#### 5. File Upload Fails
- Check client_max_body_size in nginx.conf (currently 500M)
- Verify backend has disk space
- Check backend logs for errors
- Verify upload directory permissions

---

## 📞 Support & Documentation

### Additional Documentation
- **Full Deployment Guide**: See `DEPLOYMENT.md`
- **Quick Start Guide**: See `QUICK_START_GUIDE.md`
- **Testing Guide**: See `TESTING_GUIDE.md`
- **SMTP Setup**: See `SMTP_MIGRATION.md`

### Useful Commands Reference
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart service
docker-compose restart backend

# View logs
docker-compose logs -f

# Execute command in container
docker-compose exec backend flask db upgrade

# Rebuild specific service
docker-compose build --no-cache backend

# Remove everything including volumes
docker-compose down -v
```

---

## ✨ Deployment Completed!

Your Voice Flow application is ready for deployment. Choose:
- **Local testing**: Follow Option 1 above
- **Production deployment**: Follow Option 2 and `DEPLOYMENT.md`

### Next Steps
1. ✅ Update all environment variables with real secrets
2. ✅ Test locally first: `docker-compose up -d`
3. ✅ Verify all features work
4. ✅ Deploy to production VM
5. ✅ Set up SSL certificates
6. ✅ Configure backups
7. ✅ Monitor logs and performance

**Good luck with your deployment! 🚀**
