# DIOCREATIONS - Product Requirements Document

## Original Problem Statement
Build a fully dynamic, admin-manageable website for diocreations.eu with comprehensive features including dynamic homepage, admin panel, AI chatbot, resume optimizer, cover letter generator, user authentication, editable menus, geo-currency, and more.

## Core Requirements
1. **Dynamic Website** - All content editable from admin panel
2. **AI Chatbot (Dio)** - Knowledge-base powered, proactive engagement
3. **Resume & LinkedIn Optimizer** - AI-powered analysis, improvement, pay-to-download
4. **Cover Letter Generator** - AI-powered cover letter creation
5. **User Authentication** - Public user login/register + Google Sign-In
6. **User Dashboard** - Resume/cover letter history, 24hr data retention
7. **Editable Menus** - Admin-controlled navigation and footer menus
8. **Geo-Currency** - IP-based currency detection with admin overrides
9. **Resume Templates** - Admin-managed ATS-friendly templates

## Architecture
- **Frontend**: React + Tailwind + Shadcn/UI + Framer Motion
- **Backend**: FastAPI + MongoDB (motor) + Pydantic
- **AI**: Gemini via emergentintegrations (Emergent LLM Key)
- **Payments**: Stripe
- **Email**: Resend
- **Auth**: Admin (Google via emergentintegrations), Public (email/password + future Google)

## File Structure
```
/app/backend/
├── server.py           # Main app + existing routes (~3500 lines)
├── database.py         # Shared DB connection, env vars, currency constants
├── helpers.py          # Auth helpers (admin + public user)
├── routes/
│   ├── geo_currency.py # Geo-IP detection + admin currency settings
│   ├── menus.py        # Dynamic navigation/footer menu CRUD
│   ├── public_auth.py  # Public user register/login/logout
│   ├── user_dashboard.py # User dashboard API
│   ├── cover_letter.py # AI cover letter generator
│   └── templates.py    # Resume template management
/app/frontend/src/
├── pages/
│   ├── UserLoginPage.jsx      # Public login/register
│   ├── UserDashboardPage.jsx  # User history dashboard
│   ├── CoverLetterPage.jsx    # AI cover letter tool
│   ├── ResumeOptimizerPage.jsx # Updated: free editing, pay-to-download
│   └── admin/
│       ├── AdminMenus.jsx     # Menu editor
│       ├── AdminCurrency.jsx  # Currency settings
│       └── AdminTemplates.jsx # Template manager
├── components/
│   ├── Navbar.jsx      # Dynamic menus from API
│   └── Footer.jsx      # Dynamic menus from API
```

## What's Been Implemented

### Completed (Previous Sessions)
- Dynamic homepage with rotating content and colors
- Admin panel with drag-and-drop for all content types
- AI chatbot "Dio" with knowledge base, proactive greetings, lead capture
- DioAI Resume Optimizer MVP (upload, analysis, improvement)
- Site-wide dynamic theming (accent colors)
- Editable About page
- Chatbot mobile auto-popup disabled

### Completed (Current Session - Feb 26, 2026)
- **Geo-Currency Fix (P0)**: Uses ip-api.com for IP geolocation fallback + in-memory/DB caching
- **Admin Currency Controls**: Regional currency mapping + exchange rates editable from admin
- **Backend Modular Routes**: New features in separate route files under `/routes/`
- **Editable Menus**: Full CRUD with submenu support for nav and footer
- **User Authentication**: Email/password register + login with session management
- **User Dashboard**: Shows resume analyses and cover letter history
- **Resume Paywall Change**: Free analysis + editing, payment only for download/copy
- **Resume Templates**: 4 default templates (Classic, Modern, Creative, ATS), admin CRUD
- **Cover Letter Generator**: AI-powered with tone selection, resume upload, job description
- **Dynamic Navbar**: Fetches menu items from API, shows Sign In button
- **Dynamic Footer**: Fetches menu items from API
- **React.lazy Admin Imports**: Fixed Babel stack overflow with lazy loading

## Remaining Backlog

### P1 - High Priority
- Google Sign-In for public users (extend existing emergent Google Auth)
- Google Drive upload for resume files
- 24-hour automatic data cleanup (TTL indexes or cron job)

### P2 - Medium Priority
- Subdomain setup for resume.diocreations.eu
- AI Website Builder (long-term feature)
- Backend server.py full refactor (extract existing routes to modules)

### P3 - Nice to Have
- Resume template preview/styling in the frontend
- Cover letter template selection
- User profile editing
