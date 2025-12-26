# Feature Request Template

> **Instructions**: Fill out this template when requesting new features or improvements for the Call Analyzer application. This helps the AI assistant generate a comprehensive implementation plan (PRP).

## FEATURE

[Describe the feature you want to implement. Be specific about:]
- What the feature should do
- Who will use it (users, team owners, admins)
- Where it fits in the application (dashboard, specific page, etc.)
- Why it's needed (business value, user benefit)

**Example**:
```
Add a "Report Archive" feature where users can move old reports to an archive section.
Users should be able to browse archived reports separately from active reports, restore them
to active status, or permanently delete them. This helps keep the main reports list clean
while preserving historical data.
```

---

## EXAMPLES

[Provide examples that help illustrate the feature. Reference files in the `examples/` folder if applicable.]

**Backend Examples**:
- Similar model implementations: `examples/backend/model_example.py`
- Service pattern: `examples/backend/service_example.py`
- Route pattern: `examples/backend/route_example.py`

**Frontend Examples**:
- Component pattern: `examples/frontend/component_example.tsx`
- Service pattern: `examples/frontend/service_example.ts`
- Type definitions: `examples/frontend/type_example.ts`

**Existing Features to Reference**:
- Authentication flow (for security patterns)
- Report management (for CRUD operations)
- Template builder (for complex form handling)

---

## DOCUMENTATION

[List documentation sources needed for implementation.]

