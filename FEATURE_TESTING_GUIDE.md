# Feature Testing Guide

This document provides a comprehensive guide to test all the newly implemented features.

## Issues Fixed

### 1. Report Service Query Bug
**File:** `backend/app/services/report_service.py`
**Issue:** The status filter was overriding the search filter in `get_reports()` method.
**Fix:** Restructured the query building to properly apply both status and search filters.

### 2. Sidebar Navigation
**File:** `frontend/src/components/common/Sidebar.tsx`
**Addition:** Added "Drafts" link to the sidebar navigation.

### 3. Template Permissions
**Files:**
- `frontend/src/types/template.ts` - Added `can_edit` and `is_owner` fields
- `frontend/src/components/templates/TemplateCard.tsx` - Conditionally show edit/delete buttons
**Enhancement:** Only template creators can edit/delete templates, others see "View Only" badge.

---

## Feature 1: Team Members Can View All Finalized Reports

### Backend Implementation
- **File:** `backend/app/services/report_service.py`
- **Method:** `get_reports()`
- **Logic:**
  - Filters reports by `team_id`
  - Only shows `finalized` reports by default
  - All team members with same `team_id` can view all finalized reports

### How to Test

#### Test Case 1.1: Single User Reports
1. Login as User A
2. Navigate to "My Reports"
3. Create and finalize at least 2-3 reports
4. Verify all finalized reports are visible

#### Test Case 1.2: Team Member Access
1. Login as User A
2. Go to Teams → Invite a team member (User B) via email
3. Register User B using the invitation link
4. Login as User B
5. Navigate to "My Reports"
6. **Expected:** User B can see all reports created by User A
7. **Expected:** Both users see the same finalized reports

#### Test Case 1.3: Search and Filter
1. Login as any team member
2. Use the search box to search for specific reports
3. **Expected:** Search works correctly across all team reports

---

## Feature 2: Template View-Only Access

### Backend Implementation
- **File:** `backend/app/services/template_service.py`
- **Methods:** `get_all_templates()`, `get_template_by_id()`, `update_template()`, `delete_template()`
- **Logic:**
  - Returns `can_edit` and `is_owner` flags with each template
  - Only template creator (`created_by` user) can edit/delete
  - Update/delete operations check permissions

### Frontend Implementation
- **File:** `frontend/src/components/templates/TemplateCard.tsx`
- **Logic:**
  - Shows edit/delete buttons only if `can_edit = true`
  - Shows "View Only" badge for non-editable templates
  - Footer shows "Edit" or "View" based on permissions

### How to Test

#### Test Case 2.1: Template Creator Permissions
1. Login as User A
2. Go to Templates → Create a new template
3. **Expected:** User A can see Edit and Delete buttons on their template
4. **Expected:** Footer shows "Edit" link

#### Test Case 2.2: Team Member View-Only Access
1. Ensure User A has created some templates (from Test Case 2.1)
2. Login as User B (team member)
3. Go to Templates
4. **Expected:** User B can see all templates created by User A
5. **Expected:** Templates created by User A show "View Only" badge
6. **Expected:** NO Edit/Delete buttons visible
7. **Expected:** Footer shows "View" link instead of "Edit"
8. Click "View" to open the template
9. **Expected:** Template fields are visible but not editable

#### Test Case 2.3: Edit/Delete Permission Check (Backend)
1. Login as User B
2. Open browser DevTools → Network tab
3. Try to manually call `PUT /api/templates/{id}` to edit User A's template
4. **Expected:** Returns 404 or permission error
5. Try to manually call `DELETE /api/templates/{id}` to delete User A's template
6. **Expected:** Returns 404 or permission error

#### Test Case 2.4: Template Usage
1. Login as User B
2. Go to Templates → View User A's template
3. Go to Analyze Call
4. **Expected:** User B can select and use User A's template for analysis
5. **Expected:** Analysis works normally

---

## Feature 3: Drafts Page and Save Draft Functionality

### Backend Implementation
- **Files:**
  - `backend/app/services/report_service.py` - Added `get_draft_reports()` and `create_draft_report()`
  - `backend/app/routes/reports.py` - Added `/api/reports/drafts` (GET) and `/api/reports/draft` (POST)
  - `backend/app/services/dashboard_service.py` - Added `drafts_count` to metrics

### Frontend Implementation
- **New Page:** `frontend/src/pages/Drafts.tsx`
- **Updated:** `frontend/src/pages/AnalyzeCall.tsx` - Added "Save as Draft" button
- **Updated:** `frontend/src/services/reportsService.ts` - Added `getDrafts()` and `saveDraft()`
- **Navigation:** Added to `frontend/src/App.tsx` and `frontend/src/components/common/Sidebar.tsx`

