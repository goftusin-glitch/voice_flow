# Fix Backend Database & FFmpeg Errors

## Issues Detected

1. ❌ MySQL Access Denied for user 'voiceflow'
2. ❌ FFmpeg not found (needed for audio processing)

---

## 🔧 Fix 1: Database Connection Error

### Step 1: Check Current Database Configuration

```bash
# Exec into MySQL container
docker exec -it voice_flow_mysql mysql -u root -p
# Password: VoiceFlow_Prod_Root_2024_SecurePass!
```

### Step 2: Inside MySQL, Check/Create User

```sql
-- Check if user exists
SELECT User, Host FROM mysql.user WHERE User = 'voiceflow';

-- If user doesn't exist or has wrong password, recreate it:
DROP USER IF EXISTS 'voiceflow'@'%';
CREATE USER 'voiceflow'@'%' IDENTIFIED BY 'VoiceFlow_Prod_User_2024_SecurePass!';
GRANT ALL PRIVILEGES ON voice_flow.* TO 'voiceflow'@'%';
FLUSH PRIVILEGES;

-- Verify user was created
SELECT User, Host FROM mysql.user WHERE User = 'voiceflow';

-- Exit MySQL
EXIT;
```

### Step 3: Verify Backend .env File

```bash
# Check the backend .env file
cat backend/.env

# It should have these values:
# MYSQL_HOST=voice_flow_mysql
# MYSQL_DATABASE=voice_flow
# MYSQL_USER=voiceflow
# MYSQL_PASSWORD=VoiceFlow_Prod_User_2024_SecurePass!
```

### Step 4: Update Backend .env if Needed

```bash
# Edit the backend .env file
nano backend/.env
```

Make sure it contains:
```env
# Database Configuration
MYSQL_HOST=voice_flow_mysql
MYSQL_PORT=3306
MYSQL_DATABASE=voice_flow
MYSQL_USER=voiceflow
MYSQL_PASSWORD=VoiceFlow_Prod_User_2024_SecurePass!

# Or if using DATABASE_URL:
DATABASE_URL=mysql+pymysql://voiceflow:VoiceFlow_Prod_User_2024_SecurePass!@voice_flow_mysql:3306/voice_flow
```

---

## 🔧 Fix 2: Install FFmpeg in Backend Container

FFmpeg is required for audio processing. Add it to the Dockerfile:

### Option A: Update Dockerfile (Recommended)

Edit `backend/Dockerfile`:

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies including ffmpeg
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Run migrations and start server
CMD sh -c "\
  flask db upgrade && \
  python run.py"
```

Then rebuild:
```bash
docker-compose build backend
docker-compose up -d
```

### Option B: Quick Fix - Install in Running Container

```bash
# Exec into backend container
docker exec -it voice_flow_backend bash

# Install ffmpeg
apt-get update && apt-get install -y ffmpeg

# Exit
exit

# Restart backend
docker-compose restart backend
```

---

## 🚀 Complete Fix Commands

Run all these commands on your server:

```bash
# 1. Fix MySQL User
docker exec -it voice_flow_mysql mysql -u root -pVoiceFlow_Prod_Root_2024_SecurePass! -e "
DROP USER IF EXISTS 'voiceflow'@'%';
CREATE USER 'voiceflow'@'%' IDENTIFIED BY 'VoiceFlow_Prod_User_2024_SecurePass!';
GRANT ALL PRIVILEGES ON voice_flow.* TO 'voiceflow'@'%';
FLUSH PRIVILEGES;
"

# 2. Install FFmpeg in backend
docker exec -it voice_flow_backend bash -c "apt-get update && apt-get install -y ffmpeg"

# 3. Restart backend
docker-compose restart backend

# 4. Check logs
docker-compose logs -f backend
```

---

## ✅ Verify the Fix

### Check Database Connection

```bash
# Test MySQL connection from backend container
docker exec -it voice_flow_backend bash -c "mysql -h voice_flow_mysql -u voiceflow -pVoiceFlow_Prod_User_2024_SecurePass! -e 'SHOW DATABASES;'"

# Should show the 'voice_flow' database
```

### Check FFmpeg

```bash
# Check if ffmpeg is installed
docker exec -it voice_flow_backend bash -c "ffmpeg -version"

