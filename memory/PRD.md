# DioAI Resume & LinkedIn Optimizer - PRD

## Original Problem Statement
Build and enhance a "DioAI Resume & LinkedIn Optimizer" tool with core site-wide features to make it deploy-ready.

## All Features - COMPLETE
- **Backend Refactoring**: 3598-line server.py -> 16 modular route files
- **Resume Optimizer**: Upload, AI analysis, 8 visual templates, inline editing, font size controls
- **Rich Text Editor**: Toolbar with Bold, Italic, Underline, Heading, Bullet list, Divider, Font Color (9 colors), Undo/Redo
- **Professional PDF Download**: ATS-friendly styling, smart filename (firstname-lastname-title-date.pdf)
- **Quick Fix (Fix My Resume)**: One-click AI fix preserving original structure, powered by Gemini
- **Copy from Comparison**: Upload a 2nd resume, compare scores, copy comparison text to editor
- **Resume Score Comparison**: Upload second version, side-by-side bars, delta badges
- **LinkedIn Optimizer**: URL scraping, manual input, AI optimization, gated behind payment (blur paywall)
- **Google Sign-In**: Emergent Auth for public users
- **Google Drive Upload**: Full OAuth flow (configured with credentials)
- **24-Hour Data Cleanup**: Background asyncio task
- **Subdomain Support**: resume.diocreations.eu middleware + frontend routing
- **Bulk Currency Update**: Admin can change all product currencies at once
- **Chatbot Hidden**: Hidden on /resume-optimizer and /cover-letter
- **AI Chatbot**: Dio chatbot with lead capture
- **Admin Panel**: Full CMS, resume analytics, template management
- **Cover Letter Generator**: AI-powered
- **Website Builder**: AI-generated with Stripe checkout
- **Payment System**: Stripe integration with payment verification and retry logic

## Architecture
- Frontend: React + Tailwind + Shadcn/UI + Framer Motion
- Backend: FastAPI + MongoDB (motor) + 16 modular route files
- Integrations: Stripe, Gemini, Emergent Google Auth, Google Drive, Resend

## Key Credentials
- Admin: admin@diocreations.com / adminpassword
- Super Admin (Google): jomiejoseph@gmail.com

## Code Structure
```
/app/backend/routes/ (16 files)
  auth.py, admin.py, content.py, homepage.py, resume.py,
  chatbot.py, payments.py, seed.py, geo_currency.py, menus.py,
  public_auth.py, user_dashboard.py, cover_letter.py, templates.py,
  google_auth_public.py, google_drive.py

/app/frontend/src/components/resume/ (5 files)
  RichEditor.jsx (with font color picker - 9 colors),
  ScoreRing.jsx, ResumePreview.jsx (8 templates),
  ScoreComparison.jsx (with Copy to Editor), constants.js
```

## Key API Endpoints
- POST /api/resume/upload - Upload PDF/DOCX
- POST /api/resume/analyze - AI analysis with scores
- POST /api/resume/quick-fix - Apply AI fixes preserving structure
- POST /api/resume/improve - Full AI rewrite with template
- GET /api/resume/get-text/{resume_id} - Get resume text (for copy feature)
- POST /api/resume/checkout - Stripe checkout
- POST /api/resume/verify-payment - Verify Stripe payment
- POST /api/resume/linkedin - LinkedIn optimization
- PUT /api/products/bulk-currency - Bulk currency update

## Testing Status
- Iteration 17: 12/12 backend + full frontend passed (all new features verified)

## Visual Templates (8 total)
Classic, Modern, Executive, Minimal, Bold, Elegant, Corporate, Creative

## Subdomain Note
resume.diocreations.eu CNAME exists but SSL provisioning needed on platform side.