### How to Test

#### Test Case 3.1: Save Draft During Analysis
1. Login as any user
2. Go to Analyze Call
3. Select a template
4. Upload/record audio
5. Wait for AI analysis to complete
6. Enter a title for the report
7. Click "Save as Draft" button (NOT "Save Report")
8. **Expected:** Shows success message "Draft saved successfully!"
9. **Expected:** Redirects to /drafts page
10. **Expected:** Draft appears in the drafts list

#### Test Case 3.2: View Drafts Page
1. Navigate to Drafts page (Sidebar → Drafts)
2. **Expected:** Shows all saved drafts
3. **Expected:** Each draft shows:
   - Title
   - Template name
   - Created by
   - Created date
   - Summary (if available)
4. **Expected:** View and Delete buttons are visible

#### Test Case 3.3: View Draft Details
1. On Drafts page, click the "View" (eye icon) button
2. **Expected:** Opens modal showing full draft details
3. **Expected:** Shows all field values
4. **Expected:** Shows transcription

#### Test Case 3.4: Delete Draft
1. On Drafts page, click the "Delete" (trash icon) button
2. **Expected:** Shows confirmation dialog
3. Click "OK"
4. **Expected:** Draft is deleted and removed from list

#### Test Case 3.5: Update Existing Draft
1. Create a draft (Test Case 3.1)
2. Go to Analyze Call again
3. Upload the SAME audio file or a new one
4. After analysis, use the SAME title as the previous draft
5. Click "Save as Draft"
6. **Expected:** Updates the existing draft instead of creating new one
7. Go to Drafts page
8. **Expected:** Only ONE draft with that title (not duplicates)

#### Test Case 3.6: Draft to Report Conversion
1. View a draft
2. Click "Edit" or navigate back to analysis
3. Make any changes
4. Click "Save Report" (NOT "Save as Draft")
5. **Expected:** Creates a finalized report
6. **Expected:** Draft may still exist or be converted (depends on implementation)
7. Navigate to My Reports
8. **Expected:** Report appears in finalized reports

#### Test Case 3.7: Search Drafts
1. Create multiple drafts with different titles
2. On Drafts page, use the search box
3. Enter part of a draft title
4. **Expected:** Shows only matching drafts

---

## Feature 4: Dashboard with Clickable Metric Cards

### Backend Implementation
- **File:** `backend/app/services/dashboard_service.py`
- **Method:** `get_metrics()`
- **Changes:** Returns `drafts_count` and `reports_count` separately

### Frontend Implementation
- **File:** `frontend/src/pages/Dashboard.tsx`
- **Changes:**
  - Updated metric cards to show: Drafts, Reports, Templates, Team Members
  - Made all metric cards clickable
  - Each card navigates to its respective page
- **File:** `frontend/src/services/dashboardService.ts`
- **Changes:** Updated `DashboardMetrics` interface

### How to Test

#### Test Case 4.1: Dashboard Metrics Display
1. Login as any user
2. Navigate to Dashboard
3. **Expected:** See 4 metric cards:
   - **Drafts** (yellow icon)
   - **Reports** (green icon)
   - **Templates** (purple icon)
   - **Team Members** (orange icon)
4. **Expected:** Each card shows correct count

#### Test Case 4.2: Drafts Card Navigation
1. On Dashboard, hover over "Drafts" card
2. **Expected:** Card has hover effect (scales up slightly)
3. Click on "Drafts" card
4. **Expected:** Navigates to /drafts page

#### Test Case 4.3: Reports Card Navigation
1. On Dashboard, click "Reports" card
2. **Expected:** Navigates to /reports page
3. **Expected:** Shows My Reports page

#### Test Case 4.4: Templates Card Navigation
1. On Dashboard, click "Templates" card
2. **Expected:** Navigates to /templates page
3. **Expected:** Shows Report Templates page

#### Test Case 4.5: Team Members Card Navigation
1. On Dashboard, click "Team Members" card
2. **Expected:** Navigates to /teams page
3. **Expected:** Shows Team page with team members list

#### Test Case 4.6: Metrics Accuracy
1. Create 3 drafts
2. Finalize 2 reports
3. Create 1 template
4. Invite 1 team member
5. Go to Dashboard
6. **Expected:**
   - Drafts: 3
   - Reports: 2
   - Templates: (existing count + 1)
   - Team Members: (existing count + 1)

#### Test Case 4.7: Real-time Update
1. Note current metrics on Dashboard
2. Create a new draft
3. Go back to Dashboard
4. **Expected:** Drafts count increased by 1
5. Create a new report
6. Go back to Dashboard
7. **Expected:** Reports count increased by 1

