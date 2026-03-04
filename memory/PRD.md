# DioAI Resume & LinkedIn Optimizer - PRD

## Original Problem Statement
Build and enhance a "DioAI Resume & LinkedIn Optimizer" tool with core site-wide features to make it deploy-ready.

## Latest Updates (Mar 2025)

### Products External Link & Currency Fix ✅
**Date: Mar 4, 2025**

**Issues Fixed:**
1. **Currency Display Issue** - Products page was using client-side timezone detection instead of server-side geo-detection
   - Now uses `/api/geo/currency` endpoint for accurate visitor currency detection
   - Default fallback is USD for unrecognized regions
   - Prices convert correctly based on admin-configured rates

2. **External Link for Products** - Added external URL support with new tab option
   - Admin can add external URL to redirect users instead of checkout
   - Toggle to open link in new tab
   - If external URL set, shows "Learn More" button instead of "Buy Now"

**Files Modified:**
- `/app/frontend/src/pages/ProductsPage.jsx` - Geo currency fetch, external link handling
- `/app/frontend/src/pages/admin/AdminProducts.jsx` - External URL input, new tab toggle
- `/app/backend/routes/payments.py` - Currency rates now from admin settings

**Hero Carousel External Link** (Already implemented):
- Primary and Secondary CTA buttons have "Open in new tab" checkbox
- Admin can set external URLs that open in new tabs

### Previous Features (Mar 2025)

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
