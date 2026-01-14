# Unified Dashboard - Deployment Guide

## Overview

This guide covers deploying the new unified dashboard feature to your production environment. The unified dashboard replaces the separate "Analyze Call" page with an all-in-one interface for creating reports from text, voice, and images.

---

## What's New in This Release

### 🎯 Key Features

1. **Unified Dashboard**
   - Single page for all report creation
   - Template selector with dropdown
   - Multi-input support: text, voice recording, camera capture, image upload
   - Auto-save all reports as drafts
   - Modern table views for drafts and reports

2. **Batch Operations**
   - Select multiple drafts/reports with checkboxes
   - Batch delete functionality
   - Batch finalize drafts (convert to finalized reports)
   - Visual selection feedback

3. **Improved UX**
   - No more separate "Analyze Call" page
   - Streamlined workflow: Select Template → Input → Auto-saved
   - Table-based views replace card layouts
   - Better search and filtering

### 🔧 Technical Changes

**Backend:**
- New endpoint: `POST /api/reports/create-from-input` (text/voice/image)
- New endpoints: `POST /api/reports/batch-delete`, `POST /api/reports/batch-finalize`
- Three new service methods in `AnalysisService`:
  - `create_draft_from_text()`
  - `create_draft_from_audio()`
  - `create_draft_from_image()`

**Frontend:**
- New page: `NewDashboard.tsx` (replaces Dashboard)
- New components:
  - `MultiInputComponent.tsx` (voice/camera/text/upload)
  - `DraftsTable.tsx` (table view with batch operations)
  - `ReportsTable.tsx` (table view with batch operations)
- Updated: `MyReports.tsx` (converted to table layout)
- Removed: "Analyze Call" from sidebar navigation

---

## Pre-Deployment Checklist

### 1. Backup Current System

```bash
# Backup database
mysqldump -u root -p voice_flow > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup uploaded files
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz backend/uploads/

# Backup environment files
cp backend/.env backend/.env.backup
```

### 2. Verify Prerequisites

- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] MySQL 8.0+ running
- [ ] OpenAI API key with credits
- [ ] Docker and Docker Compose (if using containers)
- [ ] SSL certificates (for production)

### 3. Check Current Version

```bash
# Check current git branch and latest commit
git log -1 --oneline

# Verify you're on master branch
git branch --show-current
```

---

## Deployment Steps

### Option A: Docker Deployment (Recommended)

#### 1. Pull Latest Code

```bash
cd /opt/voice_flow  # or your installation path
git pull origin master
```

#### 2. Verify New Files

```bash
# Check that new files exist
ls -la frontend/src/pages/NewDashboard.tsx
ls -la frontend/src/components/dashboard/MultiInputComponent.tsx
ls -la UNIFIED_DASHBOARD_TESTING.md
```

#### 3. Build and Restart Services

```bash
# Stop current services
docker-compose down

# Build with no cache to ensure fresh build
docker-compose build --no-cache

# Start services
docker-compose up -d

# Check service status
docker-compose ps
```

#### 4. Verify Backend Endpoints

```bash
# Check backend logs for new endpoints
docker-compose logs backend | grep "batch-delete"
docker-compose logs backend | grep "batch-finalize"
docker-compose logs backend | grep "create-from-input"
```

#### 5. Verify Frontend Build

```bash
# Check frontend build output
docker-compose logs frontend | tail -50

# Verify frontend is serving
curl -I http://localhost  # or your domain
```

### Option B: Manual Deployment (VPS/Dedicated Server)

#### 1. Pull Latest Code

```bash
cd /opt/voice_flow
git pull origin master
```

#### 2. Update Backend

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Install any new dependencies (if requirements.txt changed)
pip install -r requirements.txt

# Restart backend service
sudo systemctl restart voice_flow_backend

# Check status
sudo systemctl status voice_flow_backend

# Check logs
sudo journalctl -u voice_flow_backend -n 50 -f
```

#### 3. Update Frontend

```bash
cd frontend

# Install any new dependencies
npm install

# Build production bundle
npm run build

