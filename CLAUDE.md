# Call Analyzer Application - Complete Implementation Guide for AI Assistants

This comprehensive guide is designed for AI coding assistants (Claude, GPT-4, etc.) to implement a full-stack call analyzer application from scratch.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Complete Project Structure](#complete-project-structure)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Implementation Phases](#implementation-phases)
7. [Critical Code Examples](#critical-code-examples)
8. [Security Implementation](#security-implementation)
9. [Performance Optimization](#performance-optimization)
10. [Testing Strategy](#testing-strategy)
11. [Deployment Guide](#deployment-guide)
12. [Troubleshooting](#troubleshooting)

---

## Project Overview

### Application Purpose

A full-stack web application that allows users to:
- Upload or record call audio
- Automatically transcribe using OpenAI Whisper
- Analyze calls using GPT-4 based on custom report templates
- Generate, edit, and finalize reports
- Collaborate with team members
- Export reports as PDFs
- Share reports via email/WhatsApp

### Core Features

1. **Authentication System**
   - Email/password registration and login
   - JWT-based authentication with refresh tokens
   - Secure password hashing with bcrypt

2. **Dashboard**
   - Hours analyzed metric
   - Total analyses count
   - Report templates count
   - Team members count
   - Recent activity feed

3. **Call Analysis**
   - Upload audio files (any format)
   - Record audio live via browser microphone
   - Select report template before analysis
   - AI transcription (Whisper)
   - AI analysis (GPT-4)
   - Editable analysis results
   - Finalize and save reports

4. **Report Management**
   - List all finalized reports
   - View full report details
   - Edit existing reports
   - Delete reports
   - Generate PDFs
   - Share via email
   - Share via WhatsApp

5. **Report Templates**
   - Create custom templates (Google Forms-style)
   - Field types: text, number, long text, dropdown, multi-select
   - Drag-drop field ordering
   - Edit and delete templates
   - Use templates for analysis

6. **Team Collaboration**
   - Invite members by email
   - Email invitations with signup links
   - All team members see all reports
   - Team member management

7. **Settings**
   - User profile management
   - View invited team members
   - Account settings

### User Decisions

- Analysis happens **post-recording** (not real-time during speaking)
- Team access: **All reports visible** to all team members
- Authentication: **JWT with refresh tokens**
- AI Models: **Whisper for transcription, GPT-4 for analysis**

---

## Tech Stack

### Frontend

- **Framework:** React 18.2
- **Build Tool:** Vite 5.0
- **Language:** TypeScript 5.3
- **Styling:** Tailwind CSS 3.4
- **Routing:** React Router DOM 6.21
- **HTTP Client:** Axios 1.6
- **File Upload:** react-dropzone 14.2
- **Forms:** react-hook-form 7.49
- **Dropdowns:** react-select 5.8
- **Notifications:** react-hot-toast 2.4
- **Icons:** lucide-react 0.303
- **Charts:** recharts 2.10 (dashboard)
- **Date Utils:** date-fns 3.0
- **PDF Generation:** jspdf 2.5

### Backend

- **Framework:** Flask 3.0
- **Language:** Python 3.10+
- **ORM:** SQLAlchemy 3.1
- **Database:** MySQL 8.0
- **Migrations:** Flask-Migrate 4.0
- **CORS:** Flask-CORS 4.0
- **Database Driver:** PyMySQL 1.1
- **Password Hashing:** bcrypt 4.1
- **JWT:** PyJWT 2.8
- **Environment:** python-dotenv 1.0
- **Audio Processing:** pydub 0.25
- **AI:** OpenAI API 1.6 (Whisper + GPT-4)
- **Email:** SendGrid 6.11
- **PDF Generation:** ReportLab 4.0
- **Validation:** validators 0.22

### Infrastructure

- **Database:** MySQL 8.0+
- **Cache (optional):** Redis (for production)
- **Task Queue (optional):** Celery (for production)
- **Email Service:** SendGrid
- **File Storage:** Local filesystem (development), AWS S3 (production)

---

## Complete Project Structure

```
voice_flow/
├── README.md
├── INITIAL.md
├── CLAUDE.md
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── team.py
│   │   │   ├── template.py
│   │   │   ├── analysis.py
│   │   │   └── report.py
│   │   │
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── dashboard.py
│   │   │   ├── analysis.py
│   │   │   ├── reports.py
│   │   │   ├── templates.py
│   │   │   ├── teams.py
│   │   │   └── settings.py
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── audio_service.py
│   │   │   ├── transcription_service.py
│   │   │   ├── analysis_service.py
│   │   │   ├── email_service.py
│   │   │   ├── pdf_service.py
│   │   │   └── storage_service.py
│   │   │
│   │   ├── middleware/
│   │   │   ├── __init__.py
│   │   │   └── auth_middleware.py
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── decorators.py
│   │       ├── validators.py
│   │       └── helpers.py
│   │
│   ├── migrations/
│   ├── uploads/
│   │   └── audio/
│   ├── generated/
│   │   └── pdfs/
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_analysis.py
│   │   └── test_reports.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── .env
│   ├── .gitignore
│   └── run.py
│
└── frontend/
    ├── src/
    │   ├── assets/
    │   │   ├── images/
    │   │   └── styles/
    │   │       └── global.css
    │   │
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── Button.tsx
    │   │   │   ├── Input.tsx
    │   │   │   ├── TextArea.tsx
    │   │   │   ├── Select.tsx
    │   │   │   ├── Modal.tsx
    │   │   │   ├── Sidebar.tsx
    │   │   │   ├── Navbar.tsx
    │   │   │   ├── LoadingSpinner.tsx
    │   │   │   ├── ProtectedRoute.tsx
    │   │   │   └── Layout.tsx
    │   │   │
    │   │   ├── auth/
    │   │   │   ├── LoginForm.tsx
    │   │   │   └── RegisterForm.tsx
    │   │   │
    │   │   ├── dashboard/
    │   │   │   ├── MetricsCard.tsx
    │   │   │   ├── ActivityFeed.tsx
    │   │   │   └── StatsChart.tsx
    │   │   │
    │   │   ├── analysis/
    │   │   │   ├── TemplateSelector.tsx
    │   │   │   ├── AudioUploader.tsx
    │   │   │   ├── AudioRecorder.tsx
    │   │   │   ├── AnalysisResults.tsx
    │   │   │   └── EditableField.tsx
    │   │   │
    │   │   ├── reports/
    │   │   │   ├── ReportsList.tsx
    │   │   │   ├── ReportCard.tsx
    │   │   │   ├── ReportViewModal.tsx
    │   │   │   ├── ShareModal.tsx
    │   │   │   └── ReportFilters.tsx
    │   │   │
    │   │   ├── templates/
    │   │   │   ├── TemplateBuilder.tsx
    │   │   │   ├── TemplateList.tsx
    │   │   │   ├── FieldEditor.tsx
    │   │   │   ├── FieldTypeSelector.tsx
    │   │   │   └── TemplateCard.tsx
    │   │   │
    │   │   ├── teams/
    │   │   │   ├── InviteForm.tsx
    │   │   │   ├── MembersList.tsx
    │   │   │   └── MemberCard.tsx
    │   │   │
    │   │   └── settings/
    │   │       ├── ProfileSection.tsx
    │   │       ├── TeamMembersSection.tsx
    │   │       └── AccountSettings.tsx
    │   │
    │   ├── pages/
    │   │   ├── Login.tsx
    │   │   ├── Register.tsx
    │   │   ├── Dashboard.tsx
    │   │   ├── AnalyzeCall.tsx
    │   │   ├── MyReports.tsx
    │   │   ├── ReportTemplates.tsx
    │   │   ├── Teams.tsx
    │   │   └── Settings.tsx
    │   │
    │   ├── context/
    │   │   ├── AuthContext.tsx
    │   │   ├── AnalysisContext.tsx
    │   │   └── NotificationContext.tsx
    │   │
    │   ├── services/
    │   │   ├── api.ts
    │   │   ├── authService.ts
    │   │   ├── analysisService.ts
    │   │   ├── reportsService.ts
    │   │   ├── templatesService.ts
    │   │   ├── teamsService.ts
    │   │   └── dashboardService.ts
    │   │
    │   ├── types/
    │   │   ├── user.ts
    │   │   ├── report.ts
    │   │   ├── template.ts
    │   │   ├── team.ts
    │   │   ├── analysis.ts
    │   │   └── index.ts
    │   │
    │   ├── hooks/
    │   │   ├── useAuth.ts
    │   │   ├── useAnalysis.ts
    │   │   ├── useAudioRecorder.ts
    │   │   ├── useNotification.ts
    │   │   └── useDebounce.ts
    │   │
    │   ├── utils/
    │   │   ├── validators.ts
    │   │   ├── formatters.ts
    │   │   ├── constants.ts
    │   │   └── helpers.ts
    │   │
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── vite-env.d.ts
    │
    ├── public/
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.example
    ├── .env
    └── .gitignore
```

---

## Database Schema

### Complete SQL Schema

```sql
-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(500) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Teams table
CREATE TABLE teams (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    owner_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_owner_id (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Team members table
CREATE TABLE team_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('owner', 'member') DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_user (team_id, user_id),
    INDEX idx_team_id (team_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Team invitations table
CREATE TABLE team_invitations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    team_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    invited_by INT NOT NULL,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    status ENUM('pending', 'accepted', 'expired') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_email (email),
    INDEX idx_token (invitation_token),
    INDEX idx_team_id (team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report templates table
CREATE TABLE report_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INT NOT NULL,
    team_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    INDEX idx_team_id (team_id),
    INDEX idx_created_by (created_by),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Template fields table
CREATE TABLE template_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_id INT NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    field_label VARCHAR(255) NOT NULL,
    field_type ENUM('text', 'number', 'long_text', 'dropdown', 'multi_select') NOT NULL,
    field_options JSON,
    is_required BOOLEAN DEFAULT FALSE,
    display_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE CASCADE,
    INDEX idx_template_id (template_id),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Call analyses table
CREATE TABLE call_analyses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    team_id INT NOT NULL,
    template_id INT NOT NULL,
    audio_file_path VARCHAR(500),
    audio_duration INT,
    transcription TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_team_id (team_id),
    INDEX idx_template_id (template_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reports table
CREATE TABLE reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    analysis_id INT NOT NULL,
    user_id INT NOT NULL,
    team_id INT NOT NULL,
    template_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    summary TEXT,
    status ENUM('draft', 'finalized') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    finalized_at TIMESTAMP NULL,
    FOREIGN KEY (analysis_id) REFERENCES call_analyses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_team_id (team_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Report field values table
CREATE TABLE report_field_values (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    field_id INT NOT NULL,
    field_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
    FOREIGN KEY (field_id) REFERENCES template_fields(id) ON DELETE CASCADE,
    INDEX idx_report_id (report_id),
    INDEX idx_field_id (field_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dashboard metrics cache table (optional)
CREATE TABLE dashboard_metrics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    team_id INT NOT NULL,
    total_hours_analyzed DECIMAL(10, 2) DEFAULT 0,
    total_analysis_count INT DEFAULT 0,
    total_template_count INT DEFAULT 0,
    total_team_member_count INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_team (user_id, team_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Database Relationships

```
users (1) ----< (M) team_members >---- (M) teams
users (1) ----< (M) reports
users (1) ----< (M) call_analyses
users (1) ----< (M) report_templates
users (1) ----< (M) team_invitations
users (1) ----< (M) refresh_tokens

teams (1) ----< (M) report_templates
teams (1) ----< (M) reports
teams (1) ----< (M) call_analyses

report_templates (1) ----< (M) template_fields
report_templates (1) ----< (M) reports
report_templates (1) ----< (M) call_analyses

call_analyses (1) ----< (M) reports

reports (1) ----< (M) report_field_values
template_fields (1) ----< (M) report_field_values
```

---

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "invitation_token": "optional-token-if-from-team-invitation"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "message": "Email already exists"
}
```

#### POST /api/auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

#### POST /api/auth/refresh

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### POST /api/auth/logout

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /api/auth/me

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

### Dashboard Endpoints

#### GET /api/dashboard/metrics

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "hours_analyzed": 45.5,
    "analysis_count": 127,
    "template_count": 8,
    "team_member_count": 5
  }
}
```

#### GET /api/dashboard/recent-activity

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `limit` (optional): Number of activities to return (default: 10)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": 1,
        "type": "report_created",
        "user_name": "John Doe",
        "report_title": "Customer Support Call Analysis",
        "created_at": "2025-01-15T10:30:00Z"
      },
      {
        "id": 2,
        "type": "template_created",
        "user_name": "Jane Smith",
        "template_name": "Sales Call Template",
        "created_at": "2025-01-14T15:20:00Z"
      }
    ]
  }
}
```

### Analysis Endpoints

#### POST /api/analysis/upload-audio

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request (FormData):**
```
audio_file: <File>
template_id: 1
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "analysis_id": 123,
    "file_path": "uploads/audio/user_1/recording_20250115.mp3",
    "duration": 180
  }
}
```

#### POST /api/analysis/analyze

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "analysis_id": 123
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "analysis_id": 123,
    "transcription": "Hello, this is a customer support call...",
    "summary": "Customer called regarding billing issue. Issue resolved by providing account credit.",
    "field_values": [
      {
        "field_id": 1,
        "field_name": "customer_name",
        "field_label": "Customer Name",
        "field_type": "text",
        "generated_value": "John Smith"
      },
      {
        "field_id": 2,
        "field_name": "issue_type",
        "field_label": "Issue Type",
        "field_type": "dropdown",
        "generated_value": "Billing"
      },
      {
        "field_id": 3,
        "field_name": "satisfaction_score",
        "field_label": "Satisfaction Score",
        "field_type": "number",
        "generated_value": 8
      }
    ]
  }
}
```

#### POST /api/analysis/finalize

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "analysis_id": 123,
  "title": "Customer Support Call - John Smith",
  "field_values": [
    {
      "field_id": 1,
      "value": "John Smith"
    },
    {
      "field_id": 2,
      "value": "Billing"
    },
    {
      "field_id": 3,
      "value": 9
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "report_id": 456,
    "created_at": "2025-01-15T10:35:00Z"
  }
}
```

### Reports Endpoints

#### GET /api/reports

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search query for title
- `status` (optional): Filter by status (draft, finalized)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": 456,
        "title": "Customer Support Call - John Smith",
        "template_name": "Customer Support Template",
        "created_by": "John Doe",
        "created_at": "2025-01-15T10:35:00Z",
        "summary": "Customer called regarding billing issue..."
      }
    ],
    "total": 127,
    "page": 1,
    "pages": 7
  }
}
```

#### GET /api/reports/:id

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "report": {
      "id": 456,
      "title": "Customer Support Call - John Smith",
      "summary": "Customer called regarding billing issue. Issue resolved by providing account credit.",
      "template": {
        "id": 1,
        "name": "Customer Support Template",
        "description": "Template for analyzing customer support calls"
      },
      "field_values": [
        {
          "field_id": 1,
          "field_label": "Customer Name",
          "field_type": "text",
          "value": "John Smith"
        },
        {
          "field_id": 2,
          "field_label": "Issue Type",
          "field_type": "dropdown",
          "value": "Billing"
        },
        {
          "field_id": 3,
          "field_label": "Satisfaction Score",
          "field_type": "number",
          "value": 9
        }
      ],
      "transcription": "Hello, this is a customer support call...",
      "audio_duration": 180,
      "created_by": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "created_at": "2025-01-15T10:35:00Z",
      "finalized_at": "2025-01-15T10:35:00Z"
    }
  }
}
```

