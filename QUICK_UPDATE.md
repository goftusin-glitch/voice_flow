# Quick Update Guide - Mobile Responsiveness

## 🚀 One-Command Update (Fastest)

Run this command from your local machine:

```bash
ssh root@72.61.244.159 "cd /root/voice_flow && git pull origin master && docker-compose down && docker-compose build frontend && docker-compose up -d"
```

**Password**: `Eagles@121295`

---

## 🔧 Manual Update (If SSH Command Doesn't Work)

### Step 1: Connect to Server
```bash
ssh root@72.61.244.159
# Password: Eagles@121295
```

### Step 2: Update Code
```bash
cd /root/voice_flow
git pull origin master
```

### Step 3: Rebuild & Restart
```bash
docker-compose down
docker-compose build frontend
docker-compose up -d
```

### Step 4: Verify
```bash
docker-compose ps
# All containers should show "Up"
```

### Step 5: Test
Open https://qliq.info in your browser and test mobile view (F12 → Device toolbar)

---

## ✅ Success Check

Visit https://qliq.info and verify:
- ✅ Hamburger menu appears on mobile view
- ✅ Sidebar slides in/out smoothly
- ✅ All pages are responsive

---

## ❌ If Something Goes Wrong

### Quick Fix
```bash
docker-compose down
docker-compose up -d
```

### Force Rebuild
```bash
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Check Logs
```bash
docker-compose logs frontend
```

### Rollback to Previous Version
```bash
cd /root/voice_flow
git reset --hard c7a85f1
docker-compose down
docker-compose build frontend
docker-compose up -d
```

---

## 📱 Testing Mobile View

1. Open https://qliq.info
2. Press **F12** (DevTools)
3. Press **Ctrl+Shift+M** (Device toolbar)
4. Select iPhone or Android device
5. Test the hamburger menu

---

**Full Documentation**: See `UPDATE_DEPLOYMENT.md` for detailed guide
