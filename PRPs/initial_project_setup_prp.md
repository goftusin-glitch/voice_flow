# PRP: Initial Project Setup (Phase 1 - Foundation & Authentication)

**Generated**: 2025-01-22
**Feature**: Bootstrap complete Call Analyzer application with authentication
**Confidence Score**: 9/10

---

## Critical Context

### Existing Patterns

**Current State:**
- ✅ Project root with documentation (CLAUDE.md, INITIAL.md, README.md)
- ✅ Examples directory with code patterns
- ❌ No `backend/` directory - must create from scratch
- ❌ No `frontend/` directory - must create from scratch
- ❌ No database - must create schema

**Architecture Pattern (Three-Layer):**
```
Routes (API) → Services (Business Logic) → Models (Database)
```

**Backend Stack:**
- Flask 3.0 with blueprints for modular routing
- SQLAlchemy ORM for database operations
- JWT authentication with access + refresh tokens
- bcrypt for password hashing (12 rounds)
- Flask-CORS for cross-origin requests
- Flask-Migrate for database migrations

**Frontend Stack:**
- React 18 functional components
- TypeScript for type safety
- Vite for fast dev server and builds
- React Router DOM for navigation
- Axios with interceptors for API calls
- Context API for global state (AuthContext)
- Tailwind CSS for styling
- react-hot-toast for notifications

**Database Pattern:**
- MySQL 8.0+ with utf8mb4 charset
- Auto-increment INT primary keys
- Foreign keys with CASCADE delete
- created_at, updated_at timestamps
- Indexes on all foreign keys

**Authentication Flow:**
- Access token: 1 hour expiry, stored in localStorage
- Refresh token: 30 days expiry, stored in database + localStorage
- Automatic token refresh via axios interceptor
- Protected routes use `@token_required` decorator (backend) and `<ProtectedRoute>` component (frontend)

### Key Dependencies

**Backend Python Packages** (requirements.txt):
```
Flask==3.0.0
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.1.1
Flask-Migrate==4.0.5
PyMySQL==1.1.0
PyJWT==2.8.0
bcrypt==4.1.2
python-dotenv==1.0.0
```

**Frontend npm Packages** (package.json):
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "axios": "^1.6.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.303.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

**Database:**
- MySQL 8.0+ required
- Database name: `voice_flow`
- Character set: utf8mb4
- Collation: utf8mb4_unicode_ci

### External Resources

