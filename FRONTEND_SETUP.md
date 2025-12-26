# Frontend Setup Guide

This guide will help you set up and run the Voice Flow frontend application.

## Prerequisites

- Node.js 18+ and npm installed
- Backend server running on `http://localhost:5000`

## Installation Steps

### 1. Navigate to Frontend Directory

```bash
cd frontend
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages:
- React 18.2
- React Router DOM 6.21
- Axios (HTTP client)
- Tailwind CSS
- TypeScript
- Vite
- Lucide React (icons)
- React Hot Toast (notifications)
- date-fns (date formatting)
- And more...

### 3. Configure Environment

The `.env` file is already created with:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

If your backend runs on a different port, update this URL.

### 4. Start Development Server

```bash
npm run dev
```

The frontend will start on **http://localhost:5173**

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
frontend/
├── public/               # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # React components
│   │   ├── common/     # Shared components (Layout, Sidebar, Navbar, etc.)
│   │   └── templates/  # Template-specific components
│   ├── context/        # React contexts (Auth, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components (routes)
│   ├── services/       # API services
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main app component with routing
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles (Tailwind)
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── tailwind.config.js  # Tailwind CSS configuration
```

## Features Implemented

### Phase 1: Authentication
- ✅ Login page
- ✅ Register page
- ✅ JWT authentication with auto-refresh
- ✅ Protected routes
- ✅ Auth context for global state

### Phase 3: Report Templates
- ✅ Template list view
- ✅ Create new templates
- ✅ Edit existing templates
- ✅ Delete templates
- ✅ Field types: text, long_text, number, dropdown, multi_select
- ✅ Drag-to-reorder fields
- ✅ Complete validation

### Common Components
- ✅ Layout with Sidebar and Navbar
- ✅ Protected Route wrapper
- ✅ Dashboard page

## Pages and Routes

| Route | Component | Description | Status |
|-------|-----------|-------------|--------|
| `/login` | Login | User login | ✅ Implemented |
| `/register` | Register | User registration | ✅ Implemented |
| `/dashboard` | Dashboard | Main dashboard | ✅ Implemented |
| `/templates` | ReportTemplates | Manage templates | ✅ Implemented |
| `/analyze` | AnalyzeCall | Analyze calls | 🚧 Phase 4 |
| `/reports` | MyReports | View reports | 🚧 Phase 5 |
| `/settings` | Settings | User settings | 🚧 Phase 7 |

## Technologies Used

### Core
- **React 18.2** - UI library
- **TypeScript 5.3** - Type safety
- **Vite 5.0** - Build tool and dev server

### Routing & State
- **React Router DOM 6.21** - Client-side routing
- **React Context** - Global state management

### Styling
- **Tailwind CSS 3.4** - Utility-first CSS
- **Lucide React** - Beautiful icons

### HTTP & Forms
- **Axios 1.6** - HTTP client with interceptors
- **React Hook Form 7.49** - Form handling (ready for Phase 4+)

### UI Enhancements
- **React Hot Toast 2.4** - Toast notifications
- **React Dropzone 14.2** - File uploads (ready for Phase 4)
- **React Select 5.8** - Enhanced dropdowns
- **date-fns 3.0** - Date formatting

## Testing the Frontend

### 1. Start Backend

Make sure the backend is running:

```bash
cd backend
python run.py
```

### 2. Start Frontend

```bash
cd frontend
npm run dev
```

### 3. Test Authentication

1. Go to http://localhost:5173
2. You'll be redirected to `/login`
3. Click "create a new account"
4. Register with:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Password: password123
5. After registration, you should be logged in and redirected to dashboard

### 4. Test Templates

1. Click "Templates" in the sidebar
2. Click "Create Your First Template"
3. Create a template:
   - Name: "Customer Support Call"
   - Description: "Template for customer support calls"
4. Add fields:
   - Customer Name (text, required)
   - Issue Type (dropdown, options: Technical, Billing, General)
   - Satisfaction Score (number)
5. Click "Create Template"
6. Verify template appears in list

### 5. Test Navigation

- Click through all sidebar items
- Verify layout is consistent
- Check that protected routes redirect to login when logged out
- Test logout functionality

## Common Issues

### Port Already in Use

If port 5173 is already in use:

1. Change port in `vite.config.ts`:
```typescript
server: {
  port: 3000, // or any other port
  //...
}
```

### CORS Errors

Make sure backend CORS is configured for `http://localhost:5173`:

Check `backend/app/config.py`:
```python
FRONTEND_URL = 'http://localhost:5173'
```

### Module Not Found

Clear node_modules and reinstall:

```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

Ensure `tsconfig.json` is properly configured. If errors persist:

```bash
npm run build
```

This will show all TypeScript errors.

## Building for Production

### 1. Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### 2. Preview Build

```bash
npm run preview
```

This serves the production build locally for testing.

### 3. Deploy

The `dist/` folder can be deployed to:
- Vercel (recommended for Vite apps)
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## Environment Variables

### Development (.env)

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### Production (.env.production)

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

**Note:** All Vite environment variables must be prefixed with `VITE_`

## Next Steps

After setting up the frontend:

1. **Phase 4**: Implement audio upload and analysis features
2. **Phase 5**: Build reports management interface
3. **Phase 6**: Add team collaboration features
4. **Phase 7**: Complete dashboard with real metrics
5. **Phase 8**: Polish UI/UX and add animations
6. **Phase 9**: Testing and deployment

## Getting Help

If you encounter issues:

1. Check browser console for errors
2. Check network tab for failed API requests
3. Verify backend is running and accessible
4. Check that `.env` file has correct API URL
5. Try clearing browser cache and localStorage

## Development Tips

### Hot Reload

Vite provides instant hot reload. Changes to `.tsx`, `.ts`, and `.css` files will reflect immediately.

### TypeScript

VS Code provides excellent TypeScript support. Install recommended extensions:
- ES Lint
- Prettier
- Tailwind CSS IntelliSense

### Code Organization

- Keep components small and focused
- Use TypeScript interfaces for all data structures
- Extract reusable logic into custom hooks
- Use services for all API calls

### Performance

- Components are lazy-loaded by default
- Images should go in `public/` folder
- Use React.memo() for expensive components
- Avoid unnecessary re-renders with useMemo/useCallback

## Success Criteria

Frontend is working correctly if:

- ✅ Login/Register flows work
- ✅ JWT tokens are stored and refreshed automatically
- ✅ Protected routes redirect to login
- ✅ Templates can be created, edited, deleted
- ✅ UI is responsive and styled with Tailwind
- ✅ No console errors
- ✅ API calls succeed (check Network tab)

Congratulations! Your frontend is now set up and ready for Phase 4 development.