#### PUT /api/reports/:id

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Updated Title",
  "field_values": [
    {
      "field_id": 1,
      "value": "Updated value"
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "report_id": 456,
    "updated_at": "2025-01-15T11:00:00Z"
  }
}
```

#### DELETE /api/reports/:id

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Report deleted successfully"
}
```

#### POST /api/reports/:id/generate-pdf

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "pdf_url": "/generated/pdfs/report_456_20250115.pdf"
  }
}
```

#### POST /api/reports/:id/share-email

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "recipients": ["colleague@example.com", "manager@example.com"],
  "message": "Please review this call analysis report."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Report shared successfully via email"
}
```

### Templates Endpoints

#### GET /api/templates

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": 1,
        "name": "Customer Support Template",
        "description": "Template for analyzing customer support calls",
        "field_count": 5,
        "created_by": "John Doe",
        "created_at": "2025-01-10T09:00:00Z"
      }
    ]
  }
}
```

#### GET /api/templates/:id

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "template": {
      "id": 1,
      "name": "Customer Support Template",
      "description": "Template for analyzing customer support calls",
      "fields": [
        {
          "id": 1,
          "field_name": "customer_name",
          "field_label": "Customer Name",
          "field_type": "text",
          "field_options": null,
          "is_required": true,
          "display_order": 1
        },
        {
          "id": 2,
          "field_name": "issue_type",
          "field_label": "Issue Type",
          "field_type": "dropdown",
          "field_options": ["Technical", "Billing", "General"],
          "is_required": true,
          "display_order": 2
        }
      ],
      "created_by": "John Doe",
      "created_at": "2025-01-10T09:00:00Z"
    }
  }
}
```

