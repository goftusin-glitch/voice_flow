# Unified Dashboard - Complete Testing Guide

## Overview
This document provides comprehensive testing instructions for the new unified dashboard feature.

---

## What's New

### ✅ Unified Dashboard
- Single page for all report creation
- No separate "Analyze Call" page needed
- Voice, text, and image input support
- Auto-save all reports as drafts
- Modern table views everywhere

### ✅ Report Creation Flow
**Old Way:** Dashboard → Analyze Call → Select Template → Upload/Record → Analyze → Save
**New Way:** Dashboard → Select Template → Input (voice/text/image) → Auto-saved as draft

---

## Pre-Testing Checklist

### 1. Pull Latest Code
```bash
cd /opt/voice_flow
git pull origin master
```

### 2. Verify Commits
```bash
git log --oneline -5
```
You should see:
- `feat: Complete unified dashboard frontend implementation`
- `feat: Add unified dashboard API for creating reports from text/voice/image`
- `fix: Team members can now see templates created by owner`

### 3. Restart Services
```bash
docker-compose restart backend frontend
# OR for clean build
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 4. Check Services Status
```bash
docker-compose ps
docker-compose logs -f backend | tail -50
docker-compose logs -f frontend | tail -50
```

---

## Testing Scenarios

### Test 1: Text Input Report Creation ✍️

**Prerequisites:**
- At least one report template created
- Logged in to the application

**Steps:**
1. Navigate to Dashboard (should be default landing page)
2. Observe the new unified interface
3. Click the template dropdown
4. Select a template
5. Type some text in the large text area
   - Example: "Customer called about billing issue. Resolved by providing credit. Customer satisfaction: 8/10"
6. Click "Create Report" button
7. Wait for AI processing (toast notification should appear)
8. Should auto-redirect to Drafts page with the new draft open for editing

**Expected Results:**
- ✅ Text input area is enabled after template selection
- ✅ "Create Report" button appears when text is entered
- ✅ Loading state shows during processing
- ✅ Success toast notification appears
- ✅ Draft created and visible in drafts table
- ✅ All template fields are populated with AI-extracted data
- ✅ Can edit field values if needed
- ✅ Can finalize the draft

**Common Issues:**
- ❌ If button doesn't appear: Check that template is selected
- ❌ If creation fails: Check OpenAI API key in backend logs
- ❌ If fields are empty: Check GPT-4 response in backend logs

---

### Test 2: Voice Recording Report Creation 🎤

**Prerequisites:**
- Microphone permission granted in browser
- Report template selected

**Steps:**
1. On Dashboard, select a template
2. Click the purple circular microphone button
3. Observe recording state:
   - Button turns red
   - Timer starts counting
   - Input area shows "Recording... MM:SS"
4. Speak clearly for 10-30 seconds
   - Example: "This is a sales call with John Smith. He's interested in Product A. Estimated value is five thousand dollars. Follow-up needed next week."
5. Click the red square button to stop recording
6. Wait for processing:
   - Transcription (5-15 seconds)
   - AI analysis (10-30 seconds)
7. Should auto-redirect to draft editor

**Expected Results:**
- ✅ Microphone access requested and granted
- ✅ Recording indicator shows (red button, timer, animation)
- ✅ Recording stops cleanly
- ✅ Audio is transcribed correctly
- ✅ Template fields populated from transcription
- ✅ Draft created automatically
- ✅ Can view transcription in draft

**Common Issues:**
- ❌ Microphone not working: Check browser permissions
- ❌ Recording doesn't stop: Refresh page and try again
- ❌ Transcription fails: Check Whisper API key and credits
- ❌ Poor transcription quality: Speak clearly, reduce background noise

---

### Test 3: Image Upload Report Creation 📷

**Prerequisites:**
- Report template with fields that can be extracted from images
- Image file ready (invoice, receipt, form, screenshot)

**Steps:**
1. On Dashboard, select appropriate template
2. Click the orange upload button (bottom of the three buttons)
3. Select an image file from your computer
4. Wait for processing:
   - Image upload (instant)
   - OCR with GPT-4 Vision (15-30 seconds)
   - AI analysis (10-20 seconds)
5. Should auto-redirect to draft editor

**Expected Results:**
- ✅ File picker opens
- ✅ Only image files selectable
- ✅ Upload shows loading state
- ✅ Text extracted from image
- ✅ Template fields populated from extracted text
- ✅ Draft created automatically

**Test Images:**
- Invoice: Should extract amounts, dates, vendor name
- Receipt: Should extract items, total, date
- Form: Should extract filled fields
- Screenshot: Should extract visible text

**Common Issues:**
- ❌ OCR fails: Check image quality and clarity
- ❌ Wrong data extracted: Try higher resolution image
- ❌ Processing timeout: Check OpenAI API rate limits

---

### Test 4: Camera Capture (Mobile) 📱

**Prerequisites:**
- Mobile device or desktop with webcam
- Camera permission granted

**Steps:**
1. On Dashboard, select template
2. Click the teal camera button (middle button)
3. Camera should activate
4. Capture image
5. Wait for processing
6. Draft should be created

**Expected Results:**
- ✅ Camera permission requested
- ✅ Camera preview shows
- ✅ Can capture image
- ✅ OCR processes the capture
- ✅ Draft created

---

### Test 5: Drafts Table View 📋

**Prerequisites:**
- Multiple drafts created from previous tests

**Steps:**
1. Navigate to Dashboard
2. Scroll to drafts table section
3. Verify table displays correctly:
   - Title column
   - Template column (colored badges)
   - Created by column
   - Created date
   - Updated date
   - Action buttons (Edit, Finalize, Delete)
4. Test search functionality:
   - Type in search box
   - Table should filter in real-time
5. Test template filter:
   - Select different template from dropdown
   - Should show only drafts from that template
6. Test actions:
   - Click Edit: Should navigate to draft editor
   - Click Finalize: Should move to My Reports
   - Click Delete: Should prompt confirmation and delete

**Expected Results:**
- ✅ Table shows all drafts
- ✅ Checkbox selection works
- ✅ Search filters correctly
- ✅ Template filter works
- ✅ All actions function properly
- ✅ Empty state shows when no drafts
- ✅ Loading state shows during fetch

---

### Test 6: My Reports Table View 📊

**Prerequisites:**
- Finalized reports from Test 5

**Steps:**
1. Navigate to My Reports from sidebar
2. Verify new table layout:
   - Similar to drafts table
   - Additional action buttons (Download PDF, Excel, Share)
3. Test filters:
   - All / Finalized / Drafts buttons
4. Test search
5. Test actions:
   - View: Opens modal
   - Download PDF: Generates and downloads
   - Download Excel: Generates and downloads
   - Share Email: Opens share modal
   - Share WhatsApp: Opens WhatsApp
   - Delete: Confirms and deletes
6. Test pagination if >20 reports

**Expected Results:**
- ✅ Table view instead of cards
- ✅ All filters work
- ✅ PDF download works
- ✅ Excel download works
- ✅ Share functionality works
- ✅ Pagination works
- ✅ Stats cards show correct counts

---

### Test 7: Navigation & UI Consistency 🧭

**Steps:**
1. Verify sidebar navigation:
   - "Analyze Call" is removed
   - "Drafts" appears before "My Reports"
   - All links work correctly
2. Check responsive design:
   - Desktop (>1024px)
   - Tablet (768-1024px)
   - Mobile (<768px)
3. Verify consistent styling:
   - Purple theme throughout
   - Icons consistent
   - Buttons have proper states
   - Loading states visible

**Expected Results:**
- ✅ No "Analyze Call" in sidebar
- ✅ All pages accessible
- ✅ Mobile-friendly layouts
- ✅ Touch targets adequate
- ✅ No layout breaks

---

### Test 8: Error Handling 🚨

**Test Scenarios:**

**A. No Template Selected**
1. Try to input text without selecting template
2. Try to record without selecting template
3. Try to upload image without selecting template

**Expected:** Red warning alert visible, actions disabled or show error

**B. API Failures**
1. Stop backend service
2. Try to create report
3. Should show error toast
4. Service restart should allow retry

**Expected:** Graceful error messages, no crashes

**C. Invalid Input**
1. Try empty text
2. Try very long text (>10,000 chars)
3. Try invalid image formats
4. Try very large files

**Expected:** Appropriate validation messages

**D. Network Issues**
1. Slow connection simulation
2. Timeout scenarios

**Expected:** Loading states, timeout messages

---

### Test 9: Team Member Access 👥

**Prerequisites:**
- Owner account with templates
- Team member account

**Steps:**
1. **As Owner:**
   - Create 2-3 templates
   - Create some reports
2. **As Team Member:**
   - Log in to team member account
   - Navigate to Dashboard
   - Verify templates visible in dropdown
   - Create report using owner's template
   - Verify draft appears in table
   - Navigate to My Reports
   - Verify can see team reports

**Expected Results:**
- ✅ Team members see all templates
- ✅ Can create reports using any template
- ✅ Can see all team drafts
- ✅ Can see all team reports
- ✅ Proper permissions (edit own, view all)

---

### Test 10: Performance & UX ⚡

**Metrics to Check:**

1. **Loading Times:**
   - Dashboard load: <2 seconds
   - Template dropdown: Instant
   - Text analysis: 10-30 seconds (depends on OpenAI)
   - Voice transcription: 5-15 seconds + analysis time
   - Image OCR: 15-30 seconds + analysis time

2. **UI Responsiveness:**
   - Button clicks: Immediate feedback
   - Recording start/stop: Instant
   - Search filter: Real-time
   - Table sorting: Instant

3. **Visual Feedback:**
   - Loading spinners visible
   - Progress indicators clear
   - Success/error toasts appear
   - Disabled states obvious

**Expected Results:**
- ✅ No UI freezing
- ✅ Clear progress indication
- ✅ Responsive interactions
- ✅ Smooth animations

---

## Browser Compatibility

Test on:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest, Mac/iOS)
- ✅ Mobile browsers (iOS Safari, Chrome Android)

**Voice recording requires:**
- HTTPS connection (production)
- Microphone permissions
- MediaRecorder API support

---

## Bug Reporting Template

If you find issues, report using this format:

```
**Issue Title:** Brief description

