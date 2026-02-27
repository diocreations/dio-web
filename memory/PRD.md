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

### Admin SEO Manager (NEW)
- **Global tab**: Site title, description, default keywords (add/remove), OG image, Google/Bing verification
- **Pages tab**: 9 site pages with per-page title, description, keywords, OG settings, canonical URL
- **Advanced tab**: Schema.org JSON-LD config, robots.txt custom rules, custom head tags
- **Dynamic sitemap.xml**: Includes all static pages, published blogs, services, portfolio
- **robots.txt**: Auto-generated with custom rules support
- **SEO injection**: Layout.jsx dynamically sets meta tags per route (title, description, keywords, og:*, twitter:*, canonical, JSON-LD)

### Referral Discount System (NEW)
- Unique DIO-XXXXXX referral codes per user
- 20% discount for referred users, 10% earnings for referrer
- Referral validation at checkout, self-use prevention
- Admin config: enable/disable, adjust percentages, max uses
- Admin stats: total codes, uses, discount given, top referrers
- URL-based activation: /resume-optimizer?ref=CODE

### User Dashboard (NEW)
- **Resumes tab**: Full resume history with versions (filename, scores, paid status, dates, open link)
- **Payments tab**: Payment history with status, amount, currency, date
- **Cover Letters tab**: All generated cover letters with job title, company, tone
- **Referral tab**: Generate code, copy link, see usage count & earnings
- **Stats cards**: Total resumes, paid downloads, AI analyses, cover letters

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
- linkedin_optimizations, cover_letters

## Testing Status
- Iteration 17: 12/12 (features)
- Iteration 18: 12/12 (payment-gating)
- Iteration 19: 10/10 (email receipt)
- Iteration 20: 19/19 (SEO + referral + dashboard)
- Iteration 21: 100% (3 template/PDF bugs fixed)
- Iteration 22: 100% (Rich text editor 22 features, template PDF, Google login)
- Iteration 23: 100% (P0 Google Sign-In fix, P1 PDF template styling)

## Fixes Applied (Dec 2025)
- **P0 Google Sign-In**: Fixed auth.emergentagent.com parameter from `redirect_url` to `redirect`
- **P1 PDF Templates**: Structurally different templates with Bold having red background headers
- **P1 Contact Info**: Reduced font size from 8.5pt to 8pt for better visual hierarchy

## Credentials
- Admin: admin@diocreations.com / adminpassword
- Super Admin (Google): jomiejoseph@gmail.com

## Deploy Readiness
- ✅ Google Sign-In working
- ✅ PDF templates with print-color-adjust support
- ⏳ RESEND_API_KEY: Awaiting user to provide key for email receipts
- ⏳ SSL for resume.diocreations.eu: Requires Emergent dashboard action