# Should show ffmpeg version info
```

### Check Backend Logs

```bash
# View backend logs - should not show errors
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f backend
```

---

## 🔍 Common Issues & Solutions

### Issue: MySQL User Still Denied

**Solution 1 - Check .env file:**
```bash
docker exec -it voice_flow_backend cat /app/.env | grep MYSQL
```

**Solution 2 - Recreate user with specific host:**
```bash
docker exec -it voice_flow_mysql mysql -u root -pVoiceFlow_Prod_Root_2024_SecurePass! -e "
DROP USER IF EXISTS 'voiceflow'@'172.19.0.%';
CREATE USER 'voiceflow'@'172.19.0.%' IDENTIFIED BY 'VoiceFlow_Prod_User_2024_SecurePass!';
GRANT ALL PRIVILEGES ON voice_flow.* TO 'voiceflow'@'172.19.0.%';
FLUSH PRIVILEGES;
"
```

### Issue: Database Doesn't Exist

```bash
docker exec -it voice_flow_mysql mysql -u root -pVoiceFlow_Prod_Root_2024_SecurePass! -e "
CREATE DATABASE IF NOT EXISTS voice_flow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
"
```

### Issue: Can't Install FFmpeg (Read-only filesystem)

Rebuild the backend container with ffmpeg in Dockerfile:

1. Edit `backend/Dockerfile` (add ffmpeg to RUN apt-get install line)
2. Rebuild: `docker-compose build backend`
3. Restart: `docker-compose up -d`

---

## 📝 Expected Backend .env Content

Your `backend/.env` should look like this:

```env
# Flask Configuration
FLASK_APP=run.py
FLASK_ENV=production
SECRET_KEY=your-secret-key-here

# Database Configuration
MYSQL_HOST=voice_flow_mysql
MYSQL_PORT=3306
MYSQL_DATABASE=voice_flow
MYSQL_USER=voiceflow
MYSQL_PASSWORD=VoiceFlow_Prod_User_2024_SecurePass!
DATABASE_URL=mysql+pymysql://voiceflow:VoiceFlow_Prod_User_2024_SecurePass!@voice_flow_mysql:3306/voice_flow

# JWT Configuration
JWT_SECRET_KEY=your-jwt-secret-key-here

# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here

# Frontend URL
FRONTEND_URL=http://72.61.244.159:8080

# Email Configuration (if using)
SENDGRID_API_KEY=your-sendgrid-key-here
FROM_EMAIL=noreply@voiceflow.com
```

---

## ✅ Final Verification Steps

After running all fixes:

```bash
# 1. Check all containers are running
docker-compose ps

# 2. Check backend logs (should not show database errors)
docker-compose logs backend --tail=50

# 3. Test backend API
curl http://localhost:5000/api/health

# 4. Check database connection
docker exec -it voice_flow_backend bash -c "
python -c 'from app import create_app; app = create_app(); print(\"Database connected successfully!\")'
"
```

---

## 🎯 Quick Fix Script

Save this as `fix_backend.sh` and run it:

```bash
#!/bin/bash

echo "Fixing MySQL user..."
docker exec -it voice_flow_mysql mysql -u root -pVoiceFlow_Prod_Root_2024_SecurePass! -e "
DROP USER IF EXISTS 'voiceflow'@'%';
CREATE USER 'voiceflow'@'%' IDENTIFIED BY 'VoiceFlow_Prod_User_2024_SecurePass!';
GRANT ALL PRIVILEGES ON voice_flow.* TO 'voiceflow'@'%';
FLUSH PRIVILEGES;
"

echo "Installing FFmpeg..."
docker exec -it voice_flow_backend bash -c "apt-get update && apt-get install -y ffmpeg"

echo "Restarting backend..."
docker-compose restart backend

echo "Checking logs..."
docker-compose logs backend --tail=20

echo "Done! Check logs above for any remaining errors."
```

Run it:
```bash
chmod +x fix_backend.sh
./fix_backend.sh
```

---

**After running these fixes, your backend should connect to MySQL successfully and have FFmpeg available for audio processing!** 🚀
