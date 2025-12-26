# Phase 5 Quick Start Guide

## Prerequisites

Before testing Phase 5, ensure you have completed:
- Phase 1 (Authentication)
- Phase 2 (Database Models)
- Phase 3 (Report Templates)
- Phase 4 (Audio Processing & Analysis)

## Backend Setup

### 1. Install Dependencies

All required dependencies should already be installed from previous phases. If not:

```bash
cd backend
pip install -r requirements.txt
```

### 2. Environment Variables

Ensure your `.env` file includes:

```env
# Database
DATABASE_URL=mysql+pymysql://root:password@localhost/voice_flow

# JWT
SECRET_KEY=your-secret-key
JWT_SECRET_KEY=your-jwt-secret-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Email (for sharing reports)
SENDGRID_API_KEY=your-sendgrid-api-key  # Optional for testing
FROM_EMAIL=noreply@yourdomain.com

# Frontend
FRONTEND_URL=http://localhost:5173
```

**Note**: Email sharing requires a valid SendGrid API key. You can skip email testing if you don't have one - all other features will work.

### 3. Run Database Migrations

If you've made any schema changes:

```bash
cd backend
flask db upgrade
```

### 4. Start Backend Server

```bash
cd backend
python run.py
```

Backend should start on `http://localhost:5000`

## Frontend Setup

### 1. Install Dependencies

If you haven't already:

```bash
cd frontend
npm install
```

### 2. Environment Variables

Ensure your `.env` file includes:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Start Frontend Server

```bash
cd frontend
npm run dev
```

Frontend should start on `http://localhost:5173`

## Testing Phase 5 Features

### Prerequisite: Create Test Data

Before testing reports, you need to have some reports in the system:

1. **Login** to the application
2. **Create a template** (if not done already)
3. **Analyze a call** using the template
4. **Finalize the analysis** to create a report

Now you're ready to test Phase 5!

### 1. View Reports List

1. Navigate to "My Reports" (add to navigation or go to `/reports`)
2. You should see a list of all finalized reports
3. Test pagination if you have more than 20 reports

**Expected Result**: List of reports with title, template, creator, date, and action buttons

### 2. Test Search

1. Enter a search term in the search box
2. Results should filter in real-time
3. Try partial matches

**Expected Result**: Only matching reports displayed

### 3. Test Filters

1. Use the status dropdown to filter by "Draft" or "Finalized"
2. Results should update immediately

**Expected Result**: Only reports matching the filter displayed

### 4. View Report Details

1. Click the eye icon on any report
2. Modal should open showing full report details
3. Check that all sections are visible:
   - Report title
   - Metadata (ID, status, creator, dates)
   - Summary
   - Analysis details (field values)
   - Full transcription

**Expected Result**: Modal displays complete report information

### 5. Edit Report

1. Open a report in view modal
2. Click the edit button (pencil icon)
3. Modify the title
4. Change some field values
5. Click "Save"
6. Modal should close and list should refresh

**Expected Result**: Changes saved and reflected in the list

### 6. Download PDF

1. Click the download icon (download arrow) on any report
2. PDF should generate and download automatically
3. Open the PDF and verify:
   - Professional layout
   - All report data included
   - Proper formatting

**Expected Result**: PDF file downloaded with complete report

### 7. Share via Email (Optional - Requires SendGrid)

1. Click the email icon (envelope) on any report
2. Share modal should open
3. Add one or more email addresses
4. Optionally add a custom message
5. Click "Send Email"

**Expected Result**: Success message and email sent to recipients

**Note**: If you don't have SendGrid configured, you'll see an error. That's okay - other features still work.

### 8. Share via WhatsApp

1. Click the WhatsApp icon (message circle) on any report
2. WhatsApp Web/App should open with pre-formatted message
3. Select contacts and send

**Expected Result**: WhatsApp opens with report summary

### 9. Delete Report

1. Click the trash icon (trash can) on any report
2. Confirm deletion in the dialog
3. Report should disappear from list

**Expected Result**: Report deleted and removed from list

## Troubleshooting

### "Report not found" Error

**Cause**: You might not have any finalized reports yet
**Solution**: Create and finalize an analysis first

### PDF Generation Fails

**Cause**: Missing `generated/pdfs` directory or permission issues
**Solution**: Ensure directory exists and has write permissions

```bash
mkdir -p backend/generated/pdfs
```

### Email Sharing Fails

**Cause**: SendGrid API key not configured or invalid
**Solution**:
- Add valid SendGrid API key to `.env`
- Or skip email testing (other features work fine)

### Reports List Empty

**Cause**: No reports in database or wrong team context
**Solution**:
- Ensure you've created and finalized at least one analysis
- Check that your user is part of a team

### Modal Doesn't Close After Edit

**Cause**: JavaScript error or network issue
**Solution**: Check browser console for errors

### Search Not Working

**Cause**: Frontend/backend connection issue
**Solution**:
- Check backend is running
- Check network tab for API errors
- Verify CORS settings

## Quick Verification Checklist

After starting both servers, verify:

- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:5173
- [ ] Can login successfully
- [ ] Can navigate to /reports
- [ ] Reports list loads (even if empty)
- [ ] Search box is functional
- [ ] Filter dropdown works
- [ ] Can open report in modal
- [ ] Can edit and save report
- [ ] Can download PDF
- [ ] Can delete report

## API Testing with cURL

If you want to test the backend API directly:

### Get Reports List
```bash
curl -X GET "http://localhost:5000/api/reports" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Get Single Report
```bash
curl -X GET "http://localhost:5000/api/reports/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Report
```bash
curl -X PUT "http://localhost:5000/api/reports/1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Report Title",
    "field_values": [
      {"field_id": 1, "value": "New Value"}
    ]
  }'
```

### Generate PDF
```bash
curl -X POST "http://localhost:5000/api/reports/1/generate-pdf" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Note**: Replace `YOUR_ACCESS_TOKEN` with your actual JWT access token from login.

## Next Steps

Once Phase 5 is working:

1. **Test all features thoroughly**
2. **Create multiple reports for testing**
3. **Test edge cases** (empty searches, invalid data, etc.)
4. **Check responsive design** on mobile devices
5. **Proceed to Phase 6** (Team Management)

## Support

If you encounter issues:

1. Check browser console for JavaScript errors
2. Check backend terminal for Python errors
3. Verify all dependencies are installed
4. Ensure database migrations are up to date
5. Check that all environment variables are set correctly

## Success!

If all tests pass, Phase 5 is complete and working! You now have a fully functional reports management system with viewing, editing, PDF generation, and sharing capabilities.