# If using nginx, copy build to web root
sudo cp -r dist/* /var/www/voice_flow/

# Restart nginx
sudo systemctl restart nginx
```

#### 4. Verify Deployment

```bash
# Test backend endpoint
curl -X POST http://localhost:5000/api/reports/batch-delete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"report_ids": []}'

# Should return 400 (expected - empty array)
# If you get 404, endpoint not loaded

# Check frontend
curl -I https://yourdomain.com
```

---

## Post-Deployment Verification

### 1. Smoke Test - Quick Verification

```bash
# Test backend health
curl http://localhost:5000/api/auth/health

# Test frontend loads
curl http://localhost:3000  # or your frontend port
```

### 2. Feature Testing

Follow the comprehensive testing guide: `UNIFIED_DASHBOARD_TESTING.md`

**Quick Test Checklist:**

1. **Login** ✓
   - Navigate to your domain
   - Login with existing credentials
   - Should see unified dashboard

2. **Template Selection** ✓
   - Dashboard should show template dropdown
   - Select a template
   - Warning banner should disappear

3. **Text Input** ✓
   - Type text in the text area
   - "Create Report" button should appear
   - Click to create report
   - Should redirect to Drafts page with new draft

4. **Voice Recording** ✓
   - Click purple microphone button
   - Allow microphone permission
   - Record 5-10 seconds of audio
   - Stop recording
   - Should process and create draft

5. **Batch Operations** ✓
   - Go to dashboard drafts table
   - Select multiple drafts with checkboxes
   - "Finalize Selected" and "Delete Selected" buttons appear
   - Test batch finalize
   - Test batch delete

6. **Table Views** ✓
   - Verify drafts table has search and filters
   - Go to My Reports
   - Verify reports are in table format (not cards)
   - Test pagination if >20 reports

### 3. Monitor Logs

```bash
# Monitor backend logs
docker-compose logs -f backend

# OR for systemd
sudo journalctl -u voice_flow_backend -f

# Watch for errors
docker-compose logs backend | grep ERROR
```

### 4. Check Performance

```bash
# Monitor resource usage
docker stats

# Check database connections
docker-compose exec db mysql -uroot -p -e "SHOW PROCESSLIST;"

# Check disk space
df -h
```

---

## Configuration Updates

### Environment Variables

Ensure these are set in `backend/.env`:

```env
# OpenAI API (required for AI features)
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=mysql+pymysql://user:pass@localhost/voice_flow

# Frontend URL (for CORS)
FRONTEND_URL=https://yourdomain.com

# File uploads
MAX_CONTENT_LENGTH=524288000  # 500MB

# JWT
JWT_SECRET_KEY=your-secret-key-here
```

### Nginx Configuration (if using reverse proxy)

Update nginx config to support larger uploads:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Increase upload size for audio/image files
    client_max_body_size 500M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Increase timeouts for AI processing
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

Reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## Troubleshooting

### Issue 1: Frontend Shows Blank Page

**Symptoms:** White screen, no errors in console

**Solutions:**
```bash
# Clear browser cache
# Check frontend build
cd frontend
npm run build

# Check nginx/apache is serving the right directory
ls -la /var/www/voice_flow/

# Check browser console for errors
```

### Issue 2: "Analyze Call" Still Appears in Sidebar

**Symptoms:** Old navigation still visible

**Solution:**
```bash
# Frontend not rebuilt properly
cd frontend
rm -rf dist node_modules
npm install
npm run build

# Restart frontend service
docker-compose restart frontend
```

### Issue 3: Batch Operations Return 404

**Symptoms:** Batch delete/finalize buttons don't work

**Solution:**
```bash
# Backend endpoints not loaded
cd backend
git pull origin master

# Check routes file
grep "batch-delete" app/routes/reports.py

# Restart backend
docker-compose restart backend

# OR
sudo systemctl restart voice_flow_backend
```

### Issue 4: Voice Recording Not Working

**Symptoms:** Microphone button doesn't record

**Solutions:**
1. **HTTPS Required:** Voice recording requires HTTPS in production
   ```bash
   # Verify SSL certificate
   sudo certbot certificates

   # Renew if needed
   sudo certbot renew
   ```

2. **Browser Permissions:** User must allow microphone access

3. **Check browser console** for MediaRecorder errors

### Issue 5: Image Upload Fails

**Symptoms:** Image upload shows error

**Solutions:**
```bash
# Check file size limits
# Update nginx config
client_max_body_size 500M;

# Check backend config
# In backend/.env
MAX_CONTENT_LENGTH=524288000

# Restart services
docker-compose restart
```

### Issue 6: OpenAI API Errors

**Symptoms:** "Failed to analyze" errors

**Solutions:**
```bash
# Check API key is valid
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check API credits
# Visit: https://platform.openai.com/account/usage

# Check backend logs for specific error
docker-compose logs backend | grep -i openai
```

---

## Rollback Procedure

If critical issues arise, rollback to previous version:

### 1. Identify Last Working Commit

```bash
git log --oneline -10

# Example output:
# 09b2add feat: Update My Reports to table format + comprehensive testing docs
# 07c65da feat: Complete unified dashboard frontend implementation
# fe334ec fix: Team members can now see templates created by owner
```

### 2. Rollback Code

```bash
# Rollback to specific commit (replace with your commit hash)
git reset --hard fe334ec

# WARNING: This discards all changes after that commit
# Only use if you're sure you want to rollback
```

### 3. Rebuild Services

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 4. Restore Database (if schema changed)

```bash
# If database migrations were run, restore backup
mysql -u root -p voice_flow < backup_YYYYMMDD_HHMMSS.sql
```

---

## Performance Optimization

### 1. Database Indexing

Ensure proper indexes exist:

```sql
-- Check existing indexes
SHOW INDEX FROM reports;

-- Add index if missing (should already exist)
CREATE INDEX idx_report_status ON reports(status);
CREATE INDEX idx_report_team_id ON reports(team_id);
```

### 2. File Storage

Consider moving uploads to object storage (AWS S3, etc.) if handling large volumes:

```python
# backend/app/config.py
# Update storage backend
STORAGE_BACKEND = 'S3'  # or 'LOCAL'
S3_BUCKET_NAME = 'your-bucket-name'
S3_REGION = 'us-east-1'
```

### 3. Caching

Add Redis for session caching (optional):

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## Monitoring

### 1. Setup Health Checks

Add to monitoring tool (Datadog, New Relic, etc.):

```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend health
curl http://localhost:3000
```

### 2. Log Aggregation

Consider centralized logging:

```bash
# Send logs to service
docker-compose logs -f | grep ERROR | your-log-aggregator
```

### 3. Alerts

Setup alerts for:
- High error rate (>5% of requests)
- API response time >3s
- Disk usage >80%
- Database connections >80% of max

---

## Security Checklist

- [ ] SSL/TLS certificates valid and auto-renewing
- [ ] Environment variables not in git repo
- [ ] Database backups running daily
- [ ] File upload size limits enforced
- [ ] Rate limiting enabled on API
- [ ] CORS configured for production domain only
- [ ] JWT secret keys are strong and unique
- [ ] OpenAI API key restricted to specific IP (if possible)

---

## API Rate Limits

Be aware of OpenAI API rate limits:

- **GPT-4:** ~10,000 requests/day (Tier 1)
- **Whisper:** ~50 requests/minute
- **GPT-4 Vision:** ~100 requests/day (new accounts)

Monitor usage at: https://platform.openai.com/account/usage

Consider implementing:
- Queue system for high-volume periods
- Retry logic with exponential backoff
- User rate limiting (e.g., 10 reports/user/day)

---

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Check error logs
- Monitor API usage
- Verify backups completed

**Weekly:**
- Review performance metrics
- Check disk space
- Update dependencies if security patches released

**Monthly:**
- Review user feedback
- Analyze feature usage
- Plan optimizations based on usage patterns

### Getting Help

1. **Check logs first:**
   ```bash
   docker-compose logs backend | tail -100
   docker-compose logs frontend | tail -100
   ```

2. **Review testing guide:** `UNIFIED_DASHBOARD_TESTING.md`

3. **Check browser console** for frontend errors

4. **Verify environment** variables are correct

---

## Success Metrics

After deployment, monitor these metrics:

1. **User Adoption:**
   - % of users using new unified dashboard
   - Reports created per day (should increase)
   - Average time to create report (should decrease)

2. **System Performance:**
   - API response times
   - Database query times
   - Frontend load time

3. **Feature Usage:**
   - Text input vs voice vs image (which is most popular?)
   - Batch operations usage
   - Draft finalization rate

4. **Error Rates:**
   - Failed report creations (target: <2%)
   - OpenAI API errors (target: <1%)
   - Server errors (target: <0.5%)

---

## Additional Resources

- **Testing Guide:** UNIFIED_DASHBOARD_TESTING.md
- **Full Documentation:** CLAUDE.md
- **Quick Start:** QUICK_START_GUIDE.md
- **GitHub Issues:** Report bugs and feature requests

---

## Changelog

**Version 2.0 - Unified Dashboard** (2026-01-14)
- ✨ New unified dashboard replacing separate Analyze Call page
- ✨ Multi-input support: text, voice, camera, image
- ✨ Batch operations for drafts and reports
- ✨ Table views with search and filters
- 🔧 Backend: New batch operation endpoints
- 🔧 Frontend: Complete UI overhaul
- 📝 Comprehensive testing documentation

**Version 1.5 - Team Templates Fix** (2026-01-13)
- 🐛 Fixed team members unable to see owner's templates
- 🔧 Fixed registration flow for invited users

---

**Last Updated:** 2026-01-14
**Version:** 2.0
**Status:** Production Ready