---

## Cross-Feature Integration Tests

### Integration Test 1: Complete Analysis Workflow
1. Login as User A
2. Create a new template
3. Go to Analyze Call
4. Select the template you created
5. Upload audio
6. After analysis, save as draft
7. Verify draft appears in Drafts page
8. Verify Drafts count increased on Dashboard
9. Edit draft and finalize as report
10. Verify report appears in My Reports
11. Verify Reports count increased on Dashboard
12. Login as User B (team member)
13. Verify User B can see the finalized report
14. Verify User B can see the template (view-only)

### Integration Test 2: Permissions Across Features
1. User A creates template T1
2. User A creates report R1 using T1
3. User A creates draft D1 using T1
4. User B (team member) logs in
5. **Templates:** Can view T1 but not edit/delete
6. **Reports:** Can view R1
7. **Drafts:** Can see D1 (if same team)
8. **Dashboard:** Sees combined metrics for the team

---

## Known Limitations and Notes

### Drafts
- Drafts are team-wide visible (same as reports)
- If you want user-specific drafts, add `user_id` filter to `get_draft_reports()`

### Templates
- Templates are team-wide visible
- Only creator can edit/delete
- All team members can use templates for analysis

### Reports
- Only finalized reports are visible on "My Reports"
- To see drafts, use the "Drafts" page

---

## API Endpoints Summary

### Reports & Drafts
- `GET /api/reports` - Get finalized reports (with filters)
- `GET /api/reports/drafts` - Get draft reports
- `POST /api/reports/draft` - Save/update draft
- `GET /api/reports/:id` - Get single report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### Templates
- `GET /api/templates/` - Get all templates (with can_edit flag)
- `GET /api/templates/:id` - Get template details (with can_edit flag)
- `POST /api/templates/` - Create template
- `PUT /api/templates/:id` - Update template (permission check)
- `DELETE /api/templates/:id` - Delete template (permission check)

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics (includes drafts_count, reports_count)

---

## Testing Checklist

### Feature 1: Team Reports ✓
- [ ] Single user can see their reports
- [ ] Team member can see other members' reports
- [ ] Search works across team reports

### Feature 2: Template Permissions ✓
- [ ] Creator can edit/delete their templates
- [ ] Team members see "View Only" on others' templates
- [ ] Edit/delete buttons hidden for non-creators
- [ ] Backend rejects unauthorized edit/delete attempts
- [ ] All team members can use any template

### Feature 3: Drafts ✓
- [ ] Save as draft button works
- [ ] Drafts page shows all drafts
- [ ] View draft details works
- [ ] Delete draft works
- [ ] Search drafts works
- [ ] Update existing draft works
- [ ] Draft to report conversion works

### Feature 4: Dashboard ✓
- [ ] All 4 metric cards display correctly
- [ ] Drafts card navigates to /drafts
- [ ] Reports card navigates to /reports
- [ ] Templates card navigates to /templates
- [ ] Team Members card navigates to /teams
- [ ] Metrics show accurate counts
- [ ] Hover effects work

---

## Troubleshooting

### Issue: "can_edit" is undefined
**Solution:** Clear browser cache and reload. The backend now returns this field.

### Issue: Sidebar doesn't show Drafts link
**Solution:** Restart frontend dev server (`npm run dev`)

### Issue: Dashboard metrics not updating
**Solution:** Refresh the page. Metrics load on page load.

### Issue: Template edit buttons still visible for team members
**Solution:** Make sure you're testing with two DIFFERENT user accounts in different browsers/incognito windows.

---

## Success Criteria

All features are working correctly if:

1. ✅ Team members can view each other's finalized reports
2. ✅ Only template creators can edit/delete templates
3. ✅ Drafts can be saved, viewed, and managed
4. ✅ Dashboard metric cards are clickable and navigate correctly
5. ✅ All permissions are enforced on backend
6. ✅ All UI shows correct states (edit/view buttons, badges, etc.)

---

## Next Steps (Optional Enhancements)

1. **Notifications:** Add notifications when team members create reports/templates
2. **Draft Auto-save:** Auto-save drafts periodically during analysis
3. **Bulk Operations:** Select multiple drafts/reports for bulk delete
4. **Advanced Permissions:** Add role-based permissions (admin, editor, viewer)
5. **Audit Log:** Track who viewed/edited what and when

---

**Last Updated:** 2026-01-08
**Backend Status:** ✅ Running on http://localhost:5000
**Frontend Status:** Start with `npm run dev`
