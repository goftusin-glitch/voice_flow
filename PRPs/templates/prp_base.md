# PRP Template: {Feature Name}

**Generated**: {Date}
**Requested by**: {User}
**Confidence Score**: {1-10}

---

## Critical Context

### Existing Patterns

**Backend Architecture:**
- **Models** (app/models/): SQLAlchemy ORM, relationships via foreign keys
- **Services** (app/services/): Business logic layer, called by routes
- **Routes** (app/routes/): Flask blueprints, RESTful API endpoints
- **Middleware** (app/middleware/): auth_middleware.py for JWT validation

**Frontend Architecture:**
- **Types** (src/types/): TypeScript interfaces for type safety
- **Services** (src/services/): Axios-based API clients
- **Context** (src/context/): React Context for global state
- **Components** (src/components/): Functional components with hooks
- **Pages** (src/pages/): Route-level components

**Database Patterns:**
- All tables use INT primary keys with AUTO_INCREMENT
- Foreign keys use ON DELETE CASCADE
- Timestamps: created_at, updated_at (auto-managed)
- Indexes on all foreign keys and frequently queried columns
- JSON columns for flexible data (field_options, etc.)

**Authentication:**
- JWT tokens in Authorization header: `Bearer <token>`
- Access tokens: 1 hour expiry
- Refresh tokens: 30 days expiry, stored in database
- All protected routes use `@token_required` decorator

**API Response Format:**
```json
{
  "success": true/false,
  "data": {...} or "message": "..."
}
```

### Key Dependencies

**Backend Dependencies:**
- Flask 3.0 (web framework)
- SQLAlchemy 3.1 (ORM)
- PyMySQL 1.1 (MySQL driver)
- PyJWT 2.8 (JWT tokens)
- bcrypt 4.1 (password hashing)
- openai 1.6 (Whisper + GPT-4)
- pydub 0.25 (audio processing)
- sendgrid 6.11 (email)
- reportlab 4.0 (PDF generation)

**Frontend Dependencies:**
- React 18.2
- TypeScript 5.3
- Vite 5.0 (build tool)
- React Router DOM 6.21 (routing)
- Axios 1.6 (HTTP client)
- Tailwind CSS 3.4 (styling)
- react-hook-form 7.49 (forms)
- react-hot-toast 2.4 (notifications)
- lucide-react 0.303 (icons)

**Database:**
- MySQL 8.0+
- Character set: utf8mb4
- Collation: utf8mb4_unicode_ci

### External Resources

**Documentation:**
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

**Reference Implementation Files:**
- Backend Auth: `backend/app/routes/auth.py`, `backend/app/services/auth_service.py`
- Frontend Auth: `frontend/src/context/AuthContext.tsx`, `frontend/src/services/authService.ts`
- Database Models: `backend/app/models/user.py`

### Code Conventions

**Backend:**
- Use Flask blueprints for route organization
- Business logic in services, not routes
- Return JSON with success/data format
- Use `@token_required` decorator for protected routes
- Error handling with try/except, return proper status codes
- SQLAlchemy models with `to_dict()` method
- Database queries use ORM, not raw SQL

**Frontend:**
- Functional components with TypeScript
- Hooks for state and side effects
- Context API for global state (AuthContext, etc.)
- Axios for API calls via apiClient
- Tailwind CSS for styling
- react-hot-toast for notifications
- React Router for navigation
- Types defined in src/types/

**Naming Conventions:**
- Backend: snake_case for functions, PascalCase for classes
- Frontend: camelCase for variables/functions, PascalCase for components
- Database: snake_case for tables and columns
- API routes: kebab-case (e.g., /api/auth/refresh-token)

### Gotchas

