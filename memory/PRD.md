# DIOCREATIONS - Product Requirements Document

## Original Problem Statement
Make the existing homepage (diocreations.eu) fully dynamic and editable from a backend admin panel. This expanded to include dynamic content for all homepage sections, admin panel enhancements, SEO, chatbot improvements, and an editable About page.

## Core Requirements
1. **Dynamic Homepage CMS** - All sections editable from admin panel
2. **Dynamic Features** - Hero content rotation, accent color rotation on refresh, geo-based currency
3. **Admin Panel** - Secure panel with drag-and-drop section ordering, show/hide toggles, user management
4. **SEO** - Meta tags, sitemap.xml, robots.txt
5. **Chatbot "Dio"** - Conversational AI chatbot with lead capture
6. **Editable About Page** - Full CMS for About page content
7. **Google Analytics** - Manageable from admin panel
8. **Transactional Emails** - Purchase confirmations via Resend

## Architecture
- **Frontend**: React, react-router-dom, Tailwind CSS, Shadcn/UI, framer-motion, @dnd-kit/core
- **Backend**: FastAPI, MongoDB (motor), Pydantic, resend
- **Auth**: JWT sessions + Google OAuth (super-admin: jomiejoseph@gmail.com)
- **Integrations**: Stripe, Google Auth, Gemini (chatbot), Resend (email)

## What's Been Implemented
- Dynamic Homepage CMS with all sections
- Hero content/image rotation + **site-wide accent color rotation** (all pages, buttons, hover states, badges, gradients match)
- **Layout-level color theming**: CSS variables (`--primary`, `--accent`, `--ring`, `--secondary`) set in Layout.jsx, inherited by every page
- Geo-based currency (USD/EUR/INR)
- Admin drag-and-drop section ordering
- SEO basics (meta tags, sitemap, robots.txt)
- Animated butterfly favicon, chatbot mascot, email logo
- Google Analytics integration via admin
- Transactional emails via Resend
- Editable About Page with 6-tab admin editor
- **Dio Chatbot — Smart AI with auto-greeting, knowledge base, and admin management**
  - Auto-opens on first visit with typing indicator then random greeting
  - Quick reply suggestion buttons after every message (dynamic from LLM + default set)
  - Cached system prompt for faster responses
  - Shorter, punchier responses (2-4 sentences) with follow-up questions
  - "Online now" status indicator in header
  - Admin Chatbot Manager at `/admin/chatbot` with 3 tabs: Greetings, Knowledge Base, Personality

- **DioAI Resume & LinkedIn Optimizer** (Premium Product)
  - Free resume upload (PDF/DOCX) + AI analysis (scores, strengths, weaknesses, keywords, suggestions)
  - Paid resume rewrite (ATS-optimized, impact-driven) — locked behind Stripe payment
  - Paid LinkedIn optimization (3 headline variants, about rewrite, keywords, post ideas)
  - Admin pricing management + analytics dashboard at `/admin/resume`
  - Product name/description/pricing editable from admin without code deployment
  - Listed in navbar as "Resume AI" and available at `/resume-optimizer`
  - 4-step flow: Upload → Analysis → Unlock Pro → Optimize
- **Dio mobile fix**: Auto-popup disabled on mobile devices (< 768px width)

## Key API Endpoints
- `GET /api/homepage/content` - Public homepage data
- `PUT /api/admin/homepage/settings` - Update homepage settings
- `GET /api/about/content` - Public about page data
- `GET /api/about/settings` - Admin about page data (auth required)
- `PUT /api/about/settings` - Update about page (auth required)
- `GET /api/chatbot/greeting` - Random greeting for auto-open
- `GET /api/chatbot/settings` - Admin chatbot settings (auth required)
- `PUT /api/chatbot/settings` - Update chatbot greetings, knowledge base, personality (auth required)
- `POST /api/chat` - Send message to Dio (uses dynamic system message from knowledge base)
- `POST /api/resume/upload` - Upload PDF/DOCX resume, extract text
- `POST /api/resume/analyze` - Free AI analysis (structured scores + feedback)
- `POST /api/resume/improve` - Paid: ATS-optimized resume rewrite
- `POST /api/resume/linkedin` - Paid: LinkedIn profile optimization
- `POST /api/resume/checkout` - Create Stripe checkout session
- `GET /api/resume/pricing` - Public pricing info
- `GET /api/admin/resume/pricing` - Admin pricing config
- `PUT /api/admin/resume/pricing` - Update pricing
- `GET /api/admin/resume/analytics` - Analytics (analyses count, paid users, revenue)
- `GET /sitemap.xml` - Dynamic sitemap
- `POST /webhook/stripe` - Stripe webhook + email

## Admin Credentials
- Email: admin@diocreations.com / Password: adminpassword
- Super Admin (Google): jomiejoseph@gmail.com

## Backlog
- **P1**: AI Website Builder (Premium Features) - AI generation of websites, domain purchasing via ResellerClub, automated hosting
- **P2**: Backend refactoring - Split server.py (~3000 lines) into modular APIRouter files

## Test Reports
- /app/test_reports/iteration_3.json
- /app/test_reports/iteration_4.json
- /app/test_reports/iteration_5.json
- /app/test_reports/iteration_6.json
- /app/test_reports/iteration_7.json
- /app/test_reports/iteration_8.json
- /app/test_reports/iteration_9.json
- /app/test_reports/iteration_10.json (latest - Resume Optimizer MVP - all passed)
