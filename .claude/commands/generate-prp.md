# Generate PRP Command

Generate a comprehensive Product Requirements Prompt (PRP) for implementing a feature in the Call Analyzer application.

## Usage

```
/generate-prp path/to/feature-request.md
```

## Process

### Phase 1: Research (CRITICAL)

**Codebase Analysis**
- Search for similar existing features using Serena MCP tools:
  - Use `mcp__serena__find_symbol` to locate relevant classes, functions, and components
  - Use `mcp__serena__search_for_pattern` to find implementation patterns
  - Use `mcp__serena__get_symbols_overview` to understand file structures
  - Use `mcp__serena__find_referencing_symbols` to trace dependencies
- Document existing patterns found in:
  - Backend: models, services, routes structure
  - Frontend: components, pages, hooks, services structure
  - Database: schema patterns and relationships
- Note code conventions:
  - Backend: Flask blueprints, SQLAlchemy models, service layer pattern
  - Frontend: React functional components, TypeScript types, Context API
  - API: RESTful conventions, request/response formats

**External Research**
- Gather documentation from:
  - OpenAI API docs (Whisper, GPT-4)
  - Flask documentation
  - React + TypeScript patterns
  - SQLAlchemy ORM patterns
- Identify relevant libraries and their usage patterns
- Note any MCP server capabilities that could help

**User Clarification**
Ask the user about:
- Preferred implementation approach if multiple patterns exist
- Integration points with existing features
- Performance or security requirements
- UI/UX preferences for frontend features
- Data storage and retrieval patterns

### Phase 2: ULTRATHINK Planning

Before generating the PRP, think through:
- How does this feature fit into the existing architecture?
- What existing patterns should be followed?
- What are the critical dependencies?
- What could go wrong?
- What validation is needed?

### Phase 3: Generate PRP

Create a PRP document at `PRPs/{feature-name}_prp.md` with:

#### Section 1: Critical Context
```markdown
## Critical Context

### Existing Patterns
[Document patterns from codebase analysis]

### Key Dependencies
[List files, models, services that will be used/modified]

### External Resources
- [Documentation URLs]
- [Library references]
- [MCP server capabilities]

### Code Conventions
[Specific conventions to follow from CLAUDE.md]

### Gotchas
[Known issues, edge cases, common mistakes]
```

#### Section 2: Implementation Blueprint
```markdown
## Implementation Blueprint

### Database Changes (if applicable)
\`\`\`sql
-- SQL for new tables/columns
\`\`\`

### Backend Implementation
1. Models (app/models/)
   - File: path/to/model.py
   - Classes to create/modify
   - Relationships to define

2. Services (app/services/)
   - File: path/to/service.py
   - Methods to implement
   - Business logic

3. Routes (app/routes/)
   - File: path/to/routes.py
   - Endpoints to create
   - Request/response formats

### Frontend Implementation
1. Types (src/types/)
   - File: path/to/types.ts
   - Interfaces to define

2. Services (src/services/)
   - File: path/to/service.ts
   - API client methods

3. Components (src/components/)
   - Component hierarchy
   - Props and state

4. Pages (src/pages/)
   - Routes to add
   - Page components

### Step-by-Step Implementation Order
1. [Step 1 with file references]
2. [Step 2 with file references]
...

### Error Handling
- Backend: try/except patterns, error responses
- Frontend: error boundaries, user feedback
- API: status codes and messages

### Testing Strategy
- Backend: Unit tests for services, integration tests for routes
- Frontend: Component tests, integration tests
- API: Endpoint tests with various scenarios
```

#### Section 3: Validation Gates
```markdown
## Validation Gates

### Backend Validation
\`\`\`bash
# Database migration
flask db migrate -m "Description"
flask db upgrade

# Run tests
pytest tests/test_feature.py -v

# Type checking (if using)
mypy app/

# Lint
flake8 app/
\`\`\`

### Frontend Validation
\`\`\`bash
# Type checking
npm run type-check

# Lint
npm run lint

# Run tests
npm test

# Build check
npm run build
\`\`\`

### Manual Testing Checklist
- [ ] Feature works as expected
- [ ] Error cases handled gracefully
- [ ] UI is responsive
- [ ] API returns correct data
- [ ] Database updates correctly
- [ ] Authentication works
- [ ] Team access control works (if applicable)
```

### Phase 4: Quality Checklist

Before completing, verify:

- [ ] **Comprehensive Context**: All relevant existing patterns documented
- [ ] **Executable Blueprint**: Clear step-by-step implementation path
- [ ] **Pattern Adherence**: Follows existing code conventions
- [ ] **Validation Gates**: Testable checkpoints at each major step
- [ ] **Error Handling**: Edge cases and error scenarios addressed
- [ ] **File References**: Specific file paths and symbol names included
- [ ] **External Resources**: All documentation links included
- [ ] **Database Migrations**: SQL changes clearly specified
- [ ] **API Design**: Request/response formats documented
- [ ] **User Feedback**: Loading states, errors, success messages

### Confidence Score

Rate your confidence in this PRP (1-10): [X]

**Reasoning**: [Explain what makes you confident or what concerns remain]

## Output

Write the generated PRP to: `PRPs/{feature-name}_prp.md`

Inform the user:
```
✅ PRP generated successfully!

Location: PRPs/{feature-name}_prp.md

Next steps:
1. Review the PRP for accuracy
2. Run: /execute-prp PRPs/{feature-name}_prp.md
3. Follow the implementation steps with validation gates
```

## Notes for AI Assistant

- **Use Serena MCP tools extensively** during research phase
- **Be thorough** in codebase analysis - missing context leads to implementation failures
- **Ask clarifying questions** before generating if requirements are unclear
- **Follow existing patterns** - consistency is more important than perfection
- **Include code examples** from existing codebase where relevant
- **Be specific** about file paths, class names, function names
- **Consider the full stack** - database, backend, frontend, and how they connect
