# Code Examples and Patterns

This directory contains reference implementations and patterns used throughout the Call Analyzer application. Use these as templates when implementing new features.

## Directory Structure

```
examples/
├── README.md                    # This file
├── backend/                     # Backend patterns
│   ├── model_example.py        # SQLAlchemy model pattern
│   ├── service_example.py      # Service layer pattern
│   ├── route_example.py        # Flask route/blueprint pattern
│   └── test_example.py         # Backend testing pattern
└── frontend/                    # Frontend patterns
    ├── component_example.tsx   # React component pattern
    ├── service_example.ts      # API client service pattern
    ├── type_example.ts         # TypeScript type definitions
    └── hook_example.ts         # Custom React hook pattern
```

## When to Use Examples

### Backend Patterns

**Use `model_example.py` when:**
- Creating new database models
- Defining table relationships
- Implementing model methods

**Use `service_example.py` when:**
- Implementing business logic
- Creating reusable service methods
- Handling complex operations

**Use `route_example.py` when:**
- Creating new API endpoints
- Implementing RESTful routes
- Adding authentication to routes

**Use `test_example.py` when:**
- Writing backend tests
- Testing API endpoints
- Mocking dependencies

### Frontend Patterns

**Use `component_example.tsx` when:**
- Creating new React components
- Implementing list/detail views
- Adding loading and error states

**Use `service_example.ts` when:**
- Creating API client methods
- Handling HTTP requests
- Managing response types

**Use `type_example.ts` when:**
- Defining TypeScript interfaces
- Creating type-safe APIs
- Documenting data structures

**Use `hook_example.ts` when:**
- Creating custom React hooks
- Encapsulating reusable logic
- Managing component state

## Key Patterns

### Backend Architecture

1. **Three-Layer Architecture**
   ```
   Routes (API) → Services (Business Logic) → Models (Database)
   ```

2. **Separation of Concerns**
   - Routes: Handle HTTP, validate input, call services
   - Services: Business logic, orchestration, error handling
   - Models: Database schema, relationships, data access

3. **Authentication Flow**
   - JWT token in Authorization header
   - `@token_required` decorator validates token
   - Current user passed to route function

### Frontend Architecture

1. **Component Hierarchy**
   ```
   Pages → Feature Components → Common Components
   ```

2. **State Management**
   - Context API for global state (Auth, Notifications)
   - Component state for local UI state
   - No Redux - keep it simple

3. **API Communication**
   - All API calls through service layer
   - Automatic token refresh in axios interceptor
   - Type-safe with TypeScript interfaces

## Best Practices

### Backend

✅ **Do:**
- Use services for business logic
- Return consistent JSON response format
- Handle errors with try/except
- Use SQLAlchemy ORM (no raw SQL)
- Add database indexes for foreign keys
- Use `@token_required` for protected routes
- Validate input data
- Use proper HTTP status codes

❌ **Don't:**
- Put business logic in routes
- Return inconsistent response formats
- Use raw SQL queries
- Expose sensitive data
- Forget to handle errors
- Skip input validation

### Frontend

✅ **Do:**
- Use TypeScript for type safety
- Define interfaces for all API responses
- Use Context for global state
- Show loading and error states
- Use Tailwind CSS for styling
- Handle errors gracefully with toasts
- Keep components focused and small
- Use custom hooks for reusable logic

❌ **Don't:**
- Use `any` type in TypeScript
- Make direct API calls from components
- Forget error handling
- Skip loading states
- Hard-code values
- Create mega-components
- Duplicate code

## Common Patterns

### CRUD Operations

**Backend Service Pattern:**
```python
class EntityService:
    @staticmethod
    def create(data): ...

    @staticmethod
    def get_all(filters): ...

    @staticmethod
    def get_by_id(id): ...

    @staticmethod
    def update(id, data): ...

    @staticmethod
    def delete(id): ...
```

**Frontend Service Pattern:**
```typescript
class EntityService {
  async getAll(): Promise<Entity[]> { ... }
  async getById(id: number): Promise<Entity> { ... }
  async create(data: CreateRequest): Promise<Entity> { ... }
  async update(id: number, data: UpdateRequest): Promise<Entity> { ... }
  async delete(id: number): Promise<void> { ... }
}
```

### Error Handling

**Backend:**
```python
try:
    result = do_something()
    return jsonify({'success': True, 'data': result}), 200
except ValueError as e:
    return jsonify({'success': False, 'message': str(e)}), 400
except Exception as e:
    return jsonify({'success': False, 'message': 'Internal error'}), 500
```

**Frontend:**
```typescript
try {
  const data = await service.method();
  toast.success('Success!');
} catch (error: any) {
  toast.error(error.response?.data?.message || 'Operation failed');
}
```

### Loading States

**Backend (Long Operations):**
```python
# For long operations, consider:
# 1. Streaming responses
# 2. Background tasks (Celery)
# 3. Progress tracking
```

**Frontend:**
```typescript
const [loading, setLoading] = useState(false);

const loadData = async () => {
  setLoading(true);
  try {
    const data = await service.getData();
    setData(data);
  } finally {
    setLoading(false);
  }
};

if (loading) return <LoadingSpinner />;
```

## Testing Patterns

### Backend Testing
```python
# Fixture for test client
@pytest.fixture
def client():
    app = create_app('testing')
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

# Test endpoint
def test_endpoint(client):
    response = client.post('/api/endpoint', json={...})
    assert response.status_code == 200
    assert response.json['success'] == True
```

### Frontend Testing
```typescript
import { render, screen } from '@testing-library/react';

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component />);
    expect(screen.getByText('...')).toBeInTheDocument();
  });
});
```

## Reference Implementations

Refer to these existing implementations for patterns:

**Backend:**
- Authentication: `backend/app/routes/auth.py`
- User Management: `backend/app/models/user.py`
- Service Layer: `backend/app/services/auth_service.py`

**Frontend:**
- Authentication: `frontend/src/context/AuthContext.tsx`
- API Client: `frontend/src/services/api.ts`
- Protected Routes: `frontend/src/components/common/ProtectedRoute.tsx`

## Contributing New Examples

When adding new examples:
1. Use clear, descriptive names
2. Add comprehensive comments
3. Follow existing code style
4. Include error handling
5. Update this README
6. Reference in CLAUDE.md if it establishes a new pattern
