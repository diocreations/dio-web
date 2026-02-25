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
- Hero content/image rotation + accent color rotation
- Geo-based currency (USD/EUR/INR)
- Admin drag-and-drop section ordering
- SEO basics (meta tags, sitemap, robots.txt)
- Animated butterfly favicon, chatbot mascot, email logo
- Google Analytics integration via admin
- Transactional emails via Resend
- Chatbot "Dio" with conversational flow and lead capture
- **Editable About Page** - Full admin editor with 6 tabs (Hero, Stats, Values, Timeline, Why Us, CTA)
- **Dynamic button colors** - All homepage buttons/elements change with accent color via CSS custom properties
- **"Chat with Dio" genie label** - Spring-animated speech bubble near the chat toggle
- **Static message butterflies** - Only header butterfly animates; message avatars are static

## Key API Endpoints
- `GET /api/homepage/content` - Public homepage data
- `PUT /api/admin/homepage/settings` - Update homepage settings
- `GET /api/about/content` - Public about page data
- `GET /api/about/settings` - Admin about page data (auth required)
- `PUT /api/about/settings` - Update about page (auth required)
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
- /app/test_reports/iteration_5.json (latest - all passed)
