# DioAI Resume & LinkedIn Optimizer - PRD

## Original Problem Statement
Build and enhance a "DioAI Resume & LinkedIn Optimizer" tool with core site-wide features.

## All Features - COMPLETE
- **Backend Refactoring**: 3598-line server.py → 16 modular route files
- **Resume Optimizer**: Upload, AI analysis, 5 visual templates, inline editing, font size controls
- **Rich Text Editor**: Toolbar with Bold, Italic, Underline, Heading, Bullet list, Divider, Undo/Redo
- **Professional PDF Download**: Template-specific styling, bold headings, proper bullets, job title detection
- **Resume Score Comparison**: Upload second version, side-by-side bars, delta badges
- **LinkedIn Optimizer**: URL scraping, manual input, AI optimization, gated behind payment
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
- **Payment System**: Stripe integration

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
  RichEditor.jsx, ScoreRing.jsx, ResumePreview.jsx,
  ScoreComparison.jsx, constants.js
```

## Testing Status
- Iteration 14: 26/26 backend passed (refactoring)
- Iteration 15: 13/13 backend passed (score comparison)
- Iteration 16: 11/11 backend + full frontend passed (rich editor + PDF + bulk currency)

## Subdomain Note
resume.diocreations.eu CNAME exists but SSL handshake failing. User needs to verify Cloudflare/hosting SSL covers the subdomain.
