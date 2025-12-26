# Call Analyzer - Context Engineering Project

A full-stack AI-powered call analysis application built with React + Flask, featuring OpenAI Whisper for transcription and GPT-4 for intelligent analysis.

## 🎯 Quick Links

- **[INITIAL.md](./INITIAL.md)** - Feature request template
- **[CLAUDE.md](./CLAUDE.md)** - Complete implementation guide
- **[.claude/commands/](./.claude/commands/)** - Custom commands
- **[PRPs/](./PRPs/)** - Product Requirements Prompts
- **[examples/](./examples/)** - Code patterns and examples

## 📚 Documentation Structure

This project uses Context Engineering principles to provide comprehensive, explicit context for AI coding assistants.

```
voice_flow/
├── README.md                    # This file - project overview
├── INITIAL.md                   # Feature request template
├── CLAUDE.md                    # Complete implementation guide
│
├── .claude/commands/            # Custom slash commands
│   ├── generate-prp.md         # Generate implementation plans
│   ├── execute-prp.md          # Execute implementation plans
│   └── analyze-call.md         # Test call analysis flow
│
├── PRPs/                        # Product Requirements Prompts
│   └── templates/
│       └── prp_base.md         # PRP template
│
├── examples/                    # Reference implementations
│   ├── backend/                # Backend code patterns
│   └── frontend/               # Frontend code patterns
│
├── backend/                     # Flask backend
└── frontend/                    # React frontend
```

## 🚀 Getting Started

### For Developers

1. **Read** [INITIAL.md](./INITIAL.md) for quick setup guide
2. **Follow** setup instructions for backend and frontend
3. **Review** [examples/](./examples/) for code patterns

### For AI Assistants

1. **Read** [CLAUDE.md](./CLAUDE.md) for complete context
2. **Use** custom commands in `.claude/commands/`
3. **Generate** PRPs for new features
4. **Reference** existing examples

## 🛠️ Custom Commands

Use these commands to streamline development:

### `/generate-prp`

Generate a comprehensive Product Requirements Prompt for a feature.

```bash
/generate-prp path/to/feature-request.md
```

This command:
- Analyzes existing codebase using Serena MCP
- Gathers relevant documentation
- Asks clarifying questions
- Generates detailed implementation blueprint

### `/execute-prp`

Execute a generated PRP with systematic validation.

```bash
/execute-prp PRPs/feature-name_prp.md
```

This command:
- Follows step-by-step implementation plan
- Validates at each checkpoint
- Uses Serena MCP for code modifications
- Reports progress and results

### `/analyze-call`

Test the complete call analysis flow.

```bash
/analyze-call "Template Name" "path/to/audio.mp3"
```

This command:
- Tests audio upload and processing
- Validates Whisper transcription
- Validates GPT-4 analysis
- Generates test report

## 📖 How to Use

### 1. Request a New Feature

Fill out [INITIAL.md](./INITIAL.md) with:
- **FEATURE**: What you want to build
- **EXAMPLES**: Reference similar features
- **DOCUMENTATION**: Required docs and APIs
- **OTHER CONSIDERATIONS**: Gotchas and constraints

### 2. Generate Implementation Plan

```bash
/generate-prp INITIAL.md
```

AI assistant will:
- Research codebase with Serena MCP
- Ask clarifying questions
- Generate comprehensive PRP
- Save to `PRPs/feature-name_prp.md`

### 3. Execute the Plan

```bash
/execute-prp PRPs/feature-name_prp.md
```

AI assistant will:
- Implement step-by-step
- Validate at each checkpoint
- Test implementation
- Report completion

### 4. Test and Deploy

- Run validation gates
- Manual testing
- Deploy following deployment guide

## 🎨 Architecture

### Backend (Flask + MySQL)

```
backend/
├── app/
│   ├── models/          # SQLAlchemy models
│   ├── services/        # Business logic
│   ├── routes/          # API endpoints
│   └── middleware/      # Auth, etc.
├── requirements.txt
└── run.py
```

**Patterns**:
- Three-layer architecture (Routes → Services → Models)
- JWT authentication with refresh tokens
- RESTful API design
- SQLAlchemy ORM (no raw SQL)