#### POST /api/templates

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Sales Call Template",
  "description": "Template for analyzing sales calls",
  "fields": [
    {
      "field_name": "lead_name",
      "field_label": "Lead Name",
      "field_type": "text",
      "is_required": true,
      "display_order": 1
    },
    {
      "field_name": "product_interest",
      "field_label": "Product Interest",
      "field_type": "dropdown",
      "field_options": ["Product A", "Product B", "Product C"],
      "is_required": true,
      "display_order": 2
    },
    {
      "field_name": "conversion_probability",
      "field_label": "Conversion Probability",
      "field_type": "number",
      "is_required": false,
      "display_order": 3
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "template_id": 2,
    "created_at": "2025-01-15T12:00:00Z"
  }
}
```

#### PUT /api/templates/:id

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "name": "Updated Template Name",
  "description": "Updated description",
  "fields": [...]
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "template_id": 1,
    "updated_at": "2025-01-15T12:30:00Z"
  }
}
```

#### DELETE /api/templates/:id

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

### Teams Endpoints

#### GET /api/teams

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "team": {
      "id": 1,
      "name": "My Team",
      "owner_id": 1,
      "created_at": "2025-01-01T00:00:00Z"
    }
  }
}
```

#### GET /api/teams/:id/members

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "members": [
      {
        "id": 1,
        "user_id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "owner",
        "joined_at": "2025-01-01T00:00:00Z"
      },
      {
        "id": 2,
        "user_id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "member",
        "joined_at": "2025-01-05T10:00:00Z"
      }
    ]
  }
}
```