**Severity:** Critical / High / Medium / Low

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Device: Desktop/Mobile

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Result:**
What should happen

**Actual Result:**
What actually happens

**Screenshots:**
Attach if applicable

**Console Errors:**
Copy any errors from browser console

**Backend Logs:**
docker-compose logs backend | grep ERROR
```

---

## Success Criteria

### ✅ All Tests Pass
- Text input creates drafts
- Voice recording works end-to-end
- Image upload processes correctly
- Tables display and function properly
- Navigation flows correctly
- Team members have proper access
- Error handling is graceful
- Performance is acceptable

### ✅ User Experience
- Intuitive workflow
- Clear visual feedback
- Fast enough for production use
- Works on all target devices
- No confusing errors

### ✅ Production Ready
- No critical bugs
- All core features working
- Documentation complete
- Deployment tested

---

## Rollback Plan

If critical issues found:

```bash
# Check previous working commit
git log --oneline -10

# Rollback to specific commit (example)
git reset --hard fe334ec

# Force push if needed (CAREFUL!)
git push -f origin master

# Rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Support & Questions

If you encounter issues during testing:

1. Check backend logs:
   ```bash
   docker-compose logs backend | tail -100
   ```

2. Check frontend logs:
   ```bash
   docker-compose logs frontend | tail -100
   ```

3. Check browser console for errors

4. Verify OpenAI API credits and rate limits

5. Test in incognito mode to rule out cache issues

---

## Post-Testing Checklist

After successful testing:

- [ ] All test scenarios pass
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Mobile experience good
- [ ] Team functionality works
- [ ] Error handling proper
- [ ] Ready for production use

---

## Next Steps

Once testing is complete and successful:
1. Deploy to production (see UNIFIED_DASHBOARD_DEPLOYMENT.md)
2. Monitor initial user feedback
3. Track API usage and costs
4. Plan any enhancements based on usage

---

**Last Updated:** 2026-01-14
**Version:** 1.0
**Status:** Ready for Testing
