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
- /app/test_reports/iteration_8.json (latest - chatbot improvements - all passed)