#### POST /api/teams/invite

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "email": "newmember@example.com",
  "team_id": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "invitation_id": 10,
    "email": "newmember@example.com",
    "invitation_link": "http://localhost:5173/register?token=abc123xyz789"
  }
}
```

#### POST /api/teams/accept-invitation

**Request:**
```json
{
  "invitation_token": "abc123xyz789"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "team_id": 1,
    "team_name": "My Team"
  }
}
```

### Settings Endpoints

#### GET /api/settings/profile

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

#### PUT /api/settings/profile

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request:**
```json
{
  "first_name": "Jonathan",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully"
}
```

---

## Implementation Phases

### Phase 1: Foundation & Authentication (Days 1-4)

This phase establishes the project structure and implements complete authentication.

#### Backend Setup

**1. Create virtual environment and install dependencies**

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

**2. Create `backend/app/config.py`**

```python
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'mysql+pymysql://root:password@localhost/voice_flow')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = DEBUG

    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)

    # OpenAI
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    WHISPER_MODEL = 'whisper-1'
    GPT_MODEL = 'gpt-4-turbo-preview'

    # File Upload
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 500 * 1024 * 1024  # 500MB
    ALLOWED_AUDIO_EXTENSIONS = {'mp3', 'wav', 'ogg', 'm4a', 'flac', 'webm', 'mp4'}

    # Email
    SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
    FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@voiceflow.com')

    # Frontend URL
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

    # PDF
    PDF_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'generated', 'pdfs')

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
```

**3. Create `backend/app/__init__.py` (Flask App Factory)**

```python
from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import os

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_name='default'):
    app = Flask(__name__)

    # Load config
    from app.config import config
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['FRONTEND_URL'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })

    # Create upload directories
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['PDF_FOLDER'], exist_ok=True)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.analysis import analysis_bp
    from app.routes.reports import reports_bp
    from app.routes.templates import templates_bp
    from app.routes.teams import teams_bp
    from app.routes.settings import settings_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(analysis_bp, url_prefix='/api/analysis')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(templates_bp, url_prefix='/api/templates')
    app.register_blueprint(teams_bp, url_prefix='/api/teams')
    app.register_blueprint(settings_bp, url_prefix='/api/settings')

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {"success": False, "message": "Resource not found"}, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {"success": False, "message": "Internal server error"}, 500

    return app
