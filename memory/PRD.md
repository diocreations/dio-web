# DioAI Resume & LinkedIn Optimizer - PRD

## Original Problem Statement
Build and enhance a "DioAI Resume & LinkedIn Optimizer" tool with core site-wide features to make it deploy-ready.

## All Features - COMPLETE
- **Backend Refactoring**: 3598-line server.py -> 16 modular route files
- **Resume Optimizer**: Upload, AI analysis, 8 visual templates, inline editing, font size controls
- **Rich Text Editor**: Bold, Italic, Underline, Heading, Bullet list, Divider, Font Color (9 colors), Undo/Redo
- **Professional PDF Download**: ATS-friendly styling, smart filename (firstname-lastname-title-date.pdf)
- **Quick Fix (Fix My Resume)**: One-click AI fix preserving original structure
- **Copy from Comparison**: Upload a 2nd resume, compare scores, copy comparison text to editor
- **Payment-Gated Content (Per-Resume)**: 
  - Analysis = FREE (scores, strengths, weaknesses, keywords, suggestions)
  - Quick-fix/Improve text = PREVIEW only (first 8 lines) until paid
  - LinkedIn full results = PARTIAL (1 headline, 2 keywords) until paid
  - Each payment covers 1 resume + 1 LinkedIn optimization
  - Backend enforces gating (no client-side bypass possible)
  - LinkedIn results stored in `linkedin_optimizations` collection
- **Resume Score Comparison**: Upload second version, side-by-side bars, delta badges
- **LinkedIn Optimizer**: URL scraping, manual input, AI optimization, server-side paywall
- **Google Sign-In**: Emergent Auth for public users
- **Google Drive Upload**: Full OAuth flow
- **24-Hour Data Cleanup**: Background asyncio task
- **Subdomain Support**: resume.diocreations.eu middleware + frontend routing
- **Bulk Currency Update**: Admin bulk currency change
- **Admin Panel**: Full CMS, resume analytics, template management
- **Cover Letter Generator**: AI-powered
- **Website Builder**: AI-generated with Stripe checkout
- **Payment System**: Stripe integration with sequential verify-then-load flow

## Architecture
- Frontend: React + Tailwind + Shadcn/UI + Framer Motion
- Backend: FastAPI + MongoDB (motor) + 16 modular route files
- Integrations: Stripe, Gemini, Emergent Google Auth, Google Drive, Resend

## Key Credentials
- Admin: admin@diocreations.com / adminpassword
- Super Admin (Google): jomiejoseph@gmail.com

## Payment Logic (Per-Resume)
| Feature | Free | Paid |
|---------|------|------|
| Upload resume | Yes | Yes |
| AI Analysis (scores, strengths, weaknesses) | Yes | Yes |
| Quick-fix / Improve text | Preview (8 lines) | Full text |
| Rich text editing | No | Yes |
| PDF Download | No | Yes |
| LinkedIn optimization | 1 headline, 2 keywords | Full results |
| Templates selection | Yes | Yes |

## Key API Endpoints
- POST /api/resume/upload - Upload PDF/DOCX
- POST /api/resume/analyze - AI analysis (FREE)
- POST /api/resume/quick-fix - Apply AI fixes (preview/full based on payment)
- POST /api/resume/improve - Full AI rewrite (preview/full based on payment)
- GET /api/resume/get-text/{resume_id} - Get resume text (for copy feature)
- POST /api/resume/checkout - Stripe checkout
- POST /api/resume/verify-payment - Verify Stripe payment
- POST /api/resume/linkedin - LinkedIn optimization (partial/full based on payment)

## Testing Status
- Iteration 17: 12/12 backend + full frontend (features verified)
- Iteration 18: 12/12 backend + full frontend (payment-gating verified)

## Visual Templates (8 total)
Classic, Modern, Executive, Minimal, Bold, Elegant, Corporate, Creative

## DB Collections
- resume_uploads, resume_analyses, resume_improvements, resume_payments
- linkedin_optimizations (NEW - caches LinkedIn results)
- resume_pricing, resume_templates

## Subdomain Note
resume.diocreations.eu CNAME exists but SSL provisioning needed on platform side.
