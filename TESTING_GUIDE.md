# Call Analyzer Application - Complete Testing Guide

## Overview
This guide provides comprehensive testing procedures for all features of the Call Analyzer Application.

## Prerequisites

Before testing, ensure:
1. ✅ Backend server running on http://localhost:5000
2. ✅ Frontend server running on http://localhost:5173
3. ✅ MySQL database is running and migrated
4. ✅ OpenAI API key is configured
5. ✅ (Optional) SendGrid API key for email testing

## Quick Start Test Flow

### 1. Registration & Login (5 min)

**Test User Registration:**
1. Navigate to http://localhost:5173/register
2. Fill in:
   - First Name: "Test"
   - Last Name: "User"
   - Email: "test@example.com"
   - Password: "testpassword123"
3. Click "Create account"
4. ✅ Should redirect to Dashboard
5. ✅ Should see welcome message with your name

**Test Login:**
1. Click "Logout" in top-right
2. Navigate to /login
3. Enter credentials
4. Click "Sign in"
5. ✅ Should redirect to Dashboard

**Test Invalid Login:**
1. Try logging in with wrong password
2. ✅ Should show error message

### 2. Dashboard (3 min)

**Check Metrics:**
1. View the Dashboard
2. ✅ All metric cards should display (initially 0s)
3. ✅ Team members should show 1 (you)
4. ✅ Welcome card should display
5. ✅ Recent activity should show "No recent activity"

### 3. Report Templates (10 min)

**Create Template:**
1. Navigate to "Templates" in sidebar
2. Click "Create New Template" or "New Template"
3. Fill in:
   - Template Name: "Customer Support Call"
   - Description: "Template for customer support calls"
4. Add fields:
   - Field 1: "Customer Name" (Text, Required)
   - Field 2: "Issue Type" (Dropdown, Required)
     - Options: Technical, Billing, General
   - Field 3: "Resolution Notes" (Long Text, Optional)
   - Field 4: "Satisfaction Score" (Number, Optional)
5. Click "Create Template"
6. ✅ Template should appear in list
7. ✅ Should show success message

**Edit Template:**
1. Click "Edit" on your template
2. Change template name to "Customer Support Analysis"
3. Click "Save Template"
4. ✅ Should update successfully

**View Template:**
1. Click on the template card
2. ✅ Should display all field details

### 4. Call Analysis (15 min)

**Upload and Analyze:**
1. Navigate to "Analyze Call" in sidebar
2. Select your template from dropdown
3. **Option A - Upload File:**
   - Click "Upload Audio File"
   - Select an audio file (any format: mp3, wav, etc.)
   - OR drag and drop a file
4. **Option B - Record Audio:**
   - Click "Record Audio"
   - Allow microphone access
   - Click "Start Recording"
   - Speak for 10-15 seconds
   - Click "Stop Recording"
5. Click "Start Analysis"
6. ✅ Should show "Transcribing..." message
7. Wait for analysis (30-60 seconds)
8. ✅ Should display transcription
9. ✅ Should show AI-generated field values
10. ✅ All template fields should be filled

**Edit Results:**
1. Modify any field value
2. Change the generated values if needed
3. Click "Finalize Report"
4. ✅ Should show success message
5. ✅ Should redirect or show confirmation

### 5. My Reports (15 min)

**View Reports List:**
1. Navigate to "My Reports" in sidebar
2. ✅ Should see your finalized report
3. ✅ Should show report title, date, creator

**Search Reports:**
1. Enter search term in search box
2. ✅ Results should filter in real-time

**Filter Reports:**
1. Use status dropdown to filter by "Finalized"
2. ✅ Should show only finalized reports

**View Report Details:**
1. Click the eye icon on a report
2. ✅ Modal should open
3. ✅ Should display:
   - Report title
   - Metadata (ID, status, creator, dates)
   - Summary
   - All field values
   - Full transcription

**Edit Report:**
1. In the view modal, click "Edit"
2. Modify title or field values
3. Click "Save"
4. ✅ Should update successfully
5. ✅ Changes should be reflected

**Download PDF:**
1. Click download icon on a report
2. ✅ PDF should generate and download
3. Open the PDF
4. ✅ Should contain all report data
5. ✅ Should be well-formatted

**Share via Email (if SendGrid configured):**
1. Click email icon on a report
2. Add recipient email(s)
3. Optionally add a message
4. Click "Send Email"
5. ✅ Should show success message
6. ✅ Recipient should receive email with PDF

**Share via WhatsApp:**
1. Click WhatsApp icon on a report
2. ✅ WhatsApp should open with pre-filled message
3. Select contact and send

**Delete Report:**
1. Click trash icon on a report
2. Confirm deletion
3. ✅ Report should be removed from list

**Pagination:**
1. Create 20+ reports
2. ✅ Should show pagination controls
3. ✅ Can navigate between pages

### 6. Team Management (10 min)

**View Team:**
1. Navigate to "Team" in sidebar
2. ✅ Should see team information
3. ✅ Should see yourself as owner

**Invite Member (if SendGrid configured):**
1. Enter email address in invite field
2. Click "Invite"
3. ✅ Should show success message
4. ✅ Invitation should appear in pending list
5. ✅ Email should be sent to recipient

**View Pending Invitations:**
1. Check the invitations panel
2. ✅ Should show all pending invitations
3. ✅ Should show inviter name and expiry date

**Resend Invitation:**
1. Click resend icon on an invitation
2. ✅ Should resend email
3. ✅ Should show success message

**Cancel Invitation:**
1. Click trash icon on an invitation
2. Confirm cancellation
3. ✅ Invitation should be removed

