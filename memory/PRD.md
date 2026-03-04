# DioAI Resume & LinkedIn Optimizer - PRD

## Original Problem Statement
Build and enhance a "DioAI Resume & LinkedIn Optimizer" tool with core site-wide features to make it deploy-ready.

## Latest Updates (Mar 2025)

### Professional Resume Templates with Photo ✅
**Date: Mar 4, 2025**

**Features Implemented:**
1. **3 New Professional Templates** - Two-column layout with photo support
   - **Professional** (Lavender accent) - Skill bars, hobbies tags, sidebar layout
   - **Corporate Blue** - Same layout with blue accent
   - **Clean Minimal** - Two-column without skill bars, cleaner look

2. **Photo Upload** - Required for professional templates
   - Added to Personal Info step (Step 1)
   - Auto-resize to 300px max
   - Circular crop display
   - Validation: Templates requiring photo can't be selected without uploading

3. **Hobbies Field** - New field in "More" step
   - Tag-style input with pill-shaped badges
   - Displayed in sidebar for professional templates

4. **Resume Builder Improvements**
   - Now 8 steps (added "Template" step between More and Preview)
   - Template selection with visual preview
   - "Requires photo" indicator for professional templates
   - PDF + DOCX export

**New Files:**
- `/app/frontend/src/components/resume/ProfessionalTemplate.jsx` - Two-column template component
- `/app/frontend/src/components/resume/constants.js` - Updated with 3 new templates

**Files Modified:**
- `/app/frontend/src/pages/ResumeBuilderPage.jsx` - Photo upload, hobbies, template step
- `/app/frontend/src/components/resume/ResumePreview.jsx` - Routes to ProfessionalTemplate

**Template Features:**
| Feature | Professional | Corporate Blue | Clean Minimal |
|---------|-------------|----------------|---------------|
| Photo | ✅ Required | ✅ Required | ✅ Required |
| Skill Bars | ✅ Yes | ✅ Yes | ❌ No |
| Hobbies Tags | ✅ Yes | ✅ Yes | ✅ Yes |
| Two-Column | ✅ Yes | ✅ Yes | ✅ Yes |

### Homepage Layout & Client Logos ✅
**Date: Mar 4, 2025**

**Features Implemented:**
1. **Stats Section Repositioned** - Moved below "Trusted by" section
   - Previously: Stats (230+ Projects, etc.) were inside the hero section
   - Now: Stats appear BELOW the client logos/trust badges section
   - Stats now show 4 items instead of 3 with improved styling

2. **Client Logos Section** - Dynamic trust badges with admin control
   - Client company logos displayed in "Trusted by" section
   - Grayscale effect with color on hover
   - Default logos: Google, Microsoft, Amazon, Meta, Apple
   - Optional link URL for each logo

3. **Admin Client Logos Manager** - New "Clients" tab in Homepage Manager
   - Add/Edit/Delete client logos
   - Reorder with up/down arrows
   - Toggle active/inactive
   - Editable section title
   - Preview thumbnail for each logo

4. **Favicon Enhancement** - Better Google Search indexing
   - Added `site.webmanifest` file
   - Added absolute URL shortcut icon reference
   - Note: Google may take days/weeks to update favicon in search results

**Files Modified:**
- `/app/frontend/src/pages/HomePage.jsx` - Layout changes, client logos rendering
- `/app/frontend/src/pages/admin/AdminHomepage.jsx` - New Clients tab
- `/app/backend/routes/homepage.py` - Client logos CRUD API endpoints
- `/app/frontend/public/site.webmanifest` - NEW
- `/app/frontend/public/index.html` - Favicon references

**API Endpoints:**
- `GET /api/homepage/client-logos` - Public, returns active logos
- `GET /api/homepage/client-logos/all` - Admin, returns all logos
- `POST /api/homepage/client-logos` - Create logo
- `PUT /api/homepage/client-logos/{id}` - Update logo
- `DELETE /api/homepage/client-logos/{id}` - Delete logo
- `PUT /api/homepage/client-logos/reorder` - Reorder logos

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
