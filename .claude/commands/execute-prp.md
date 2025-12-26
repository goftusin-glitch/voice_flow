# Execute PRP Command

Execute a generated PRP (Product Requirements Prompt) with systematic validation at each step.

## Usage

```
/execute-prp PRPs/{feature-name}_prp.md
```

## Process

### Phase 1: PRP Analysis

1. **Read the PRP document**
   - Use the Read tool to load the entire PRP
   - Parse into sections: Context, Blueprint, Validation Gates

2. **Understand the scope**
   - Identify all files that will be created/modified
   - Note dependencies and integration points
   - Review validation requirements

3. **Create implementation checklist**
   - Break down the blueprint into atomic tasks
   - Order tasks by dependencies
   - Identify validation checkpoints

### Phase 2: Implementation

Execute the blueprint systematically:

#### Step Format
For each implementation step:

1. **Announce the step**
   ```
   📝 Implementing: [Step description]
   Files: [List of files to modify/create]
   ```

2. **Use appropriate tools**
   - **Read**: For understanding existing code (use Serena MCP when possible)
     - `mcp__serena__get_symbols_overview` for file structure
     - `mcp__serena__find_symbol` for specific symbols
   - **Write**: For creating new files
   - **Edit**: For modifying existing files (use Serena MCP when possible)
     - `mcp__serena__replace_symbol_body` for replacing functions/classes
     - `mcp__serena__insert_after_symbol` for adding new code
   - **Bash**: For running commands (migrations, tests)

3. **Implement the change**
   - Follow the PRP blueprint exactly
   - Use code examples from PRP
   - Maintain existing patterns

4. **Immediate validation**
   - Check syntax (for code files)
   - Verify the change was applied correctly
   - Run relevant tests if specified in PRP

5. **Update progress**
   - Use TodoWrite to mark step as completed
   - Note any deviations from plan
   - Document any issues encountered

#### Implementation Order

1. **Database Layer** (if applicable)
   - Create/modify models
   - Generate and run migrations
   - Verify database schema

2. **Backend Layer**
   - Create/modify services (business logic)
   - Create/modify routes (API endpoints)
   - Add error handling
   - Run backend tests

3. **Frontend Layer**
   - Create TypeScript types
   - Create API service methods
   - Create/modify components
   - Create/modify pages
   - Run frontend tests

4. **Integration**
   - Test full flow end-to-end
   - Verify all validation gates
   - Check error handling

### Phase 3: Validation Gates

After each major section (Database, Backend, Frontend):

1. **Run validation commands** from PRP
   ```bash
   # Example for backend
   pytest tests/test_feature.py -v
   ```

2. **Check output**
   - All tests pass: ✅ Proceed
   - Tests fail: 🔴 Fix issues before continuing

3. **Manual validation**
   - Test the feature in browser (for frontend)
   - Test API with curl/Postman (for backend)
   - Verify database changes (for models)

4. **Report validation results**
   ```
   ✅ Backend Validation: PASSED
   - All tests passed
   - API responds correctly
   - Error handling works

   ✅ Frontend Validation: PASSED
   - Component renders correctly
   - API calls work
   - Error states handled

   ✅ Integration Validation: PASSED
   - Full user flow works
   - Data persists correctly
   - UI updates appropriately
   ```

### Phase 4: Completion & Verification

1. **Final validation sweep**
   - Run all validation commands from PRP
   - Test all user flows manually
   - Verify against original requirements

2. **Documentation update**
   - Update CLAUDE.md if new patterns introduced
   - Update API documentation if endpoints added
   - Add examples to examples/ if helpful

3. **Create completion report**
   ```markdown
   # Implementation Report: {Feature Name}

   ## Completed
   - [List of all implemented items]

   ## Files Modified/Created
   - backend/app/models/feature.py (created)
   - backend/app/services/feature_service.py (created)
   - backend/app/routes/feature.py (created)
   - frontend/src/types/feature.ts (created)
   - frontend/src/pages/Feature.tsx (created)

   ## Validation Results
   - Backend tests: ✅ 15/15 passed
   - Frontend tests: ✅ 8/8 passed
   - Manual testing: ✅ All flows working

   ## Notes
   - [Any deviations from PRP]
   - [Issues encountered and how resolved]
   - [Suggestions for improvement]

   ## Next Steps
   - [Optional: Follow-up tasks]
   - [Optional: Additional features to consider]
   ```

4. **Ask user for feedback**
   ```
   ✅ Feature implementation complete!

   Summary:
   - X files created/modified
   - All validation gates passed
   - Feature is ready for use

   Would you like to:
   1. Test the feature yourself
   2. Implement additional related features
   3. Optimize or refactor anything
   ```

## Error Handling

If errors occur during implementation:

1. **Pause execution**
   - Don't continue to next step
   - Analyze the error

2. **Diagnose**
   - Use Serena MCP tools to understand context
   - Check error messages carefully
   - Review PRP for guidance

3. **Fix or escalate**
   - If fixable: Apply fix and retry
   - If unclear: Ask user for guidance
   - If PRP issue: Update PRP and restart

4. **Document resolution**
   - Note what went wrong
   - Note how it was fixed
   - Update PRP if needed

## Notes for AI Assistant

- **Follow the PRP exactly** - don't improvise unless necessary
- **Validate frequently** - catch errors early
- **Use Serena MCP tools** for code analysis and modification when possible
- **Be systematic** - complete one step fully before moving to next
- **Communicate progress** - keep user informed at each major step
- **Handle errors gracefully** - don't leave implementation half-done
- **Think about the full stack** - ensure database, backend, and frontend are in sync

## Validation Command Reference

### Backend
```bash
# Database migrations
flask db migrate -m "Description"
flask db upgrade

# Run specific tests
pytest tests/test_feature.py -v

# Run all tests
pytest

# Type checking
mypy app/

# Linting
flake8 app/
pylint app/
```

### Frontend
```bash
# Type checking
npm run type-check
npx tsc --noEmit

# Linting
npm run lint
npx eslint src/

# Tests
npm test
npm run test:coverage

# Build verification
npm run build
npm run preview
```

### Full Stack
```bash
# Start backend
cd backend && python run.py

# Start frontend (separate terminal)
cd frontend && npm run dev

# Database status
flask db current
mysql -u user -p voice_flow -e "SHOW TABLES;"
```

## Success Criteria

Implementation is complete when:
- [ ] All code changes implemented per PRP
- [ ] All validation gates passed
- [ ] Manual testing confirms functionality
- [ ] No errors in console (frontend)
- [ ] No errors in logs (backend)
- [ ] Database schema updated correctly
- [ ] API endpoints working as expected
- [ ] User flows working end-to-end
- [ ] Error handling working correctly
- [ ] Code follows existing patterns
- [ ] Tests passing
- [ ] User satisfied with result