**Test Invitation Flow (requires second email):**
1. Invite "seconduser@example.com"
2. Open registration link from email
3. Register as new user
4. ✅ Should automatically join team
5. Login as first user
6. ✅ Should see second user in team members

**Remove Member (as owner):**
1. Click trash icon next to a member
2. Confirm removal
3. ✅ Member should be removed
4. ✅ Cannot remove yourself (owner)

### 7. Settings (5 min)

**View Profile:**
1. Navigate to "Settings" in sidebar
2. ✅ Profile information should load
3. ✅ Email should be displayed (disabled)

**Update Profile:**
1. Change first name to "Updated"
2. Change last name to "Name"
3. Add/update phone number
4. Click "Save Changes"
5. ✅ Should show success message
6. ✅ Navbar should update with new name

**Change Password:**
1. Enter current password
2. Enter new password (min 8 chars)
3. Confirm new password
4. Click "Change Password"
5. ✅ Should show success message
6. Logout and login with new password
7. ✅ Should work with new password

**Password Validation:**
1. Try entering passwords that don't match
2. ✅ Should show error
3. Try password less than 8 characters
4. ✅ Should show error
5. Try wrong current password
6. ✅ Should show error

### 8. Navigation & UI (5 min)

**Test Navigation:**
1. Click through each sidebar link
2. ✅ All pages should load correctly
3. ✅ Active page should be highlighted

**Test Responsive Design:**
1. Resize browser window
2. ✅ Layout should adjust
3. ✅ Sidebar should remain functional
4. Test on mobile device (if available)
5. ✅ Should work on mobile

**Test Logout:**
1. Click logout button
2. ✅ Should redirect to login
3. ✅ Cannot access protected routes
4. Try accessing /dashboard directly
5. ✅ Should redirect to login

## Edge Cases Testing

### Authentication
- [ ] Login with non-existent email
- [ ] Register with existing email
- [ ] Register with weak password
- [ ] Access protected routes without login
- [ ] Token expiration (wait 1 hour)
- [ ] Token refresh mechanism

### Templates
- [ ] Create template without fields
- [ ] Create template with 10+ fields
- [ ] Delete template used in reports
- [ ] Edit template after creating reports

### Analysis
- [ ] Upload very large file (>100MB)
- [ ] Upload unsupported file type
- [ ] Analysis with no template selected
- [ ] Record very short audio (<5 sec)
- [ ] Record very long audio (>10 min)

### Reports
- [ ] View report that doesn't exist
- [ ] Delete report created by another user
- [ ] Share with invalid email
- [ ] Generate PDF for empty report
- [ ] Search with special characters

### Teams
- [ ] Invite same email twice
- [ ] Invite existing team member
- [ ] Accept expired invitation
- [ ] Remove team owner (should fail)
- [ ] Non-owner trying to invite

### Settings
- [ ] Update with empty fields
- [ ] Change to very long name (255+ chars)
- [ ] Change password to same as current
- [ ] Invalid phone number format

## Performance Testing

### Load Testing
- [ ] Create 100+ reports
- [ ] Create 50+ templates
- [ ] Upload 50MB audio file
- [ ] Generate PDF for 10-page report
- [ ] Invite 50+ team members

### Concurrency Testing
- [ ] Multiple users analyzing simultaneously
- [ ] Multiple users viewing same report
- [ ] Simultaneous PDF generations

## Security Testing

### Authentication
- [ ] SQL injection in login
- [ ] XSS in registration
- [ ] CSRF attacks
- [ ] Token tampering
- [ ] Brute force login attempts

### Authorization
- [ ] Access another team's data
- [ ] Modify another user's reports
- [ ] Delete protected resources
- [ ] Privilege escalation

### Data Validation
- [ ] Malicious file uploads
- [ ] Script injection in text fields
- [ ] HTML injection in rich text
- [ ] Email header injection

## Automated Testing Checklist

### Backend Unit Tests
- [ ] Authentication service tests
- [ ] Template service tests
- [ ] Analysis service tests
- [ ] Report service tests
- [ ] Team service tests

### Frontend Unit Tests
- [ ] Component rendering tests
- [ ] Service function tests
- [ ] Hook tests
- [ ] Context tests

### Integration Tests
- [ ] End-to-end user flows
- [ ] API integration tests
- [ ] Database transaction tests

## Bug Report Template

When you find a bug, report it with:

```
**Description:**
What happened?

**Steps to Reproduce:**
1.
2.
3.

**Expected Behavior:**
What should happen?

**Actual Behavior:**
What actually happened?

**Environment:**
- Browser:
- OS:
- Backend version:
- Frontend version:

**Screenshots:**
(if applicable)

**Console Errors:**
(if any)
```

## Testing Completion Checklist

- [ ] All manual tests passed
- [ ] All edge cases tested
- [ ] Performance is acceptable
- [ ] Security vulnerabilities checked
- [ ] Mobile responsiveness verified
- [ ] Cross-browser compatibility verified
- [ ] Error messages are helpful
- [ ] Loading states work correctly
- [ ] Toast notifications appear
- [ ] Navigation works smoothly

## Next Steps After Testing

1. **Fix any bugs** found during testing
2. **Document known issues** if any
3. **Optimize performance** if needed
4. **Prepare for deployment**
5. **Setup monitoring** and logging
6. **Create user documentation**
7. **Plan production rollout**

## Conclusion

This testing guide ensures comprehensive coverage of all application features. Follow it systematically to verify everything works as expected before deploying to production.

**Happy Testing!** 🧪