**Documentation:**
- [Flask Documentation](https://flask.palletsprojects.com/) - App factory pattern, blueprints
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/) - Models, relationships, queries
- [PyJWT Documentation](https://pyjwt.readthedocs.io/) - JWT encoding/decoding
- [React Documentation](https://react.dev/) - Hooks, Context API
- [Vite Guide](https://vitejs.dev/guide/) - Configuration, build
- [Axios Documentation](https://axios-http.com/docs/intro) - Interceptors, requests
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility classes

**Reference Files:**
- `examples/backend/model_example.py` - SQLAlchemy model pattern
- `examples/backend/service_example.py` - Service layer pattern
- `examples/frontend/component_example.tsx` - React component pattern
- `CLAUDE.md` (Lines 600-1300) - Complete Phase 1 implementation code

### Code Conventions

**Backend:**
- snake_case for functions, variables, file names
- PascalCase for class names
- Services use @staticmethod
- All protected routes use `@token_required` decorator
- Consistent JSON response: `{'success': bool, 'data'/'message': ...}`
- Try/except error handling with appropriate HTTP status codes
- SQLAlchemy ORM - NO raw SQL queries

**Frontend:**
- camelCase for variables, functions
- PascalCase for components, interfaces
- Functional components with hooks
- TypeScript strict mode - no `any` types
- Props interfaces for all components
- Services export singleton instances
- Tailwind CSS for all styling
- Toast notifications for user feedback

**Naming:**
- Backend files: `auth_service.py`, `user.py`
- Frontend files: `authService.ts`, `Login.tsx`
- Routes: kebab-case `/api/auth/refresh-token`

### Gotchas

1. **CORS Configuration**: `FRONTEND_URL` in backend .env MUST match frontend URL exactly
2. **JWT Token Refresh Loop**: Implement interceptor correctly to avoid infinite loops
3. **bcrypt on Windows**: May require Microsoft C++ Build Tools
4. **PyMySQL Connection String**: Format is `mysql+pymysql://user:pass@host/dbname`
5. **Flask App Factory**: Must call `db.init_app(app)` AFTER creating app
6. **React Router**: Use `<Navigate>` not `<Redirect>` in React Router v6
7. **Axios Interceptors**: Check if request is retry to avoid loops (`_retry` flag)
8. **MySQL Case Sensitivity**: Table names are case-sensitive on Linux, not Windows
9. **Environment Variables**: Vite requires `VITE_` prefix for env vars
10. **Token Storage**: Never log tokens - security risk

---

## Implementation Blueprint

### Database Changes

#### Create Database

```sql
-- Run this in MySQL
CREATE DATABASE voice_flow
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

#### Table 1: users

```sql
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
```

#### Table 2: refresh_tokens

```sql
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
```

### Backend Implementation

#### Project Structure

```
backend/
├── app/
│   ├── __init__.py              # Flask app factory
│   ├── config.py                # Configuration classes
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py              # User and RefreshToken models
│   ├── services/
│   │   ├── __init__.py
│   │   └── auth_service.py      # Authentication business logic
│   ├── routes/
│   │   ├── __init__.py
│   │   └── auth.py              # Auth endpoints
│   └── middleware/
│       ├── __init__.py
│       └── auth_middleware.py   # @token_required decorator
├── migrations/                   # Created by flask db init
├── uploads/
│   └── audio/                   # For future audio uploads
├── generated/
│   └── pdfs/                    # For future PDF generation
├── requirements.txt
├── .env
├── .env.example
├── .gitignore
└── run.py                       # Application entry point
```

#### 1. backend/requirements.txt

```txt
Flask==3.0.0
Flask-CORS==4.0.0
Flask-SQLAlchemy==3.1.1
Flask-Migrate==4.0.5
PyMySQL==1.1.0
PyJWT==2.8.0
bcrypt==4.1.2
python-dotenv==1.0.0
```

#### 2. backend/.env.example

```env
# Flask Configuration
SECRET_KEY=your-secret-key-change-this-in-production
FLASK_ENV=development
FLASK_DEBUG=True

# Database
DATABASE_URL=mysql+pymysql://root:your_password@localhost/voice_flow

# JWT
JWT_SECRET_KEY=jwt-secret-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

#### 3. backend/app/config.py

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

    # Frontend URL
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

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

#### 4. backend/app/__init__.py

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
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads', 'audio')
    pdfs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'generated', 'pdfs')
    os.makedirs(uploads_dir, exist_ok=True)
    os.makedirs(pdfs_dir, exist_ok=True)

    # Register blueprints
    from app.routes.auth import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {"success": False, "message": "Resource not found"}, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {"success": False, "message": "Internal server error"}, 500

    return app
```

#### 5. backend/app/models/__init__.py

```python
from app.models.user import User, RefreshToken

__all__ = ['User', 'RefreshToken']
```

#### 6. backend/app/models/user.py

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

#### 7. backend/app/services/__init__.py

```python
# Empty file to make services a package
```

#### 8. backend/app/services/auth_service.py

```python
import jwt
from datetime import datetime, timedelta
from app import db
from app.models.user import User, RefreshToken
from flask import current_app

class AuthService:
    @staticmethod
    def register_user(email, password, first_name, last_name):
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
```

#### 9. backend/app/middleware/__init__.py

```python
# Empty file to make middleware a package
```

#### 10. backend/app/middleware/auth_middleware.py

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

#### 11. backend/app/routes/__init__.py

```python
# Empty file to make routes a package
```

#### 12. backend/app/routes/auth.py

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
            last_name=data.get('last_name', '')
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

#### 13. backend/run.py

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

#### 14. backend/.gitignore

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/

# Flask
instance/
.webassets-cache

# Database
*.db
*.sqlite

# Environment
.env

# IDE
.vscode/
.idea/
*.swp
*.swo

# Uploads
uploads/*
!uploads/.gitkeep
generated/*
!generated/.gitkeep

# Logs
*.log
```

### Frontend Implementation

#### Project Structure

```
frontend/
├── src/
│   ├── assets/
│   ├── components/
│   │   └── common/
│   │       ├── ProtectedRoute.tsx
│   │       └── LoadingSpinner.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Dashboard.tsx
│   ├── services/
│   │   ├── api.ts
│   │   └── authService.ts
│   ├── types/
│   │   ├── user.ts
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── .env
├── .env.example
└── .gitignore
```

#### 1. Initialize Vite Project

```bash
cd frontend
npm create vite@latest . -- --template react-ts
```

#### 2. frontend/package.json

```json
{
  "name": "call-analyzer-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "axios": "^1.6.0",
    "react-hot-toast": "^2.4.0",
    "lucide-react": "^0.303.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

#### 3. frontend/.env.example

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

#### 4. frontend/tailwind.config.js

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

#### 5. frontend/postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

#### 6. frontend/src/index.css

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
```

#### 7. frontend/src/types/user.ts

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
}
```

#### 8. frontend/src/types/index.ts

```typescript
export * from './user';
```

#### 9. frontend/src/services/api.ts

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

#### 10. frontend/src/services/authService.ts

```typescript
import { apiClient } from './api';
import { AuthResponse, User } from '../types/user';

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
    lastName: string
  ): Promise<AuthResponse> {
    const response = await apiClient.post<{ success: boolean; data: AuthResponse }>(
      '/auth/register',
      {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
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

#### 11. frontend/src/context/AuthContext.tsx

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
    lastName: string
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
    lastName: string
  ) => {
    const response = await authService.register(
      email,
      password,
      firstName,
      lastName
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

#### 12. frontend/src/components/common/ProtectedRoute.tsx

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

#### 13. frontend/src/pages/Login.tsx

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

#### 14. frontend/src/pages/Register.tsx

```typescript
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await register(email, password, firstName, lastName);
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

#### 15. frontend/src/pages/Dashboard.tsx

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
            Authentication is working. Next phases will add the full dashboard.
          </p>
        </div>
      </main>
    </div>
  );
};
```

#### 16. frontend/src/App.tsx

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

#### 17. frontend/src/main.tsx

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

#### 18. frontend/.gitignore

```
# Dependencies
node_modules/

# Production
dist/
build/

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db
```

### Step-by-Step Implementation Order

#### Backend Setup (Steps 1-10)

1. **Create Project Structure** ✓
   - [ ] Navigate to `voice_flow/` directory
   - [ ] Create `backend/` directory
   - [ ] Create all subdirectories: `app/models/`, `app/services/`, `app/routes/`, `app/middleware/`
   - [ ] Create `uploads/audio/` and `generated/pdfs/` directories

2. **Setup Python Virtual Environment** ✓
   - [ ] Open terminal in `backend/` directory
   - [ ] Run: `python -m venv venv`
   - [ ] Activate: Windows: `venv\Scripts\activate`, Mac/Linux: `source venv/bin/activate`
   - [ ] Verify activation: prompt shows `(venv)`

3. **Install Python Dependencies** ✓
   - [ ] Create `requirements.txt` with exact content from blueprint
   - [ ] Run: `pip install -r requirements.txt`
   - [ ] Verify: `pip list` shows all packages

4. **Configure Environment** ✓
   - [ ] Create `.env.example` file
   - [ ] Copy `.env.example` to `.env`
   - [ ] Update `DATABASE_URL` with your MySQL password
   - [ ] Generate strong random keys for `SECRET_KEY` and `JWT_SECRET_KEY`

5. **Create Database** ✓
   - [ ] Open MySQL: `mysql -u root -p`
   - [ ] Run: `CREATE DATABASE voice_flow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
   - [ ] Verify: `SHOW DATABASES;` includes `voice_flow`
   - [ ] Exit: `EXIT;`

6. **Create All Backend Files** ✓
   - [ ] Create `config.py`
   - [ ] Create `__init__.py` (app factory)
   - [ ] Create `models/__init__.py` and `models/user.py`
   - [ ] Create `services/__init__.py` and `services/auth_service.py`
   - [ ] Create `middleware/__init__.py` and `middleware/auth_middleware.py`
   - [ ] Create `routes/__init__.py` and `routes/auth.py`
   - [ ] Create `run.py`
   - [ ] Create `.gitignore`

7. **Initialize Database Migrations** ✓
   - [ ] Run: `flask db init` (creates `migrations/` folder)
   - [ ] Run: `flask db migrate -m "Initial migration - users and refresh tokens"`
   - [ ] Review generated migration file in `migrations/versions/`
   - [ ] Run: `flask db upgrade`
   - [ ] Verify: `flask db current` shows migration ID

8. **Verify Database Schema** ✓
   - [ ] Open MySQL: `mysql -u root -p voice_flow`
   - [ ] Run: `SHOW TABLES;` (should show `users`, `refresh_tokens`, `alembic_version`)
   - [ ] Run: `DESCRIBE users;` (verify all columns)
   - [ ] Run: `DESCRIBE refresh_tokens;` (verify all columns)

9. **Start Backend Server** ✓
   - [ ] Ensure virtual environment is activated
   - [ ] Run: `python run.py`
   - [ ] Server should start on `http://0.0.0.0:5000`
   - [ ] Check for any errors in terminal

10. **Test Backend Endpoints** ✓
    - [ ] Open new terminal
    - [ ] Test register:
    ```bash
    curl -X POST http://localhost:5000/api/auth/register \
      -H "Content-Type: application/json" \
      -d '{"email":"test@example.com","password":"testpass123","first_name":"Test","last_name":"User"}'
    ```
    - [ ] Should return 201 with user data and tokens
    - [ ] Test login with same credentials
    - [ ] Verify tokens are returned

#### Frontend Setup (Steps 11-20)

11. **Create Frontend Project** ✓
    - [ ] Navigate to `voice_flow/` directory
    - [ ] Create `frontend/` directory
    - [ ] Run: `cd frontend`
    - [ ] Run: `npm create vite@latest . -- --template react-ts`
    - [ ] Select "Yes" if prompted about existing files

12. **Install Dependencies** ✓
    - [ ] Run: `npm install`
    - [ ] Run: `npm install react-router-dom axios react-hot-toast lucide-react`
    - [ ] Run: `npm install -D tailwindcss postcss autoprefixer`
    - [ ] Run: `npx tailwindcss init -p`

13. **Configure Tailwind** ✓
    - [ ] Update `tailwind.config.js` with content paths
    - [ ] Update `postcss.config.js`
    - [ ] Replace `src/index.css` with Tailwind directives

14. **Configure Environment** ✓
    - [ ] Create `.env.example`
    - [ ] Create `.env` with: `VITE_API_BASE_URL=http://localhost:5000/api`

15. **Create TypeScript Types** ✓
    - [ ] Create `src/types/` directory
    - [ ] Create `src/types/user.ts`
    - [ ] Create `src/types/index.ts`

16. **Create Services** ✓
    - [ ] Create `src/services/` directory
    - [ ] Create `src/services/api.ts` (with interceptors!)
    - [ ] Create `src/services/authService.ts`

17. **Create Context** ✓
    - [ ] Create `src/context/` directory
    - [ ] Create `src/context/AuthContext.tsx`

18. **Create Components** ✓
    - [ ] Create `src/components/common/` directory
    - [ ] Create `src/components/common/ProtectedRoute.tsx`

19. **Create Pages** ✓
    - [ ] Create `src/pages/` directory
    - [ ] Create `src/pages/Login.tsx`
    - [ ] Create `src/pages/Register.tsx`
    - [ ] Create `src/pages/Dashboard.tsx`

20. **Setup Routing** ✓
    - [ ] Update `src/App.tsx` with routes
    - [ ] Update `src/main.tsx` if needed
    - [ ] Create `.gitignore`

#### Testing (Steps 21-25)

21. **Start Frontend** ✓
    - [ ] Ensure backend is running
    - [ ] In frontend directory: `npm run dev`
    - [ ] Server should start on `http://localhost:5173`
    - [ ] Open browser to that URL

22. **Test Registration** ✓
    - [ ] Navigate to `http://localhost:5173/register`
    - [ ] Fill out form with test data
    - [ ] Submit form
    - [ ] Should redirect to `/dashboard`
    - [ ] Check browser console for errors
    - [ ] Verify toast success message

23. **Test Login** ✓
    - [ ] Logout from dashboard
    - [ ] Navigate to `/login`
    - [ ] Enter credentials from registration
    - [ ] Submit form
    - [ ] Should redirect to `/dashboard`
    - [ ] Verify welcome message shows name

24. **Test Protected Routes** ✓
    - [ ] While logged in, note that `/dashboard` is accessible
    - [ ] Logout
    - [ ] Try to access `/dashboard` directly
    - [ ] Should redirect to `/login`
    - [ ] Login again
    - [ ] Should see dashboard

25. **Verify Database** ✓
    - [ ] Open MySQL: `mysql -u root -p voice_flow`
    - [ ] Run: `SELECT * FROM users;`
    - [ ] Verify test user exists
    - [ ] Run: `SELECT * FROM refresh_tokens;`
    - [ ] Verify refresh tokens exist
    - [ ] Check `is_revoked` toggles on logout

### Error Handling

**Backend Common Errors:**

```python
# 400 Bad Request - Validation errors
if not data.get('email'):
    return jsonify({'success': False, 'message': 'Email is required'}), 400

# 401 Unauthorized - Auth errors
if not user or not user.check_password(password):
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

# 404 Not Found
if not entity:
    return jsonify({'success': False, 'message': 'Not found'}), 404

# 500 Server Error
except Exception as e:
    return jsonify({'success': False, 'message': 'Internal server error'}), 500
```

**Frontend Error Handling:**

```typescript
try {
  const result = await authService.login(email, password);
  toast.success('Logged in successfully!');
} catch (error: any) {
  const message = error.response?.data?.message || 'Operation failed';
  toast.error(message);
}
```

### Testing Strategy

**Backend Manual Testing:**

```bash
# Test user registration
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123","first_name":"Test","last_name":"User"}'

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Test get current user (replace TOKEN)
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# Test token refresh
curl -X POST http://localhost:5000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"REFRESH_TOKEN"}'
```

**Frontend Manual Testing:**
- Register new account → Should succeed and redirect
- Login with account → Should succeed and redirect
- Access dashboard while logged in → Should show dashboard
- Logout → Should redirect to login
- Try to access dashboard after logout → Should redirect to login
- Invalid login credentials → Should show error toast
- Duplicate email registration → Should show error toast

---

## Validation Gates

### Backend Validation

```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# 1. Check Python packages installed
pip list | grep Flask
pip list | grep SQLAlchemy
pip list | grep PyJWT

# 2. Test database connection
python -c "from app import create_app, db; app = create_app(); app.app_context().push(); print('DB connection OK')"

# 3. Run database migrations
flask db migrate -m "Initial migration"
flask db upgrade

# Verify migration
flask db current

# 4. Check MySQL database
mysql -u root -p voice_flow -e "SHOW TABLES;"
mysql -u root -p voice_flow -e "DESCRIBE users;"
mysql -u root -p voice_flow -e "DESCRIBE refresh_tokens;"

# 5. Start server (check for errors)
python run.py
# Should show: Running on http://0.0.0.0:5000

# 6. Test API endpoints (in new terminal)
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","first_name":"Test","last_name":"User"}'

# Should return 201 with tokens

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Should return 200 with tokens
```

### Frontend Validation

```bash
# Navigate to frontend directory
cd frontend

# 1. Type checking
npm run type-check
# OR
npx tsc --noEmit

# Should show no errors

# 2. Check dependencies
npm list react
npm list axios
npm list react-router-dom

# 3. Build check (verify no errors)
npm run build

# Should create dist/ folder

# 4. Start dev server
npm run dev

# Should start on http://localhost:5173

# 5. Browser console check
# Open browser DevTools (F12)
# Navigate to http://localhost:5173
# Check Console tab - should have no errors
# Check Network tab - API calls should work

# 6. localStorage check
# After login, check Application > Local Storage
# Should see: access_token, refresh_token
```

### Manual Testing Checklist

#### Authentication Flow

- [ ] **Registration Works**
  - [ ] Navigate to `/register`
  - [ ] Fill form with valid data
  - [ ] Submit form
  - [ ] Success toast appears
  - [ ] Redirects to `/dashboard`
  - [ ] User name displays correctly

- [ ] **Registration Validation**
  - [ ] Empty email shows validation
  - [ ] Invalid email format shows error
  - [ ] Short password (< 8 chars) shows validation
  - [ ] Duplicate email shows error message

- [ ] **Login Works**
  - [ ] Navigate to `/login`
  - [ ] Enter valid credentials
  - [ ] Submit form
  - [ ] Success toast appears
  - [ ] Redirects to `/dashboard`

- [ ] **Login Validation**
  - [ ] Wrong password shows error
  - [ ] Non-existent email shows error
  - [ ] Empty fields show validation

- [ ] **Protected Routes**
  - [ ] While logged out, `/dashboard` redirects to `/login`
  - [ ] While logged in, `/dashboard` is accessible
  - [ ] While logged in, `/` redirects to `/dashboard`

- [ ] **Logout Works**
  - [ ] Click logout button
  - [ ] Redirects to `/login`
  - [ ] Cannot access `/dashboard` anymore
  - [ ] Tokens removed from localStorage

#### Database Verification

- [ ] **Users Table**
  - [ ] New users created on registration
  - [ ] Password is hashed (not plain text)
  - [ ] Email is unique (duplicates rejected)
  - [ ] Timestamps are set correctly

- [ ] **Refresh Tokens Table**
  - [ ] New token created on login/register
  - [ ] Token is stored correctly
  - [ ] `is_revoked` = false for active tokens
  - [ ] `is_revoked` = true after logout
  - [ ] Old tokens revoked after refresh

#### API Responses

- [ ] **Success Responses**
  - [ ] All have `success: true`
  - [ ] All have `data` field
  - [ ] Correct HTTP status codes (200, 201)

- [ ] **Error Responses**
  - [ ] All have `success: false`
  - [ ] All have `message` field
  - [ ] Correct HTTP status codes (400, 401, 500)

#### UI/UX

- [ ] **Responsive Design**
  - [ ] Login page looks good on desktop
  - [ ] Login page looks good on mobile
  - [ ] Dashboard looks good on desktop
  - [ ] Dashboard looks good on mobile

- [ ] **Loading States**
  - [ ] Login button shows "Signing in..." while loading
  - [ ] Register button shows "Creating account..." while loading
  - [ ] Buttons disabled during loading

- [ ] **Error Feedback**
  - [ ] Toast notifications appear for errors
  - [ ] Toast notifications disappear after delay
  - [ ] Error messages are user-friendly

#### Browser Testing

- [ ] **Console Errors**
  - [ ] No errors in browser console
  - [ ] No warnings (except React dev warnings)

- [ ] **Network Requests**
  - [ ] All API calls have correct headers
  - [ ] Authorization header includes "Bearer " prefix
  - [ ] Refresh token flow works on 401 errors

- [ ] **localStorage**
  - [ ] Tokens stored after login
  - [ ] Tokens updated after refresh
  - [ ] Tokens removed after logout

---

## Confidence Score: 9/10

**Reasoning:**

This PRP has very high confidence because it's based directly on the comprehensive implementation guide in CLAUDE.md (Phase 1), which provides complete, tested code. The implementation is straightforward with clear, sequential steps.

**Areas of High Confidence:**

- ✅ **Complete Code Provided**: Every single file has full implementation code from CLAUDE.md
- ✅ **Well-Established Pattern**: Flask + React + JWT authentication is industry-standard
- ✅ **Clear Dependencies**: All package versions specified in CLAUDE.md
- ✅ **Step-by-Step Validation**: Each step has verification commands
- ✅ **Error Handling**: Common errors documented with solutions
- ✅ **Database Schema**: Tables clearly defined with proper relationships

**Areas of Concern (Minor):**

- ⚠️ **bcrypt on Windows**: May require C++ build tools - documented in gotchas
- ⚠️ **MySQL Configuration**: User must have MySQL installed and running - pre-requisite
- ⚠️ **Environment Variables**: Must be set correctly - has validation steps

**Why Not 10/10:**

The only uncertainty is environmental setup (MySQL, Python, Node.js versions) which can vary by system. However, this is mitigated by:
- Clear prerequisite documentation in INITIAL.md
- Detailed troubleshooting section in CLAUDE.md
- Validation gates to catch issues early

**Recommendations:**

1. **Before Starting**: Verify all prerequisites (Python 3.10+, Node 18+, MySQL 8.0+)
2. **Follow Order**: Complete backend fully before starting frontend
3. **Test After Each Section**: Use validation gates to catch issues early
4. **Check Logs**: Both backend terminal and browser console for errors
5. **Database Backup**: Take MySQL backup before migrations

**Risk Mitigation:**

- Each major section has validation gates
- Common errors documented with solutions
- Can test backend independently before frontend
- Database migrations can be rolled back if needed

---

## Next Steps After Implementation

### 1. Verify Everything Works

```bash
# Backend health check
curl http://localhost:5000/api/auth/me

# Frontend load check
# Open http://localhost:5173 and check console

# Database check
mysql -u root -p voice_flow -e "SELECT COUNT(*) FROM users;"
```

### 2. Create First Admin User

```bash
# Via API
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yourdomain.com","password":"SecurePass123!","first_name":"Admin","last_name":"User"}'
```

### 3. Prepare for Phase 2

Phase 2 will add:
- Team models (teams, team_members, team_invitations)
- Report template models (report_templates, template_fields)
- Analysis models (call_analyses, reports, report_field_values)

Before starting Phase 2:
- [ ] Ensure Phase 1 authentication works perfectly
- [ ] Commit Phase 1 code to git
- [ ] Create new branch for Phase 2
- [ ] Review CLAUDE.md Phase 2 documentation

### 4. Documentation

- [ ] Update README.md with setup instructions
- [ ] Document any environment-specific setup steps
- [ ] Add screenshots of working app (optional)

### 5. Git Setup (if not done)

```bash
# Initialize git
cd voice_flow
git init

# Add .gitignore (already created in backend/ and frontend/)
# Create root .gitignore:
echo "backend/.env" >> .gitignore
echo "frontend/.env" >> .gitignore
echo ".DS_Store" >> .gitignore

# Initial commit
git add .
git commit -m "Phase 1: Initial project setup with authentication

- Backend: Flask app with JWT authentication
- Frontend: React app with protected routes
- Database: MySQL with users and refresh_tokens tables
- Features: Register, Login, Logout, Token Refresh

🤖 Generated from PRP: initial_project_setup_prp.md"
```

---

## References

- **CLAUDE.md** (Lines 600-1300): Complete Phase 1 implementation code
- **INITIAL.md**: Prerequisites and quick start guide
- **examples/backend/**: Model and service patterns
- **examples/frontend/**: Component patterns
- **Flask Documentation**: https://flask.palletsprojects.com/
- **React Documentation**: https://react.dev/
- **SQLAlchemy**: https://docs.sqlalchemy.org/
- **PyJWT**: https://pyjwt.readthedocs.io/
- **Axios**: https://axios-http.com/docs/intro

---

## Troubleshooting Common Issues

### Backend Issues

**Issue: `ModuleNotFoundError: No module named 'flask'`**
```bash
# Solution: Activate virtual environment
cd backend
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
pip install -r requirements.txt
```

**Issue: `sqlalchemy.exc.OperationalError: (pymysql.err.OperationalError) (1045, "Access denied")`**
```bash
# Solution: Check DATABASE_URL in .env
# Ensure MySQL user and password are correct
mysql -u root -p  # Test MySQL login
```

**Issue: `bcrypt.hashpw() TypeError`**
```bash
# Solution: Ensure password is encoded to bytes
# Code already handles this: password.encode('utf-8')
```

**Issue: CORS errors in browser**
```bash
# Solution: Check FRONTEND_URL in backend/.env matches frontend URL exactly
# Default should be: FRONTEND_URL=http://localhost:5173
```

### Frontend Issues

**Issue: `Uncaught ReferenceError: process is not defined`**
```bash
# Solution: Use import.meta.env, not process.env
# Already implemented in code
```

**Issue: Blank page, no errors**
```bash
# Solution: Check browser console (F12)
# Common: API_BASE_URL incorrect in .env
```

**Issue: `Failed to fetch` errors**
```bash
# Solution: Ensure backend is running on port 5000
# Check: curl http://localhost:5000/api/auth/me
```

**Issue: Token refresh loop (infinite 401s)**
```bash
# Solution: Check _retry flag in axios interceptor
# Already implemented in code
```

### Database Issues

**Issue: Migration fails**
```bash
# Solution: Reset migrations (development only!)
rm -rf migrations/
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

**Issue: Table already exists**
```bash
# Solution: Drop and recreate database
mysql -u root -p
DROP DATABASE voice_flow;
CREATE DATABASE voice_flow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
# Then run migrations again
```

---

**END OF PRP**