1. **JWT Token Refresh**: Implement automatic token refresh in axios interceptor
2. **CORS Configuration**: Must whitelist frontend URL in Flask-CORS
3. **File Uploads**: Use FormData for multipart/form-data
4. **OpenAI API Costs**: Whisper + GPT-4 can be expensive, monitor usage
5. **Team Access**: All queries must filter by team_id for proper access control
6. **Audio File Formats**: Convert to MP3 before sending to Whisper
7. **Database Migrations**: Always use `flask db migrate` and `flask db upgrade`
8. **Type Safety**: Define TypeScript interfaces for all API responses
9. **Error Boundaries**: Wrap components in error boundaries for graceful failures
10. **MySQL JSON Columns**: Use JSON.loads/dumps for field_options

---

## Implementation Blueprint

### Database Changes

#### New Table: {table_name}

```sql
CREATE TABLE {table_name} (
    id INT PRIMARY KEY AUTO_INCREMENT,
    -- Add columns here
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- Foreign keys
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- Indexes
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Modify Existing Table (if applicable)

```sql
ALTER TABLE {table_name}
ADD COLUMN {column_name} {type} {constraints};

-- Add index if needed
CREATE INDEX idx_{column_name} ON {table_name}({column_name});
```

### Backend Implementation

#### 1. Models (app/models/)

**File**: `backend/app/models/{model_name}.py`

```python
from app import db
from datetime import datetime