**Technical Documentation**:
- [OpenAI API Docs](https://platform.openai.com/docs) - For Whisper/GPT-4 integration
- [Flask Documentation](https://flask.palletsprojects.com/) - For backend routing
- [React Documentation](https://react.dev/) - For frontend components
- [SQLAlchemy](https://docs.sqlalchemy.org/) - For database models
- [Tailwind CSS](https://tailwindcss.com/) - For styling

**Project Documentation**:
- CLAUDE.md - Global conventions and patterns
- examples/ - Code patterns and examples
- PRPs/ - Previous implementation plans

**External Resources** (if needed):
- Specific library docs
- API integrations
- Third-party services

---

## OTHER CONSIDERATIONS

[Document specific requirements, gotchas, edge cases, or constraints.]

**Technical Constraints**:
- Must work with existing authentication system
- Must filter by team_id for proper access control
- Must maintain database migration compatibility
- Performance considerations (pagination, indexing)

**UI/UX Requirements**:
- Must be responsive (mobile, tablet, desktop)
- Must show loading states
- Must handle errors gracefully
- Must provide user feedback (toasts, confirmations)

**Security Requirements**:
- Validate all user input
- Implement proper access control
- Use @token_required decorator for protected routes
- Sanitize database queries (use ORM)

**Common Gotchas**:
- JWT token refresh in axios interceptor
- Team-based filtering in all queries
- Proper error handling with try/catch
- Database indexes for performance
- CORS configuration for frontend
- JSON serialization for complex data types

**Testing Requirements**:
- Backend unit tests for services
- Backend integration tests for routes
- Frontend component tests
- Manual testing checklist

**Deployment Considerations**:
- Database migrations must run successfully
- Environment variables configuration
- Backward compatibility
- API versioning (if needed)

---

## Quick Start Guide (Reference)

> Note: Below is the original setup guide preserved for reference.

# Call Analyzer - Initial Setup Guide

A full-stack application for analyzing call recordings using AI (OpenAI Whisper + GPT-4) to generate customizable reports.

## Features

- User authentication with email/password
- Upload or record call audio directly in browser
- AI-powered transcription using OpenAI Whisper
- Intelligent call analysis using GPT-4
- Customizable report templates (Google Forms-style builder)
- Team collaboration with email invitations
- PDF report generation and sharing
- Dashboard with analytics and metrics

## Tech Stack

**Frontend:**
- React 18 with Vite
- TypeScript
- Tailwind CSS
- React Router DOM
- Axios for API calls
- React Dropzone (file uploads)
- React Hook Form (forms)
- React Hot Toast (notifications)

**Backend:**
- Python 3.10+
- Flask 3.0
- SQLAlchemy ORM
- MySQL Database
- OpenAI API (Whisper + GPT-4)
- SendGrid (email)
- ReportLab (PDF generation)
- JWT Authentication

## Prerequisites

Before starting, ensure you have:

- **Node.js** 18+ and npm
- **Python** 3.10+ and pip
- **MySQL** 8.0+
- **OpenAI API Key** ([Get one here](https://platform.openai.com/api-keys))
- **SendGrid API Key** (optional, for email features)

## Quick Start

### 1. Clone/Download the Project

```bash
cd C:\Users\THIRU\Desktop\voice_flow
```

### 2. Backend Setup

#### Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

#### Install Python Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Flask Configuration
SECRET_KEY=your-secret-key-change-this-in-production
FLASK_ENV=development
FLASK_DEBUG=True

# Database
DATABASE_URL=mysql+pymysql://root:your_password@localhost/voice_flow

# JWT
JWT_SECRET_KEY=jwt-secret-key-change-this-in-production

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here

# SendGrid Email (Optional)
SENDGRID_API_KEY=your-sendgrid-api-key-here
FROM_EMAIL=noreply@voiceflow.com

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

#### Create MySQL Database

```sql
mysql -u root -p

CREATE DATABASE voice_flow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### Run Database Migrations

```bash
# Initialize migrations (first time only)
flask db init

# Create migration
flask db migrate -m "Initial migration"

# Apply migration
flask db upgrade
```

#### Start Backend Server

```bash
python run.py
```

Backend will run on http://localhost:5000

### 3. Frontend Setup

Open a new terminal window:

```bash
cd frontend
```

#### Install Node Dependencies

```bash
npm install
```

#### Configure Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

#### Start Frontend Development Server

```bash
npm run dev
```

Frontend will run on http://localhost:5173

## Project Structure

```
voice_flow/
├── backend/              # Flask backend
│   ├── app/
│   │   ├── models/      # Database models
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth middleware
│   │   └── utils/       # Helper functions
│   ├── uploads/         # Uploaded audio files
│   ├── generated/       # Generated PDFs
│   ├── requirements.txt
│   ├── .env
│   └── run.py
│
└── frontend/            # React frontend
    ├── src/
    │   ├── components/  # React components
    │   ├── pages/       # Page components
    │   ├── context/     # React Context (state)
    │   ├── services/    # API client services
    │   ├── hooks/       # Custom React hooks
    │   ├── types/       # TypeScript types
    │   └── utils/       # Helper functions
    ├── public/
    ├── package.json
    ├── vite.config.ts
    └── .env
```

## First Steps After Setup

1. **Create an Account:**
   - Navigate to http://localhost:5173
   - Click "Register" and create a new account
   - You'll be automatically logged in

2. **Create a Report Template:**
   - Go to "Report Templates" in the sidebar
   - Click "Create Template"
   - Add fields (name, type, options)
   - Save the template

3. **Analyze Your First Call:**
   - Go to "Analyze Call"
   - Select your template
   - Upload an audio file or record live
   - Click "Analyze"
   - Edit the generated report
   - Click "Finalize" to save

4. **View Your Reports:**
   - Go to "My Reports"
   - View, share, or delete reports
   - Generate PDFs for sharing

5. **Invite Team Members:**
   - Go to "Teams"
   - Enter email and send invitation
   - Team members will receive an email with signup link

## Core User Flows

### Authentication Flow
1. Register → Create account with email/password
2. Login → JWT access token (1 hour) + refresh token (30 days)
3. Auto-refresh on token expiry
4. Logout → Revoke tokens

### Analysis Flow
1. User selects report template
2. User uploads audio or records live
3. Click "Analyze"
4. Backend: Audio → Whisper (transcription) → GPT-4 (analysis)
5. Frontend displays editable results
6. User edits and clicks "Finalize"
7. Report saved to database

### Report Template Flow
1. Create template with name and description
2. Add fields with types:
   - Text
   - Number
   - Long Text (textarea)
   - Dropdown (single select)
   - Multi-select
3. Save template
4. Use template when analyzing calls

### Team Collaboration Flow
1. User invites member by email
2. SendGrid sends invitation email with token link
3. Recipient clicks link and creates account
4. Recipient auto-added to team
5. All team reports visible to all members

## API Endpoints Overview

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Dashboard
- `GET /api/dashboard/metrics` - Get dashboard metrics
- `GET /api/dashboard/recent-activity` - Get recent activity

### Analysis
- `POST /api/analysis/upload-audio` - Upload audio file
- `POST /api/analysis/analyze` - Analyze call
- `POST /api/analysis/finalize` - Finalize and save report

### Reports
- `GET /api/reports` - List all reports
- `GET /api/reports/:id` - Get single report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report
- `POST /api/reports/:id/generate-pdf` - Generate PDF
- `POST /api/reports/:id/share-email` - Share via email

### Templates
- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get single template
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Teams
- `GET /api/teams` - Get user's team
- `GET /api/teams/:id/members` - List team members
- `POST /api/teams/invite` - Invite member
- `POST /api/teams/accept-invitation` - Accept invitation

### Settings
- `GET /api/settings/profile` - Get user profile
- `PUT /api/settings/profile` - Update profile

## Environment Variables Reference

### Backend Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key | `your-secret-key-here` |
| `DATABASE_URL` | MySQL connection string | `mysql+pymysql://user:pass@localhost/voice_flow` |
| `JWT_SECRET_KEY` | JWT signing key | `jwt-secret-key-here` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Backend Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SENDGRID_API_KEY` | SendGrid API key | (optional) |
| `FROM_EMAIL` | Sender email address | `noreply@voiceflow.com` |
| `FLASK_ENV` | Flask environment | `development` |
| `FLASK_DEBUG` | Enable debug mode | `True` |

### Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5000/api` |

## Database Schema Overview

The application uses 11 tables:

1. **users** - User accounts
2. **refresh_tokens** - JWT refresh tokens
3. **teams** - Team/organization structure
4. **team_members** - User-team relationships
5. **team_invitations** - Email invitations
6. **report_templates** - Custom report templates
7. **template_fields** - Fields in templates
8. **call_analyses** - Audio files and transcriptions
9. **reports** - Finalized reports
10. **report_field_values** - Field values in reports
11. **dashboard_metrics** - Cached metrics (optional)

## Common Issues & Troubleshooting

### Backend Won't Start

**Issue:** `ModuleNotFoundError: No module named 'flask'`
**Solution:** Activate virtual environment and install dependencies
```bash
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

**Issue:** `sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError)`
**Solution:** Check MySQL is running and credentials in `.env` are correct

### Frontend Won't Start

**Issue:** `Error: Cannot find module`
**Solution:** Install node modules
```bash
npm install
```

**Issue:** `CORS error when calling API`
**Solution:** Check `FRONTEND_URL` in backend `.env` matches frontend URL

### OpenAI API Errors

**Issue:** `AuthenticationError: Invalid API key`
**Solution:** Check `OPENAI_API_KEY` in backend `.env` is correct

**Issue:** `RateLimitError: Rate limit exceeded`
**Solution:** Wait a few minutes or upgrade OpenAI plan

### Database Migration Errors

**Issue:** `ERROR [flask_migrate] Error: Target database is not up to date`
**Solution:** Run migrations
```bash
flask db upgrade
```

**Issue:** `Can't locate revision identified by`
**Solution:** Reset migrations (development only)
```bash
# Delete migrations folder
rm -rf migrations/
# Re-initialize
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

## Development Tips

1. **Use `.env` files:** Never commit `.env` files to version control
2. **Test with sample audio:** Use short audio clips (30-60 seconds) for testing
3. **Monitor OpenAI costs:** Each analysis uses Whisper + GPT-4 tokens
4. **Hot reload enabled:** Both frontend and backend auto-reload on file changes
5. **Check browser console:** Frontend errors appear in browser console
6. **Check terminal output:** Backend errors appear in Flask server terminal

## Production Deployment

For production deployment:

1. **Backend:**
   - Deploy to AWS, DigitalOcean, or Heroku
   - Use production-grade MySQL (RDS, etc.)
   - Set up environment variables on hosting platform
   - Consider using Gunicorn/uWSGI instead of Flask dev server
   - Add Redis for caching and Celery for async tasks

2. **Frontend:**
   - Build: `npm run build`
   - Deploy to Vercel, Netlify, or similar
   - Update `VITE_API_BASE_URL` to production backend URL

3. **Security:**
   - Use HTTPS for both frontend and backend
   - Set strong `SECRET_KEY` and `JWT_SECRET_KEY`
   - Configure CORS for production domain only
   - Enable rate limiting
   - Regular security updates

## Next Steps

- See **CLAUDE.md** for detailed implementation guide
- Customize report templates for your use case
- Set up team and invite members
- Configure email templates in SendGrid
- Explore OpenAI Whisper models for accuracy
- Customize GPT-4 prompts in `analysis_service.py`

## Support & Resources

- OpenAI API Docs: https://platform.openai.com/docs
- Flask Documentation: https://flask.palletsprojects.com/
- React Documentation: https://react.dev/
- Vite Documentation: https://vitejs.dev/
- Tailwind CSS: https://tailwindcss.com/

## License

Proprietary - All rights reserved
