# DioAI Resume & LinkedIn Optimizer - PRD

## Original Problem Statement
Build and enhance a "DioAI Resume & LinkedIn Optimizer" tool with core site-wide features including:
1. Resume font resizing controls
2. LinkedIn profile optimizer with URL scraping
3. Google Sign-In for public users
4. Google Drive file import
5. 24-hour automatic data cleanup
6. Backend modular refactoring from monolithic server.py
7. Subdomain setup for resume.diocreations.eu
8. Resume score comparison (side-by-side analysis of multiple versions)

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Framer Motion
- **Backend**: FastAPI + MongoDB (motor) + Pydantic
- **Integrations**: Stripe, Gemini (via emergentintegrations), Emergent Google Auth, Google Drive, Resend email, ResellerClub domains

## Code Structure
```
/app/backend/
├── server.py          # Slim app init, middleware, router includes, startup/cleanup
├── database.py        # MongoDB connection, env vars, constants
├── helpers.py         # Auth helpers, password hashing, token generation
├── models.py          # Pydantic models (SiteSettings)
└── routes/            # 16 modular route files
    ├── auth.py, admin.py, content.py, homepage.py
    ├── resume.py, chatbot.py, payments.py, seed.py
    ├── geo_currency.py, menus.py, public_auth.py
    ├── user_dashboard.py, cover_letter.py, templates.py
    ├── google_auth_public.py, google_drive.py

/app/frontend/src/
├── components/
│   ├── resume/            # Extracted resume components
│   │   ├── ScoreRing.jsx, ResumePreview.jsx
│   │   ├── ScoreComparison.jsx, constants.js
│   ├── Layout.jsx         # Hides chatbot on resume/cover-letter pages
│   ├── DioChat.jsx, Navbar.jsx, Footer.jsx
│   └── ui/                # Shadcn components
├── pages/
│   ├── ResumeOptimizerPage.jsx  # ~575 lines (down from 975)
│   ├── UserLoginPage.jsx, UserDashboardPage.jsx
│   └── admin/
└── App.js                 # Subdomain-aware routing
```

## All Features - COMPLETE
- **Backend Refactoring**: 3598-line server.py → 16 modular route files + slim server.py
- **Resume Optimizer**: Upload, AI analysis, 5 visual templates, inline editing, font size controls
- **Resume Score Comparison**: Upload second version, side-by-side bars, delta badges, keyword tracking
- **LinkedIn Optimizer**: URL scraping, manual input, AI-powered optimization, gated behind payment
- **Google Sign-In**: Emergent Auth integration for public users
- **Google Drive Upload**: FULLY CONFIGURED with OAuth flow (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in .env)
- **24-Hour Data Cleanup**: Background asyncio task runs hourly
- **Subdomain Support**: Middleware + frontend routing for resume.diocreations.eu
- **Component Splitting**: ScoreRing, ResumePreview, ScoreComparison, constants extracted
- **Chatbot Hidden**: Hidden on /resume-optimizer and /cover-letter for cleaner UX

## Key Credentials
- Admin: admin@diocreations.com / adminpassword
- Super Admin (Google): jomiejoseph@gmail.com
- Google Drive: Client ID and Secret configured in backend/.env

## Testing Status
- Iteration 14: 26/26 backend + all frontend passed (after refactoring)
- Iteration 15: 13/13 backend + all frontend passed (score comparison + component split + chatbot hiding)
- Google Drive: Verified configured=true, valid OAuth URL generation, all endpoints responding correctly