```

**4. Create `backend/app/models/user.py`**

```python
from app import db
from datetime import datetime
import bcrypt

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100))
    last_name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    # Relationships
    refresh_tokens = db.relationship('RefreshToken', backref='user', lazy=True, cascade='all, delete-orphan')
    teams_owned = db.relationship('Team', foreign_keys='Team.owner_id', backref='owner', lazy=True)
    team_memberships = db.relationship('TeamMember', backref='user', lazy=True, cascade='all, delete-orphan')
    reports = db.relationship('Report', backref='user', lazy=True)
    templates = db.relationship('ReportTemplate', backref='creator', lazy=True)

    def set_password(self, password):
        """Hash and set password"""
        salt = bcrypt.gensalt(rounds=12)
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    def check_password(self, password):
        """Check if password matches"""
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))

    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'phone': self.phone,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class RefreshToken(db.Model):
    __tablename__ = 'refresh_tokens'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    token = db.Column(db.String(500), unique=True, nullable=False, index=True)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_revoked = db.Column(db.Boolean, default=False)
```

**5. Create `backend/app/services/auth_service.py`**

```python
import jwt
from datetime import datetime, timedelta
from app import db
from app.models.user import User, RefreshToken
from flask import current_app

class AuthService:
    @staticmethod
    def register_user(email, password, first_name, last_name, invitation_token=None):
        """Register a new user"""
        # Check if user exists
        if User.query.filter_by(email=email).first():
            raise ValueError("Email already exists")

        # Create user
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        # Handle team invitation if token provided
        if invitation_token:
            AuthService.accept_team_invitation(user, invitation_token)

        # Generate tokens
        access_token = AuthService.generate_access_token(user.id)
        refresh_token = AuthService.generate_refresh_token(user.id)

        return {
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }

    @staticmethod
    def login_user(email, password):
        """Login user"""
        user = User.query.filter_by(email=email).first()

        if not user or not user.check_password(password):
            raise ValueError("Invalid email or password")

        if not user.is_active:
            raise ValueError("Account is deactivated")

        # Generate tokens
        access_token = AuthService.generate_access_token(user.id)
        refresh_token = AuthService.generate_refresh_token(user.id)

        return {
            'user': user.to_dict(),
            'access_token': access_token,
            'refresh_token': refresh_token
        }

    @staticmethod
    def generate_access_token(user_id):
        """Generate JWT access token"""
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
            'iat': datetime.utcnow(),
            'type': 'access'
        }
        token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')
        return token

    @staticmethod
    def generate_refresh_token(user_id):
        """Generate JWT refresh token and store in database"""
        expires_at = datetime.utcnow() + current_app.config['JWT_REFRESH_TOKEN_EXPIRES']

        payload = {
            'user_id': user_id,
            'exp': expires_at,
            'iat': datetime.utcnow(),
            'type': 'refresh'
        }
        token = jwt.encode(payload, current_app.config['JWT_SECRET_KEY'], algorithm='HS256')

        # Store in database
        refresh_token = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
        db.session.add(refresh_token)
        db.session.commit()

        return token

    @staticmethod
    def refresh_access_token(refresh_token_str):
        """Generate new access token from refresh token"""
        # Check if token exists and is valid
        refresh_token = RefreshToken.query.filter_by(
            token=refresh_token_str,
            is_revoked=False
        ).first()

        if not refresh_token:
            raise ValueError("Invalid refresh token")

        if refresh_token.expires_at < datetime.utcnow():
            raise ValueError("Refresh token expired")

        # Decode token to get user_id
        try:
            payload = jwt.decode(
                refresh_token_str,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
        except jwt.ExpiredSignatureError:
            raise ValueError("Refresh token expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid refresh token")

        user_id = payload['user_id']

        # Generate new tokens
        new_access_token = AuthService.generate_access_token(user_id)
        new_refresh_token = AuthService.generate_refresh_token(user_id)

        # Revoke old refresh token
        refresh_token.is_revoked = True
        db.session.commit()

        return {
            'access_token': new_access_token,
            'refresh_token': new_refresh_token
        }

    @staticmethod
    def logout_user(refresh_token_str):
        """Logout user by revoking refresh token"""
        refresh_token = RefreshToken.query.filter_by(token=refresh_token_str).first()

        if refresh_token:
            refresh_token.is_revoked = True
            db.session.commit()

    @staticmethod
    def verify_access_token(token):
        """Verify and decode access token"""
        try:
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )

            if payload.get('type') != 'access':
                raise ValueError("Invalid token type")

            return payload['user_id']
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")

    @staticmethod
    def accept_team_invitation(user, invitation_token):
        """Accept team invitation and add user to team"""
        from app.models.team import TeamInvitation, TeamMember

        invitation = TeamInvitation.query.filter_by(
            invitation_token=invitation_token,
            status='pending'
        ).first()

        if not invitation:
            return

        if invitation.expires_at < datetime.utcnow():
            invitation.status = 'expired'
            db.session.commit()
            return

        # Add user to team
        team_member = TeamMember(
            team_id=invitation.team_id,
            user_id=user.id,
            role='member'
        )
        db.session.add(team_member)

        # Update invitation status
        invitation.status = 'accepted'
        db.session.commit()
