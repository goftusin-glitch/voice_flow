# Database Migration Guide - Phase 2

This guide will help you set up the database with all Phase 2 models.

## Prerequisites

1. **MySQL Server** must be installed and running
2. **Python 3.10+** must be installed
3. **Virtual environment** should be set up

## Step-by-Step Instructions

### 1. Configure Database Connection

Edit the `.env` file in the `backend` directory and update the MySQL password:

```env
DATABASE_URL=mysql+pymysql://root:YOUR_ACTUAL_MYSQL_PASSWORD@localhost/voice_flow
```

Replace `YOUR_ACTUAL_MYSQL_PASSWORD` with your MySQL root password.

### 2. Activate Virtual Environment

**Windows:**
```bash
cd backend
venv\Scripts\activate
```

**Linux/Mac:**
```bash
cd backend
source venv/bin/activate
```

### 3. Install Dependencies

If you haven't already installed the dependencies:

```bash
pip install -r requirements.txt
```

### 4. Create Database

Run the database initialization script:

```bash
python init_db.py
```

This script will:
- Connect to your MySQL server
- Create the `voice_flow` database if it doesn't exist
- Set proper character encoding (utf8mb4)

### 5. Initialize Flask-Migrate

If this is your first time running migrations:

```bash
flask db init
```

This creates a `migrations` folder with the migration configuration.

**Note:** If the `migrations` folder already exists, skip this step.

### 6. Create Migration

Generate a migration file for all the Phase 2 models:

```bash
flask db migrate -m "Add Phase 2 models: Team, Template, Analysis, Report"
```

This will:
- Detect all the new models (Team, TeamMember, TeamInvitation, ReportTemplate, TemplateField, CallAnalysis, Report, ReportFieldValue)
- Create a migration script in `migrations/versions/`

### 7. Review Migration (Optional)

You can review the generated migration file in:
```
migrations/versions/XXXX_add_phase_2_models.py
```

### 8. Apply Migration

Run the migration to create all database tables:

```bash
flask db upgrade
```

This will create all the tables in your MySQL database.

### 9. Verify Database

You can verify that all tables were created by connecting to MySQL:

```bash
mysql -u root -p
```

Then:
```sql
USE voice_flow;
SHOW TABLES;
```

You should see the following tables:
- users
- refresh_tokens
- teams
- team_members
- team_invitations
- report_templates
- template_fields
- call_analyses
- reports
- report_field_values
- alembic_version (migration tracking)

## Troubleshooting

### Error: "Access denied for user"
- Check your MySQL password in the `.env` file
- Ensure MySQL server is running

### Error: "Can't connect to MySQL server"
- Make sure MySQL is running: `mysql --version`
- Check if MySQL service is started

### Error: "Database already exists"
- This is fine! The script checks for existing databases
- Proceed with the migration steps

### Error: "SQLALCHEMY_TRACK_MODIFICATIONS warning"
- This is just a warning and can be ignored
- It's already set to False in config.py

### Migration conflicts
If you encounter migration conflicts:

```bash
# Remove migrations folder
rm -rf migrations

# Re-initialize
flask db init
flask db migrate -m "Initial migration with all models"
flask db upgrade
```

## Phase 2 Models Summary

The following models are included in Phase 2:

### Team Models
- **Team**: Stores team information
- **TeamMember**: Links users to teams
- **TeamInvitation**: Manages team invitations

### Template Models
- **ReportTemplate**: Defines report structure
- **TemplateField**: Individual fields in templates

### Analysis Models
- **CallAnalysis**: Stores audio analysis data

### Report Models
- **Report**: Finalized reports
- **ReportFieldValue**: Values for each field in reports

## Next Steps

After completing the migration:

1. Test the backend by running: `python run.py`
2. The API should be available at: `http://localhost:5000`
3. Proceed with Phase 3 implementation (Report Templates features)

## Getting Help

If you encounter any issues:
1. Check the error message carefully
2. Verify your `.env` configuration
3. Ensure MySQL is running
4. Check that all dependencies are installed
