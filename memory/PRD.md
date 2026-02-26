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

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Framer Motion
- **Backend**: FastAPI + MongoDB (motor) + Pydantic
- **Integrations**: Stripe, Gemini (via emergentintegrations), Emergent Google Auth, Google Drive (configurable), Resend email, ResellerClub domains

## Code Structure
```
/app/backend/
├── server.py          # Slim app init, middleware, router includes, startup/cleanup
├── database.py        # MongoDB connection, env vars, constants
├── helpers.py         # Auth helpers, password hashing, token generation
├── models.py          # Pydantic models (SiteSettings)
└── routes/
    ├── auth.py            # Admin auth (login, register, Google OAuth, session)
    ├── admin.py           # Stats, settings, media, admin user management
    ├── content.py         # Services, products, portfolio, blog, testimonials, contact, pages
    ├── homepage.py        # Homepage content, hero variants, color schemes, about page, sitemap
    ├── resume.py          # Resume upload, analyze, improve, LinkedIn, pricing, checkout
    ├── chatbot.py         # AI chatbot, chat sessions, leads
    ├── payments.py        # Stripe checkout, webhooks, builder, domains
    ├── seed.py            # Data seeding
    ├── geo_currency.py    # Geo-IP currency detection
    ├── menus.py           # Navigation and footer menus
    ├── public_auth.py     # Public user auth (email + Google callback)
    ├── user_dashboard.py  # User dashboard and data deletion
    ├── cover_letter.py    # AI cover letter generation
    ├── templates.py       # Resume template management
    ├── google_auth_public.py  # Emergent Google Auth for public users
    └── google_drive.py    # Google Drive file import (configurable)
```

## What's Implemented
- **Backend Refactoring**: COMPLETE - 3598-line server.py -> 15 modular route files + slim server.py
- **Resume Optimizer**: Upload PDF/DOCX, AI analysis, 5 visual templates, inline editing, font size controls (A-/A+), pay-to-download via Stripe
- **LinkedIn Optimizer**: URL scraping (OG metadata extraction), manual input, AI-powered headline/about/keywords optimization, gated behind payment
- **Google Sign-In**: Emergent Auth integration for public users, session management
- **Google Drive Upload**: Backend routes implemented (connect, callback, list-files, import-file). Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars.
- **24-Hour Data Cleanup**: Background asyncio task runs hourly, deletes expired sessions and user data
- **Subdomain Support**: Middleware detects resume.* hostname, frontend routes to resume-only mode, DNS config endpoint available
- **AI Chatbot**: Dio chatbot with lead capture, knowledge base, personality customization
- **Admin Panel**: Full CMS for services, products, portfolio, blog, testimonials, contacts, leads, settings, menus, currency, resume templates
- **Cover Letter Generator**: AI-powered cover letter from resume + job description
- **Website Builder**: AI-generated websites with Stripe checkout
- **Payment System**: Stripe integration for products, resume downloads, website builder

## Key Credentials
- Admin: admin@diocreations.com / adminpassword
- Super Admin (Google): jomiejoseph@gmail.com
- Emergent LLM Key: In backend/.env

## Testing Status
- Backend: 26/26 API tests passed (iteration_14)
- Frontend: All UI flows verified
- Google Drive: Returns {configured: false} - needs Google API credentials

## Backlog
- P2: Consider splitting ResumeOptimizerPage.jsx (975 lines) into smaller components
- P2: Add more comprehensive error handling for edge cases in resume parsing
- P3: Chatbot overlay could be hidden on resume-optimizer page for cleaner UX