### Frontend (React + TypeScript)

```
frontend/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Route pages
│   ├── services/       # API clients
│   ├── types/          # TypeScript interfaces
│   └── context/        # Global state
├── package.json
└── vite.config.ts
```

**Patterns**:
- Functional components with hooks
- Context API for global state
- TypeScript for type safety
- Tailwind CSS for styling
- Axios for API calls

## 🔧 Technology Stack

**Backend**:
- Flask 3.0 (web framework)
- SQLAlchemy 3.1 (ORM)
- MySQL 8.0 (database)
- PyJWT 2.8 (authentication)
- OpenAI API 1.6 (Whisper + GPT-4)
- SendGrid 6.11 (email)
- ReportLab 4.0 (PDF generation)

**Frontend**:
- React 18.2
- TypeScript 5.3
- Vite 5.0 (build tool)
- Tailwind CSS 3.4 (styling)
- React Router DOM 6.21 (routing)
- Axios 1.6 (HTTP client)

## 🎯 Core Features

1. **Authentication**
   - Email/password login and registration
   - JWT with automatic token refresh
   - Secure password hashing

2. **Call Analysis**
   - Upload audio files or record live
   - OpenAI Whisper transcription
   - GPT-4 intelligent analysis
   - Customizable report templates

3. **Report Management**
   - Create, read, update, delete reports
   - PDF generation and export
   - Email and WhatsApp sharing
   - Team collaboration

4. **Report Templates**
   - Google Forms-style template builder
   - Multiple field types
   - Drag-and-drop ordering
   - Reusable templates

5. **Team Collaboration**
   - Email invitations
   - Shared reports across team
   - Role-based access
   - Team member management

6. **Dashboard**
   - Analytics and metrics
   - Recent activity feed
   - Usage statistics
   - Charts and visualizations

## 📚 Code Examples

### Backend Example

```python
# Service Layer Pattern
class EntityService:
    @staticmethod
    def create_entity(user_id, team_id, data):
        # Validate
        if not data.get('name'):
            raise ValueError("Name is required")

        # Create
        entity = Entity(name=data['name'], user_id=user_id)
        db.session.add(entity)
        db.session.commit()

        return entity.to_dict()
```

### Frontend Example

```typescript
// React Component Pattern
export const EntityList: React.FC = () => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEntities = async () => {
      try {
        const data = await entityService.getAll();
        setEntities(data);
      } catch (error) {
        toast.error('Failed to load entities');
      } finally {
        setLoading(false);
      }
    };
    loadEntities();
  }, []);

  // ... render
};
```

See [examples/](./examples/) for complete patterns.

## 🔐 Security

- Bcrypt password hashing (12 rounds)
- JWT tokens with 1-hour expiry
- Refresh tokens with 30-day expiry
- CORS configuration
- Input validation
- SQL injection protection (ORM)
- XSS protection

## 🚀 Deployment

**Backend**: AWS EC2, DigitalOcean, or Heroku
**Frontend**: Vercel, Netlify
**Database**: MySQL RDS or managed service

See CLAUDE.md for detailed deployment guide.

## 📝 Contributing

When adding new features:

1. Create feature request in INITIAL.md
2. Generate PRP with `/generate-prp`
3. Review and approve PRP
4. Execute with `/execute-prp`
5. Test thoroughly
6. Update documentation

## 🐛 Troubleshooting

Common issues:

- **CORS errors**: Check `FRONTEND_URL` in backend `.env`
- **Token errors**: Clear localStorage and re-login
- **Database errors**: Run `flask db upgrade`
- **OpenAI errors**: Verify API key and credits

See INITIAL.md troubleshooting section for more.

## 📖 Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [React Documentation](https://react.dev/)
- [Serena MCP](https://github.com/lastmile-ai/serena-mcp)

## 📄 License

Proprietary - All rights reserved

## 🤝 Support

For issues or questions:
1. Check [INITIAL.md](./INITIAL.md) troubleshooting
2. Review [CLAUDE.md](./CLAUDE.md) implementation guide
3. Check [examples/](./examples/) for patterns
4. Use `/generate-prp` to get implementation help

---

**Built with Context Engineering principles for optimal AI assistant collaboration.**