```

**6. Create `backend/app/middleware/auth_middleware.py`**

```python
from functools import wraps
from flask import request, jsonify
from app.services.auth_service import AuthService
from app.models.user import User

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                return jsonify({
                    'success': False,
                    'message': 'Invalid token format'
                }), 401

        if not token:
            return jsonify({
                'success': False,
                'message': 'Token is missing'
            }), 401

        try:
            # Verify token and get user_id
            user_id = AuthService.verify_access_token(token)
            current_user = User.query.get(user_id)

            if not current_user:
                return jsonify({
                    'success': False,
                    'message': 'User not found'
                }), 401

            if not current_user.is_active:
                return jsonify({
                    'success': False,
                    'message': 'Account is deactivated'
                }), 401

        except ValueError as e:
            return jsonify({
                'success': False,
                'message': str(e)
            }), 401

        # Pass current_user to the route function
        return f(current_user, *args, **kwargs)

    return decorated
```

**7. Create `backend/app/routes/auth.py`**

```python
from flask import Blueprint, request, jsonify
from app.services.auth_service import AuthService
from app.middleware.auth_middleware import token_required
from app.models.user import User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()

        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400

        # Register user
        result = AuthService.register_user(
            email=data['email'],
            password=data['password'],
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            invitation_token=data.get('invitation_token')
        )

        return jsonify({
            'success': True,
            'data': result
        }), 201

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Registration failed'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()

        # Validate required fields
        if not data.get('email') or not data.get('password'):
            return jsonify({
                'success': False,
                'message': 'Email and password are required'
            }), 400

        # Login user
        result = AuthService.login_user(
            email=data['email'],
            password=data['password']
        )

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 401
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Login failed'
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """Refresh access token"""
    try:
        data = request.get_json()

        if not data.get('refresh_token'):
            return jsonify({
                'success': False,
                'message': 'Refresh token is required'
            }), 400

        # Refresh tokens
        result = AuthService.refresh_access_token(data['refresh_token'])

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 401
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Token refresh failed'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout user"""
    try:
        data = request.get_json()

        if data.get('refresh_token'):
            AuthService.logout_user(data['refresh_token'])

        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Logout failed'
        }), 500

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current user information"""
    return jsonify({
        'success': True,
        'data': current_user.to_dict()
    }), 200
```

**8. Create `backend/run.py`**

```python
from app import create_app
import os

app = create_app(os.getenv('FLASK_ENV', 'development'))

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=app.config['DEBUG']
    )
```

**9. Initialize database and run migrations**

```bash
# Create .env file with database credentials
# Then run:

flask db init
flask db migrate -m "Initial migration with User and RefreshToken models"
flask db upgrade
```

**10. Test backend**

```bash
python run.py
```

Backend should be running on http://localhost:5000

#### Frontend Setup

**1. Initialize Vite + React + TypeScript**

```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
```

**2. Install dependencies**

```bash
npm install react-router-dom axios react-dropzone react-hook-form react-select react-hot-toast lucide-react date-fns
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**3. Configure Tailwind CSS**

Update `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Update `frontend/src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}
```

**4. Create TypeScript types**

Create `frontend/src/types/user.ts`:

```typescript
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  invitation_token?: string;
}
```

**5. Create API client**

Create `frontend/src/services/api.ts`:

```typescript
import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: any[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const accessToken = localStorage.getItem('access_token');
        if (accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // If 401 and not already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Add to queue
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          const refreshToken = localStorage.getItem('refresh_token');

          if (!refreshToken) {
            this.logout();
            return Promise.reject(error);
          }

          try {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refresh_token: refreshToken,
            });

            const { access_token, refresh_token: newRefreshToken } = response.data.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', newRefreshToken);

            // Process failed queue
            this.failedQueue.forEach((prom) => prom.resolve(access_token));
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${access_token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.failedQueue.forEach((prom) => prom.reject(refreshError));
            this.failedQueue = [];
            this.logout();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
  }

  public get<T>(url: string, config = {}) {
    return this.client.get<T>(url, config);
  }

  public post<T>(url: string, data = {}, config = {}) {
    return this.client.post<T>(url, data, config);
  }

  public put<T>(url: string, data = {}, config = {}) {
    return this.client.put<T>(url, data, config);
  }

  public delete<T>(url: string, config = {}) {
    return this.client.delete<T>(url, config);
  }
}

export const apiClient = new ApiClient();
```

**6. Create auth service**

Create `frontend/src/services/authService.ts`:

```typescript
import { apiClient } from './api';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../types/user';

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/login',
      { email, password }
    );

    const { access_token, refresh_token } = response.data.data;
    this.setTokens(access_token, refresh_token);

    return response.data.data;
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    invitationToken?: string
  ): Promise<AuthResponse> {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/register',
      {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        invitation_token: invitationToken,
      }
    );

    const { access_token, refresh_token } = response.data.data;
    this.setTokens(access_token, refresh_token);

    return response.data.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{ success: boolean; data: User }>('/auth/me');
    return response.data.data;
  }

  async logout(): Promise<void> {
    const refreshToken = this.getTokens()?.refresh_token;

    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    this.clearTokens();
  }

  async refreshToken(): Promise<void> {
    const refreshToken = this.getTokens()?.refresh_token;

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{
      success: boolean;
      data: { access_token: string; refresh_token: string };
    }>('/auth/refresh', { refresh_token: refreshToken });

    const { access_token, refresh_token: newRefreshToken } = response.data.data;
    this.setTokens(access_token, newRefreshToken);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  getTokens(): { access_token: string; refresh_token: string } | null {
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    if (!accessToken || !refreshToken) {
      return null;
    }

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return this.getTokens() !== null;
  }
}

export const authService = new AuthService();
```

**7. Create AuthContext**

Create `frontend/src/context/AuthContext.tsx`:

```typescript
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '../types/user';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    invitationToken?: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error) {
          authService.clearTokens();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setUser(response.user);
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    invitationToken?: string
  ) => {
    const response = await authService.register(
      email,
      password,
      firstName,
      lastName,
      invitationToken
    );
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

**8. Create Login and Register pages**

Create `frontend/src/pages/Login.tsx`:

```typescript
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

Create `frontend/src/pages/Register.tsx`:

```typescript
import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(email, password, firstName, lastName, invitationToken || undefined);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          {invitationToken && (
            <p className="mt-2 text-center text-sm text-green-600">
              You've been invited to join a team!
            </p>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              sign in to your account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="sr-only">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="sr-only">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password (min. 8 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
```

**9. Create ProtectedRoute component**

Create `frontend/src/components/common/ProtectedRoute.tsx`:

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

**10. Create App.tsx with routing**

Update `frontend/src/App.tsx`:

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

**11. Create placeholder Dashboard page**

Create `frontend/src/pages/Dashboard.tsx`:

```typescript
import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Call Analyzer</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                {user?.first_name} {user?.last_name}
              </span>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h2 className="text-2xl font-bold mb-4">Welcome to Call Analyzer!</h2>
          <p className="text-gray-600">
            Your dashboard will be implemented in the next phases.
          </p>
        </div>
      </main>
    </div>
  );
};
```

**12. Create .env file**

Create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

**13. Start frontend**

```bash
npm run dev
```

Frontend should be running on http://localhost:5173

---

### Phase 1 Complete!

You now have:
- ✅ Complete authentication system (backend + frontend)
- ✅ JWT tokens with refresh mechanism
- ✅ Login and Register pages
- ✅ Protected routes
- ✅ User model with password hashing
- ✅ Database migrations setup

**Test the authentication:**
1. Register a new account at http://localhost:5173/register
2. Login at http://localhost:5173/login
3. Access protected dashboard
4. Logout and try accessing dashboard (should redirect to login)

---

This completes Phase 1. The implementation continues with:
- Phase 2: Database Models (team, template, analysis, report)
- Phase 3: Report Templates
- Phase 4: Audio Processing & AI Analysis
- Phase 5: Reports Management
- Phase 6: Team Management
- Phase 7: Dashboard & Settings
- Phase 8: UI/UX Polish
- Phase 9: Testing & Deployment

Each subsequent phase builds on the foundation established in Phase 1. The complete implementation would follow the same pattern of creating backend models, services, routes, and then frontend components, pages, and services.

---

## Security Implementation

### Password Hashing

- Use bcrypt with 12 salt rounds (implemented in User model)
- Never store plain text passwords
- Validate password strength on frontend and backend

### JWT Security

- Access tokens: 1 hour expiry
- Refresh tokens: 30 days expiry
- Store refresh tokens in database for revocation
- Implement token rotation on refresh
- Use HTTPS in production

### File Upload Security

- Validate file types (check MIME type and extension)
- Limit file sizes (500MB max)
- Sanitize filenames
- Store outside web root
- Use virus scanning in production (ClamAV)

### API Security

- CORS configured for specific origin
- Rate limiting (add in production)
- Input validation on all endpoints
- SQL injection protection (SQLAlchemy ORM)
- XSS protection (escape user input)

---

## Performance Optimization

### Database

- Add indexes on all foreign keys
- Use connection pooling
- Implement caching with Redis (production)
- Query optimization with SELECT specific columns

### Audio Processing

- Process asynchronously with Celery (production)
- Add progress tracking
- Queue system for concurrent analyses
- Chunk large files

### Frontend

- Code splitting with React.lazy
- Pagination (20 items per page)
- Virtual scrolling for long lists
- Optimize bundle size
- Service worker (optional)

---

## Testing Strategy

### Backend Testing

```python
# tests/test_auth.py
import pytest
from app import create_app, db
from app.models.user import User

@pytest.fixture
def client():
    app = create_app('testing')
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

def test_register(client):
    response = client.post('/api/auth/register', json={
        'email': 'test@example.com',
        'password': 'TestPassword123',
        'first_name': 'Test',
        'last_name': 'User'
    })
    assert response.status_code == 201
    assert response.json['success'] == True

def test_login(client):
    # First register
    client.post('/api/auth/register', json={
        'email': 'test@example.com',
        'password': 'TestPassword123',
        'first_name': 'Test',
        'last_name': 'User'
    })

    # Then login
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'TestPassword123'
    })
    assert response.status_code == 200
    assert 'access_token' in response.json['data']
```

### Frontend Testing

Use Vitest and React Testing Library:

```typescript
// tests/Login.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Login } from '../src/pages/Login';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext';

describe('Login Page', () => {
  it('renders login form', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText('Email address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('submits login form', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email address'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // Assert login was called
    });
  });
});
```

---

## Deployment Guide

### Backend Deployment (AWS EC2 Example)

1. **Provision EC2 instance**
   - Ubuntu 22.04 LTS
   - t3.medium or larger
   - Security group: allow ports 80, 443, 22

2. **Install dependencies**
   ```bash
   sudo apt update
   sudo apt install python3.10 python3-pip python3-venv mysql-server nginx
   ```

3. **Setup MySQL**
   ```bash
   sudo mysql_secure_installation
   sudo mysql
   CREATE DATABASE voice_flow;
   CREATE USER 'voiceflow'@'localhost' IDENTIFIED BY 'strong_password';
   GRANT ALL PRIVILEGES ON voice_flow.* TO 'voiceflow'@'localhost';
   FLUSH PRIVILEGES;
   ```

4. **Deploy application**
   ```bash
   git clone <repository>
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   pip install gunicorn
   ```

5. **Configure environment**
   ```bash
   # Create .env with production values
   SECRET_KEY=<strong-random-key>
   DATABASE_URL=mysql+pymysql://voiceflow:password@localhost/voice_flow
   JWT_SECRET_KEY=<strong-random-key>
   OPENAI_API_KEY=<key>
   SENDGRID_API_KEY=<key>
   FRONTEND_URL=https://yourdomain.com
   ```

6. **Run migrations**
   ```bash
   flask db upgrade
   ```

7. **Configure Gunicorn**
   ```bash
   # /etc/systemd/system/voiceflow.service
   [Unit]
   Description=Voice Flow Backend
   After=network.target

   [Service]
   User=ubuntu
   WorkingDirectory=/home/ubuntu/voice_flow/backend
   Environment="PATH=/home/ubuntu/voice_flow/backend/venv/bin"
   ExecStart=/home/ubuntu/voice_flow/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 run:app

   [Install]
   WantedBy=multi-user.target
   ```

8. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

9. **Enable and start services**
   ```bash
   sudo systemctl enable voiceflow
   sudo systemctl start voiceflow
   sudo systemctl enable nginx
   sudo systemctl restart nginx
   ```

10. **Setup SSL with Let's Encrypt**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d api.yourdomain.com
    ```

### Frontend Deployment (Vercel)

1. **Build application**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel login
   vercel --prod
   ```

3. **Configure environment variables in Vercel**
   - `VITE_API_BASE_URL=https://api.yourdomain.com/api`

4. **Configure custom domain**
   - Add domain in Vercel dashboard
   - Update DNS records

---

## Troubleshooting

### Backend Issues

**Issue:** `ModuleNotFoundError`
**Solution:** Activate virtual environment and install dependencies

**Issue:** Database connection error
**Solution:** Check MySQL is running and credentials are correct

**Issue:** JWT errors
**Solution:** Ensure JWT_SECRET_KEY is set and consistent

### Frontend Issues

**Issue:** CORS errors
**Solution:** Check backend CORS configuration matches frontend URL

**Issue:** Blank page after build
**Solution:** Check browser console for errors, verify API URL is correct

**Issue:** Token refresh loop
**Solution:** Clear localStorage and re-login

### OpenAI API Issues

**Issue:** `AuthenticationError`
**Solution:** Verify API key is correct and has credits

**Issue:** `RateLimitError`
**Solution:** Implement exponential backoff and queue system

**Issue:** Whisper file size limit
**Solution:** Compress audio files before sending

---

## Additional Resources

- Flask Documentation: https://flask.palletsprojects.com/
- React Documentation: https://react.dev/
- OpenAI API Docs: https://platform.openai.com/docs
- SQLAlchemy Docs: https://docs.sqlalchemy.org/
- Tailwind CSS: https://tailwindcss.com/

---

## End of Documentation

This guide provides everything needed to implement the complete Call Analyzer application. Follow the phases sequentially, test each feature as you build it, and refer to the code examples for implementation details.

Total estimated implementation time: 30-35 days for a full-stack developer or AI coding assistant.
