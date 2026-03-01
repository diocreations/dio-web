# DioAI Resume & LinkedIn Optimizer - PRD

## Original Problem Statement
Build and enhance a "DioAI Resume & LinkedIn Optimizer" tool with core site-wide features to make it deploy-ready.

## Latest Features (Mar 2025)

### Newsletter System (NEW) ✅
Complete email newsletter system with:

**Subscriber Management:**
- Email subscription form in website footer
- Public API: `POST /api/newsletter/subscribe`
- Unsubscribe link in all emails
- Admin view: List all subscribers with status (active/unsubscribed)
- Admin actions: Delete individual, Delete All, Export CSV

**Newsletter Creator:**
- **Auto-fetch blog content** from URL (title, excerpt, image)
- Custom subject line and preview text
- Featured blog section with image and CTA button
- Custom message/intro section
- Branded HTML email template with DioCreations styling

**Scheduling:**
- Save as Draft
- Schedule for specific date/time
- Send immediately
- View sending history with stats

**Email Delivery:**
- Sent via Resend API (already configured)
- Branded HTML template with header, content, footer
- Unsubscribe link in every email
- Background task processing for bulk sends

### Files Created:
- `/app/backend/routes/newsletter.py` - All API endpoints
- `/app/frontend/src/pages/admin/AdminNewsletter.jsx` - Admin dashboard
- `/app/frontend/src/components/NewsletterSubscribe.jsx` - Subscription form

### API Endpoints:
- `POST /api/newsletter/subscribe` - Public subscription
- `GET /api/newsletter/unsubscribe/{id}` - Unsubscribe link
- `GET /api/admin/newsletter/subscribers` - List subscribers
- `DELETE /api/admin/newsletter/subscribers/{id}` - Delete one
- `DELETE /api/admin/newsletter/subscribers/delete-all` - Delete all
- `POST /api/admin/newsletter/fetch-blog` - Auto-fetch blog content
- `POST /api/admin/newsletter/create` - Create newsletter
- `GET /api/admin/newsletter/list` - List all newsletters
- `POST /api/admin/newsletter/{id}/send` - Send now
- `POST /api/admin/newsletter/{id}/schedule` - Schedule for later
- `GET /api/admin/newsletter/{id}/preview` - HTML preview

### Database Collections:
- `newsletter_subscribers` - Email list
- `newsletters` - Newsletter drafts and sent emails

## Previous Features Summary
- Resume Optimizer with AI analysis & editor
- Resume Builder with multi-step wizard
- Cover Letter generator
- Admin panel for all features
- Stripe payments, Referral system
- SEO management, Dynamic menus
- Chatbot (hide on mobile option)

## Deploy Status: READY ✅

## Credentials
- Admin: admin@diocreations.com / adminpassword