class {ModelName}(db.Model):
    __tablename__ = '{table_name}'

    id = db.Column(db.Integer, primary_key=True)
    # Add columns
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    # Examples:
    # user = db.relationship('User', backref='{plural_name}', lazy=True)

    def to_dict(self):
        """Convert model to dictionary"""
        return {
            'id': self.id,
            # Add fields
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
```

#### 2. Services (app/services/)

**File**: `backend/app/services/{service_name}_service.py`

```python
from app import db
from app.models.{model_name} import {ModelName}

class {ServiceName}Service:
    @staticmethod
    def {method_name}({parameters}):
        """
        {Description of what this method does}

        Args:
            {param}: {description}

        Returns:
            {return_type}: {description}

        Raises:
            ValueError: {when this is raised}
        """
        try:
            # Implementation
            pass
        except Exception as e:
            raise ValueError(f"Error: {str(e)}")
```

**Methods to implement:**
- `create_{entity}(...)` - Create new record
- `get_{entity}(id)` - Get single record
- `get_all_{entities}(filters)` - Get multiple records
- `update_{entity}(id, data)` - Update record
- `delete_{entity}(id)` - Delete record

#### 3. Routes (app/routes/)

**File**: `backend/app/routes/{route_name}.py`

```python
from flask import Blueprint, request, jsonify
from app.services.{service_name}_service import {ServiceName}Service
from app.middleware.auth_middleware import token_required

{route_name}_bp = Blueprint('{route_name}', __name__)

@{route_name}_bp.route('/', methods=['GET'])
@token_required
def list_{entities}(current_user):
    """List all {entities}"""
    try:
        # Parse query parameters
        page = request.args.get('page', 1, type=int)
        limit = request.args.get('limit', 20, type=int)

        # Call service
        result = {ServiceName}Service.get_all_{entities}(
            user_id=current_user.id,
            page=page,
            limit=limit
        )

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@{route_name}_bp.route('/<int:id>', methods=['GET'])
@token_required
def get_{entity}(current_user, id):
    """Get single {entity}"""
    try:
        result = {ServiceName}Service.get_{entity}(id, current_user.id)

        if not result:
            return jsonify({
                'success': False,
                'message': '{Entity} not found'
            }), 404

        return jsonify({
            'success': True,
            'data': result
        }), 200

    except Exception as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 500

@{route_name}_bp.route('/', methods=['POST'])
@token_required
def create_{entity}(current_user):
    """Create new {entity}"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['field1', 'field2']
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'{field} is required'
                }), 400

        # Call service
        result = {ServiceName}Service.create_{entity}(
            user_id=current_user.id,
            **data
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
            'message': str(e)
        }), 500
```

**Don't forget to register blueprint in `app/__init__.py`**:
```python
from app.routes.{route_name} import {route_name}_bp
app.register_blueprint({route_name}_bp, url_prefix='/api/{route-name}')
```

### Frontend Implementation

#### 1. Types (src/types/)

**File**: `frontend/src/types/{type_name}.ts`

```typescript
export interface {TypeName} {
  id: number;
  // Add fields with correct types
  created_at: string;
  updated_at?: string;
}

export interface Create{TypeName}Request {
  // Fields for creation (no id, timestamps)
}

export interface Update{TypeName}Request {
  // Fields that can be updated
}

export interface {TypeName}Response {
  success: boolean;
  data: {TypeName};
}

export interface {TypeName}ListResponse {
  success: boolean;
  data: {
    {plural_name}: {TypeName}[];
    total: number;
    page: number;
    pages: number;
  };
}
```

#### 2. Services (src/services/)

**File**: `frontend/src/services/{service_name}Service.ts`

```typescript
import { apiClient } from './api';
import { {TypeName}, {TypeName}Response, {TypeName}ListResponse } from '../types/{type_name}';

class {ServiceName}Service {
  async getAll(page = 1, limit = 20): Promise<{TypeName}[]> {
    const response = await apiClient.get<{TypeName}ListResponse>(
      `/{route-name}?page=${page}&limit=${limit}`
    );
    return response.data.data.{plural_name};
  }

  async getById(id: number): Promise<{TypeName}> {
    const response = await apiClient.get<{TypeName}Response>(`/{route-name}/${id}`);
    return response.data.data;
  }

  async create(data: Create{TypeName}Request): Promise<{TypeName}> {
    const response = await apiClient.post<{TypeName}Response>('/{route-name}', data);
    return response.data.data;
  }

  async update(id: number, data: Update{TypeName}Request): Promise<{TypeName}> {
    const response = await apiClient.put<{TypeName}Response>(`/{route-name}/${id}`, data);
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/{route-name}/${id}`);
  }
}

export const {serviceName}Service = new {ServiceName}Service();
```

#### 3. Components (src/components/)

**Component Hierarchy:**
```
{FeatureName}/
├── {ComponentName}List.tsx        # List view
├── {ComponentName}Card.tsx        # Individual item
├── {ComponentName}Form.tsx        # Create/edit form
├── {ComponentName}Modal.tsx       # Modal for details
└── {ComponentName}Filters.tsx    # Filter controls (if needed)
```

**Example Component**: `frontend/src/components/{feature}/{Component}.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { {TypeName} } from '../../types/{type_name}';
import { {serviceName}Service } from '../../services/{service_name}Service';
import toast from 'react-hot-toast';

interface {ComponentName}Props {
  // Define props
}

export const {ComponentName}: React.FC<{ComponentName}Props> = ({ props }) => {
  const [data, setData] = useState<{TypeName}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await {serviceName}Service.getAll();
      setData(result);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{Feature Name}</h2>
      {/* Component JSX */}
    </div>
  );
};
```

#### 4. Pages (src/pages/)

**File**: `frontend/src/pages/{PageName}.tsx`

```typescript
import React from 'react';
import { {ComponentName} } from '../components/{feature}/{ComponentName}';

export const {PageName}: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <{ComponentName} />
    </div>
  );
};
```

**Add route in `App.tsx`:**
```typescript
import { {PageName} } from './pages/{PageName}';

// In Routes:
<Route
  path="/{route-path}"
  element={
    <ProtectedRoute>
      <{PageName} />
    </ProtectedRoute>
  }
/>
```

### Step-by-Step Implementation Order

1. **Database Schema** ✓
   - [ ] Create migration file: `flask db migrate -m "Add {feature}"`
   - [ ] Review generated migration
   - [ ] Run migration: `flask db upgrade`
   - [ ] Verify in MySQL: `SHOW CREATE TABLE {table_name};`

2. **Backend Models** ✓
   - [ ] Create `backend/app/models/{model_name}.py`
   - [ ] Define model class with all columns
   - [ ] Define relationships
   - [ ] Add `to_dict()` method
   - [ ] Import in `backend/app/models/__init__.py`

3. **Backend Services** ✓
   - [ ] Create `backend/app/services/{service_name}_service.py`
   - [ ] Implement CRUD methods
   - [ ] Add business logic
   - [ ] Handle errors with try/except
   - [ ] Return appropriate data structures

4. **Backend Routes** ✓
   - [ ] Create `backend/app/routes/{route_name}.py`
   - [ ] Define blueprint
   - [ ] Implement GET endpoints (list, single)
   - [ ] Implement POST endpoints (create)
   - [ ] Implement PUT endpoints (update)
   - [ ] Implement DELETE endpoints
   - [ ] Add `@token_required` decorator
   - [ ] Register blueprint in `app/__init__.py`

5. **Backend Testing** ✓
   - [ ] Start backend: `python run.py`
   - [ ] Test endpoints with curl or Postman
   - [ ] Verify responses match expected format
   - [ ] Test error cases

6. **Frontend Types** ✓
   - [ ] Create `frontend/src/types/{type_name}.ts`
   - [ ] Define interfaces matching backend responses
   - [ ] Export all types

7. **Frontend Services** ✓
   - [ ] Create `frontend/src/services/{service_name}Service.ts`
   - [ ] Implement API client methods
   - [ ] Handle errors appropriately
   - [ ] Export service instance

8. **Frontend Components** ✓
   - [ ] Create component directory
   - [ ] Implement list component
   - [ ] Implement card/item component
   - [ ] Implement form component (if needed)
   - [ ] Implement modal component (if needed)
   - [ ] Add loading states
   - [ ] Add error handling
   - [ ] Style with Tailwind CSS

9. **Frontend Pages** ✓
   - [ ] Create page component
   - [ ] Compose with components
   - [ ] Add to routing in App.tsx
   - [ ] Add navigation link (if needed)

10. **Integration Testing** ✓
    - [ ] Test full user flow
    - [ ] Verify data persists
    - [ ] Test error scenarios
    - [ ] Check responsive design
    - [ ] Verify all validation works

### Error Handling

**Backend Error Patterns:**
```python
# Validation errors
if not required_field:
    return jsonify({'success': False, 'message': 'Field is required'}), 400

# Not found errors
if not entity:
    return jsonify({'success': False, 'message': 'Entity not found'}), 404

# Permission errors
if entity.user_id != current_user.id:
    return jsonify({'success': False, 'message': 'Permission denied'}), 403

# Server errors
except Exception as e:
    return jsonify({'success': False, 'message': 'Internal server error'}), 500
```

**Frontend Error Patterns:**
```typescript
try {
  const result = await service.method();
  toast.success('Success message');
} catch (error: any) {
  const message = error.response?.data?.message || 'Operation failed';
  toast.error(message);
}
```

### Testing Strategy

**Backend Tests** (tests/test_{feature}.py):
```python
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

def test_{operation}(client, auth_headers):
    response = client.post('/api/{route}',
        json={...},
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json['success'] == True
```

**Frontend Tests** (src/components/{feature}/__tests__/):
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { {ComponentName} } from '../{ComponentName}';

describe('{ComponentName}', () => {
  it('renders correctly', () => {
    render(<{ComponentName} />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

---

## Validation Gates

### Backend Validation

```bash
# 1. Database Migration
cd backend
flask db migrate -m "Add {feature}"
flask db upgrade

# Verify migration succeeded
flask db current
mysql -u root -p voice_flow -e "DESCRIBE {table_name};"

# 2. Run Backend Tests
pytest tests/test_{feature}.py -v

# 3. Type Checking (if using type hints)
mypy app/

# 4. Linting
flake8 app/ --max-line-length=100
pylint app/

# 5. Start backend and test manually
python run.py
# Use curl or Postman to test endpoints
```

### Frontend Validation

```bash
# 1. Type Checking
cd frontend
npm run type-check
# or
npx tsc --noEmit

# 2. Linting
npm run lint
# or
npx eslint src/

# 3. Run Tests
npm test
# or
npm run test:coverage

# 4. Build Check
npm run build

# 5. Start frontend and test manually
npm run dev
# Navigate to http://localhost:5173
```

### Manual Testing Checklist

- [ ] **Feature works as expected**
  - [ ] Can create new {entity}
  - [ ] Can view list of {entities}
  - [ ] Can view single {entity} details
  - [ ] Can update {entity}
  - [ ] Can delete {entity}

- [ ] **Error cases handled gracefully**
  - [ ] Invalid input shows error message
  - [ ] Missing required fields shows validation
  - [ ] Not found errors show 404 message
  - [ ] Permission errors show 403 message
  - [ ] Server errors show generic error message

- [ ] **UI is responsive**
  - [ ] Works on desktop
  - [ ] Works on tablet
  - [ ] Works on mobile
  - [ ] Loading states show correctly
  - [ ] Buttons disabled during operations

- [ ] **API returns correct data**
  - [ ] Response format matches documentation
  - [ ] All fields present
  - [ ] Data types correct
  - [ ] Relationships loaded correctly

- [ ] **Database updates correctly**
  - [ ] Records created with correct data
  - [ ] Updates persist
  - [ ] Deletes remove records
  - [ ] Foreign keys maintained
  - [ ] Timestamps updated

- [ ] **Authentication works**
  - [ ] Protected routes require login
  - [ ] JWT tokens validated
  - [ ] Token refresh works
  - [ ] Unauthorized users get 401

- [ ] **Team access control works** (if applicable)
  - [ ] Users only see their team's data
  - [ ] Cross-team access blocked
  - [ ] Team members can collaborate
  - [ ] Proper filtering by team_id

### Integration Test Flow

```bash
# 1. Start both servers
cd backend && python run.py &
cd frontend && npm run dev &

# 2. Open browser to http://localhost:5173
# 3. Login with test account
# 4. Navigate to new feature
# 5. Test complete user flow:
#    - Create
#    - View list
#    - View details
#    - Update
#    - Delete
#    - Error cases

# 6. Check browser console for errors
# 7. Check backend logs for errors
# 8. Verify database has correct data
```

---

## Confidence Score: {X}/10

**Reasoning:**
{Explain what makes you confident or what concerns remain}

**Areas of High Confidence:**
- {List areas where implementation path is clear}

**Areas of Concern:**
- {List areas that may need extra attention}

**Recommendations:**
- {Suggestions for mitigating concerns}
- {Additional testing or validation needed}

---

## Next Steps After Implementation

1. **Documentation**
   - [ ] Update API documentation
   - [ ] Add code comments where complex
   - [ ] Update CLAUDE.md if new patterns introduced
   - [ ] Add examples to examples/ directory

2. **Optimization** (if needed)
   - [ ] Add database indexes
   - [ ] Optimize queries
   - [ ] Add caching if appropriate
   - [ ] Reduce API payload sizes

3. **Enhancement** (future)
   - [ ] Add pagination if lists grow large
   - [ ] Add search/filter capabilities
   - [ ] Add sorting options
   - [ ] Add bulk operations

4. **Monitoring**
   - [ ] Add logging for important operations
   - [ ] Monitor API response times
   - [ ] Track error rates
   - [ ] Monitor database performance

---

## References

- CLAUDE.md: Global conventions and patterns
- INITIAL.md: Original feature request
- examples/: Reference implementations
- OpenAI API Docs: https://platform.openai.com/docs
- Flask Docs: https://flask.palletsprojects.com/
- React Docs: https://react.dev/
