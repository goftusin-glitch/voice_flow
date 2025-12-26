# Voice Flow - Quick Start Guide

## Get Up and Running in 10 Minutes

This guide will help you quickly set up and start using Voice Flow for call analysis.

## Prerequisites

- ✅ Node.js 18+ and npm installed
- ✅ Python 3.10+ installed
- ✅ MySQL 8.0+ installed and running
- ✅ OpenAI API key (get from https://platform.openai.com/api-keys)

## Step 1: Database Setup (2 minutes)

### 1.1 Start MySQL
```bash
# Windows
net start MySQL80

# Mac/Linux
sudo systemctl start mysql
```

### 1.2 Create Database
```bash
cd backend
python init_db.py
```

**Update `.env` with your MySQL password:**
```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost/voice_flow
```

### 1.3 Run Migrations
```bash
# Make sure you're in backend directory
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

## Step 2: Backend Setup (3 minutes)

### 2.1 Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2.2 Configure OpenAI API Key
Edit `backend/.env` and add your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-actual-api-key-here
```

### 2.3 Start Backend Server
```bash
python run.py
```

Backend should start on: http://localhost:5000

✅ **Checkpoint**: Visit http://localhost:5000/api/auth/me (should see error - this is OK)

## Step 3: Frontend Setup (3 minutes)

### 3.1 Install Dependencies
Open a **new terminal**:
```bash
cd frontend
npm install
```

### 3.2 Start Frontend Server
```bash
npm run dev
```

Frontend should start on: http://localhost:5173

✅ **Checkpoint**: Visit http://localhost:5173 (should see login page)

## Step 4: Create Your First Account (1 minute)

1. Go to http://localhost:5173
2. Click "create a new account"
3. Fill in:
   - First Name: Your Name
   - Last Name: Your Last Name
   - Email: your@email.com
   - Password: password123 (or any password 8+ chars)
4. Click "Create account"

✅ You should be logged in and see the Dashboard!

## Step 5: Create Your First Template (1 minute)

1. Click **"Templates"** in the sidebar
2. Click **"Create Your First Template"**
3. Fill in:
   - **Name**: Customer Support Call
   - **Description**: Template for analyzing customer support calls
4. Click **"Add Field"** and create:
   - **Field 1:**
     - Label: Customer Name
     - Field Name: customer_name
     - Type: Text
     - Required: ✅
   - **Field 2:**
     - Label: Issue Type
     - Field Name: issue_type
     - Type: Dropdown
     - Options: Technical, Billing, General
     - Required: ✅
   - **Field 3:**
     - Label: Resolution Notes
     - Field Name: resolution_notes
     - Type: Long Text
     - Required: ❌
5. Click **"Create Template"**

✅ You should see your template in the list!

## Step 6: Analyze Your First Call (2-3 minutes)

### Option A: Upload an Audio File

1. Click **"Analyze Call"** in the sidebar
2. Select your template from dropdown
3. Click **"Continue to Upload"**
4. Make sure **"Upload File"** tab is selected
5. Drag and drop an MP3/audio file (or click to browse)
6. Click **"Analyze Call"**
7. Wait 30-60 seconds for AI analysis
8. Review the results:
   - AI-generated summary
   - Full transcription
   - Extracted field values
9. Edit any values if needed
10. Enter a title: "First Test Analysis"
11. Click **"Save Report"**

### Option B: Record Audio

1. Click **"Analyze Call"** in the sidebar
2. Select your template
3. Click **"Continue to Upload"**
4. Click **"Record Audio"** tab
5. Click **"Start Recording"**
6. Grant microphone permission if prompted
7. Speak for 15-30 seconds (test anything)
8. Click **"Stop"**
9. Click **"Analyze Call"**
10. Follow steps 7-11 from Option A

✅ You should be redirected to Reports (currently placeholder)

## Troubleshooting

### Backend Won't Start

**Error**: `ModuleNotFoundError`
```bash
# Solution: Install dependencies
cd backend
pip install -r requirements.txt
```

**Error**: Database connection failed
```bash
# Solution: Check MySQL is running and password is correct
# Windows: net start MySQL80
# Mac/Linux: sudo systemctl start mysql
```

**Error**: `OPENAI_API_KEY not configured`
```bash
# Solution: Add API key to backend/.env
OPENAI_API_KEY=sk-your-key-here
```

### Frontend Won't Start

**Error**: Port 5173 already in use
```bash
# Solution: Kill the process or change port in vite.config.ts
```

**Error**: Module not found
```bash
# Solution: Install dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Analysis Fails

**Error**: "OpenAI API quota exceeded"
```
Solution:
- Check your OpenAI account has credits
- Visit: https://platform.openai.com/account/billing
```

**Error**: "File type not allowed"
```
Solution: Use supported formats (MP3, WAV, OGG, M4A, FLAC, WEBM, MP4)
```

**Error**: Analysis takes very long
```
This is normal for:
- Files longer than 10 minutes
- First API call (cold start)
- Wait up to 2-3 minutes for long files
```

## What You Can Do Now

### ✅ Available Features (Phases 1-4)

- **Authentication**
  - Register new users
  - Login/logout
  - JWT tokens with auto-refresh

- **Templates**
  - Create custom templates
  - 5 field types (text, number, long_text, dropdown, multi_select)
  - Edit and delete templates

- **Call Analysis**
  - Upload audio files (multiple formats)
  - Record audio live
  - AI transcription (Whisper)
  - AI analysis (GPT-4)
  - Edit extracted values
  - Save as reports

### 🚧 Coming Soon (Phases 5-7)

- **Reports Management** (Phase 5)
  - View all reports
  - Edit reports
  - PDF generation
  - Email/WhatsApp sharing

- **Team Collaboration** (Phase 6)
  - Invite team members
  - Shared reports

- **Dashboard & Settings** (Phase 7)
  - Real metrics
  - User settings

## Sample Test Data

### Sample Audio for Testing

If you don't have audio files, you can:

1. **Record a test call**:
   - Use the "Record Audio" feature
   - Speak for 15-30 seconds
   - Say something like: "Hi, this is John calling about a billing issue. I was charged twice for my subscription last month. Can you help me get a refund?"

2. **Use Text-to-Speech**:
   - Use any TTS tool to generate MP3
   - Example text: "Customer called regarding technical support. Issue was with login not working. Resolved by resetting password."

### Sample Template Fields

**Customer Support Template:**
- Customer Name (text)
- Phone Number (text)
- Issue Type (dropdown: Technical, Billing, General)
- Priority (dropdown: Low, Medium, High)
- Resolution Status (dropdown: Resolved, Pending, Escalated)
- Notes (long_text)
- Satisfaction Score (number)

**Sales Call Template:**
- Lead Name (text)
- Company (text)
- Product Interest (multi_select: Product A, Product B, Product C)
- Budget (number)
- Next Steps (long_text)
- Probability (number)

## Tips for Best Results

### 1. Audio Quality
- ✅ Clear audio with minimal background noise
- ✅ Proper microphone levels
- ✅ Avoid music or overlapping conversations
- ❌ Avoid very low quality recordings

### 2. Template Design
- ✅ Use clear, specific field labels
- ✅ Provide dropdown options that match your data
- ✅ Use long_text for detailed information
- ❌ Don't create too many fields (10-15 max recommended)

### 3. Analysis
- ✅ Review AI results before saving
- ✅ Edit values as needed
- ✅ Use descriptive report titles
- ❌ Don't skip the review step

## API Keys and Costs

### OpenAI API Costs (as of 2024)

**Whisper (Transcription):**
- $0.006 per minute of audio
- Example: 10-minute call = $0.06

**GPT-4 (Analysis):**
- Input: $0.03 per 1K tokens
- Output: $0.06 per 1K tokens
- Example: Typical analysis = $0.05-0.15

**Estimated Cost per Call:**
- Short call (5 min): ~$0.08-0.12
- Medium call (15 min): ~$0.15-0.25
- Long call (30 min): ~$0.25-0.40

**Free Tier:**
- New OpenAI accounts get $5 free credit
- This is enough for ~40-60 test calls

## Next Steps

Now that you're set up:

1. **Create more templates** for different use cases
2. **Analyze some real calls** to test accuracy
3. **Experiment with field types** to find what works best
4. **Wait for Phase 5** for report management features

## Getting Help

- **Documentation**: Check CLAUDE.md for complete docs
- **Phase Guides**:
  - PHASE_3_COMPLETE.md - Templates
  - PHASE_4_COMPLETE.md - Backend analysis
  - PHASE_4_UI_COMPLETE.md - Frontend UI
- **Issues**: Check console logs and error messages
- **OpenAI**: https://platform.openai.com/docs

## Success Checklist

Before considering setup complete, verify:

- ✅ Backend running on port 5000
- ✅ Frontend running on port 5173
- ✅ Can register and login
- ✅ Can create templates
- ✅ Can upload/record audio
- ✅ Can analyze calls (gets transcription and extracted fields)
- ✅ Can save reports

If all above work, you're ready to use Voice Flow! 🎉

---

**Enjoy analyzing your calls with AI!** 🚀
