# DioAI Resume & LinkedIn Optimizer - PRD

## Original Problem Statement
Build and enhance a "DioAI Resume & LinkedIn Optimizer" tool with core site-wide features to make it deploy-ready.

## All Features - COMPLETE

### Core Resume Optimizer
- Upload PDF/DOCX, AI analysis (scores, strengths, weaknesses, keywords), 8 visual templates
- Quick Fix (Fix My Resume) preserving original structure, full AI rewrite with template
- **Full MS Word-like Rich Text Editor**: 
  - Font family (6 options), Font size (8pt-36pt)
  - Bold, Italic, Underline, Strikethrough
  - Section Heading (H2), Subheading (H3)
  - Bullet list, Numbered list, Indent/Outdent
  - Text alignment (Left, Center, Right, Justify)
  - Font color (9 colors), Highlight (6 colors)
  - Horizontal line, Links (Insert/Remove)
  - Undo/Redo
  - More tools: Insert Table, Block Quote, Subscript, Superscript, Copy/Cut/Paste, Select All, Clear Formatting
- **Reset Button**: Reset to original improved version (appears when edited)
- Professional PDF Download with smart filename and improved layout (no blank areas)
- Copy from Comparison: Upload 2nd resume, compare scores, copy text to editor
- Resume Score Comparison: Side-by-side bars with delta badges

### Payment System (Per-Resume Gating)
- Backend enforces: unpaid = preview only (8 lines), paid = full text
- LinkedIn: partial data (1 headline, 2 keywords) until paid
- Stripe checkout with referral code support
- Email receipt via Resend (BackgroundTasks) after payment
- Email prompt modal collects email before checkout
- **Pricing Toggle**: Admin can enable/disable pricing (OFF = free access)

### Admin SEO Manager
- **Global tab**: Site title, description, default keywords (add/remove), OG image, Google/Bing verification
- **Pages tab**: 9 site pages with per-page title, description, keywords, OG settings, canonical URL
- **Advanced tab**: Schema.org JSON-LD config, robots.txt custom rules, custom head tags
- **Dynamic sitemap.xml**: Includes all static pages, published blogs, services, portfolio
- **robots.txt**: Auto-generated with custom rules support
- **SEO injection**: Layout.jsx dynamically sets meta tags per route

### Referral Discount System
- Unique DIO-XXXXXX referral codes per user
- 20% discount for referred users, 10% earnings for referrer
- Referral validation at checkout, self-use prevention
- Admin config: enable/disable, adjust percentages, max uses
- Admin stats: total codes, uses, discount given, top referrers
- URL-based activation: /resume-optimizer?ref=CODE

### User Dashboard
- **Resumes tab**: Full resume history with versions (filename, scores, paid status, dates, open link)
- **Payments tab**: Payment history with status, amount, currency, date
- **Cover Letters tab**: All generated cover letters with job title, company, tone
- **Referral tab**: Generate code, copy link, see usage count & earnings
- **Stats cards**: Total resumes, paid downloads, AI analyses, cover letters

### Resume Builder Feature (NEW)
- **Multi-step wizard**: 7 steps (Personal Info → Summary → Experience → Education → Skills → More → Preview)
- **AI-powered content generation**:
  - Generate professional summary from job title
  - Generate experience bullet points
  - Suggest relevant skills
  - Generate full resume from minimal input
- **Export options**: PDF + DOCX (both functional)
- **Draft saving**: Logged-in users can save and resume drafts
- **Backend**: `/app/backend/routes/builder.py` with endpoints

### Other Features
- LinkedIn Optimizer: URL scraping, manual input, AI optimization, server-side paywall
- Google Sign-In (Emergent Auth), Google Drive upload
- 24-Hour Data Cleanup, Subdomain Support
- Bulk Currency Update, Admin Panel (CMS, analytics, templates)
- Cover Letter Generator, Website Builder, Chatbot

## Architecture
- Frontend: React + Tailwind + Shadcn/UI + Framer Motion
- Backend: FastAPI + MongoDB (motor) + 18 modular route files
- Integrations: Stripe, Gemini, Emergent Google Auth, Google Drive, Resend

## Key DB Collections
- seo_global, seo_pages (SEO settings)
- referral_config, referral_codes, referral_uses (Referral system)
- resume_uploads, resume_analyses, resume_improvements, resume_payments
- resume_pricing (with pricing_enabled toggle)
- linkedin_optimizations, cover_letters

## Bug Fixes Applied (Dec 2025)

### P0 - Editor UI Bug Fix (RESOLVED)
- **Issue**: "Done Editing" button was missing and editor was cut in half
- **Root Cause**: Database pricing document was missing `pricing_enabled` field, defaulting to `True` and showing paywall
- **Fix Applied**:
  1. Added `pricing_enabled: false` to resume_pricing document in database
  2. Fixed CSS layout in `RichEditor.jsx` - added flex layout for proper height distribution
  3. Fixed `ResumePreview.jsx` - added `h-full min-h-[600px]` to editing wrapper
  4. Fixed container in `ResumeOptimizerPage.jsx` - ensured proper height allocation

### P1 - Pricing Toggle
- Admin can now toggle pricing ON/OFF via admin panel
- When OFF, users get free access to all features (no paywall)

### P1 - DOCX Export for Resume Builder  
- Already implemented in backend (`/api/builder/export/docx`)
- Frontend calls this endpoint and downloads the file

## Credentials
- Admin: admin@diocreations.com / adminpassword
- Super Admin (Google): jomiejoseph@gmail.com

## Deploy Readiness
- ✅ Google Sign-In working
- ✅ PDF templates with print-color-adjust support
- ✅ Full MS Word-like Rich Text Editor
- ✅ Editor mode toggle (Preview/Text/Sections) working
- ✅ "Done Editing" button visible in edit modes
- ✅ Editor fills container properly (not cut in half)
- ✅ Pricing toggle functional (can disable to give free access)
- ✅ Resume Builder with DOCX export
- ✅ FOUC fix implemented
- ⏳ RESEND_API_KEY: Configured in backend .env (user provided key)
- ⏳ SSL for resume.diocreations.eu: Requires Emergent dashboard action

## Files Modified in This Session
- `/app/frontend/src/components/resume/RichEditor.jsx` - Flex layout fixes
- `/app/frontend/src/components/resume/ResumePreview.jsx` - Height fixes for editing mode
- `/app/frontend/src/pages/ResumeOptimizerPage.jsx` - Container height fixes
- Database: `resume_pricing` collection - Added `pricing_enabled: false`
