# DioAI Resume & LinkedIn Optimizer - PRD

## Original Problem Statement
Build and enhance a "DioAI Resume & LinkedIn Optimizer" tool with core site-wide features to make it deploy-ready.

## Latest Updates (Mar 2025)

### User Authentication & Admin Paid Users Management ✅
**Date: Mar 9, 2025**

**Features Implemented:**

1. **Diocreations Login Branding**
   - Changed login page title from "Your Account" to "Diocreations Login"
   - Updated UserLoginPage.jsx with proper branding

2. **Forgot Password Flow**
   - Added "Forgot password?" link on login page
   - Created forgot password form with email input
   - Shows success message after submission
   - Sends password reset email via Resend integration
   - Backend endpoints: POST /api/user/forgot-password, POST /api/user/reset-password

3. **Reset Password Page**
   - New page at `/reset-password?token=xxx`
   - Validates token from URL
   - Shows error if token is invalid/expired
   - Allows setting new password with confirmation

4. **Admin Paid Users Management**
   - New "Paid Users" tab in Admin Resume page
   - View all users who paid for Resume AI with:
     - Email, resume filename, payment amount, date, score
     - Revoke access button
   - Grant Paid Access form to manually grant access by Resume ID
   - Backend endpoints: GET /api/admin/resume/paid-users, POST /api/admin/resume/grant-access, DELETE /api/admin/resume/revoke-access/{resume_id}

5. **LinkedIn Optimizer Access Control**
   - Toggle in Admin Paid Users tab
   - ON = Available to all users, OFF = Paid users only
   - Saved with pricing settings

6. **Improved Resume Deduplication**
   - Changed from exact MD5 hash to similarity-based comparison
   - Uses Jaccard similarity on normalized text (word sets)
   - 70%+ similarity = Same resume (allows edits, retains payment)
   - <30% similarity = Different resume (blocked for same account)
   - One resume per account policy for Resume Analyzer

7. **Re-Analysis Consistency for Downloaded Resumes (Req #11)**
   - Improved PDF text extraction using block-based parsing for better structure
   - Added `clean_extracted_text()` function to remove PDF artifacts
   - Normalized section headers during extraction (EXPERIENCE, EDUCATION, SKILLS, etc.)
   - Added `detect_platform_resume()` to identify well-formatted resumes
   - Updated AI analysis prompt with fair scoring guidelines
   - Platform-generated resumes now parse correctly and maintain strong ATS scores

8. **Resume Editor Improvements (Req #2)**
   - Made RichEditor toolbar sticky (stays visible when scrolling)
   - Made editor full-width (removed unused margins)
   - Added explicit w-full classes to editor container

9. **LinkedIn URL Formatting Bug Fix (Req #3)**
   - Fixed issue where editing URLs caused surrounding text to become bold
   - Improved insertLink() to pre-fill existing URL when editing
   - Improved removeLink() to properly clean up link without affecting formatting

10. **Template Compatibility & Multi-Page Support (Req #4)**
    - Updated ProfessionalTemplate to use dynamic height instead of fixed min-height
    - Added PDF pagebreak settings for proper multi-page rendering
    - Templates now properly expand to accommodate longer resumes

11. **Cover Letter Job URL Import (Req #9)**
    - Added "Import Job from URL" feature to Cover Letter page
    - Users can paste job posting URL (LinkedIn, Indeed, Glassdoor, etc.)
    - System auto-extracts job title, company name, and description
    - Backend uses httpx for async HTTP + BeautifulSoup for parsing + Gemini AI for extraction
    - New endpoint: POST /api/cover-letter/fetch-job

12. **Resume Upload Error Handling Post-Payment (Req #12)**
    - Added detailed error messages when upload fails after payment
    - Error message includes "Contact Support" link to Contact page
    - Error message includes "Chat with Dio" button for chatbot
    - User is instructed to mention "Resume Error" subject
    - Error state properly tracked with uploadError state variable

**Files Created:**
- `/app/frontend/src/pages/ResetPasswordPage.jsx`

**Files Modified:**
- `/app/frontend/src/pages/UserLoginPage.jsx` - Diocreations branding, forgot password UI
- `/app/backend/routes/public_auth.py` - Forgot/reset password endpoints
- `/app/backend/routes/resume.py` - Paid users endpoints, similarity-based deduplication, improved PDF extraction
- `/app/frontend/src/pages/admin/AdminResume.jsx` - Paid Users tab with grant/revoke
- `/app/frontend/src/pages/ResumeOptimizerPage.jsx` - Handle upload error for blocked resumes
- `/app/frontend/src/App.js` - Added /reset-password route

**API Endpoints:**
- `POST /api/user/forgot-password` - Request password reset email
- `POST /api/user/reset-password` - Reset password with token
- `GET /api/admin/resume/paid-users` - List all paid users
- `POST /api/admin/resume/grant-access` - Manually grant access
- `DELETE /api/admin/resume/revoke-access/{resume_id}` - Revoke paid access

---


### Admin-Editable Contact Form & Custom Pages ✅
**Date: Mar 6, 2025**

**Features Implemented:**

1. **Contact Form Settings (Admin-Editable)**
   - New admin page at `/admin/contact-settings`
   - Edit Budget Ranges - add/remove options, change currency (€, $, £, etc.)
   - Edit Service Options - add/remove services from dropdown
   - Changes reflect immediately on the Contact page

2. **Custom Pages Manager**
   - New admin page at `/admin/custom-pages`
   - Create unlimited custom landing pages
   - Each page can have:
     - Hero section (badge, title, highlight text, description, CTA, image)
     - Stats bar (value + label pairs)
     - Features grid (icon, title, description)
     - Benefits list (checkmark items)
     - Testimonials (name, role, quote, rating)
     - Bottom CTA section
   - Publish/unpublish toggle
   - Pages accessible at `/page/{slug}`

**Files Created:**
- `/app/frontend/src/pages/admin/AdminContactSettings.jsx`
- `/app/frontend/src/pages/admin/AdminCustomPages.jsx`
- `/app/frontend/src/pages/CustomPage.jsx`

**Files Modified:**
- `/app/backend/routes/content.py` - Added contact-settings and page CRUD APIs
- `/app/frontend/src/pages/ContactPage.jsx` - Fetches settings from API
- `/app/frontend/src/components/AdminLayout.jsx` - Added new menu items
- `/app/frontend/src/App.js` - Added new routes

**API Endpoints:**
- `GET /api/contact-settings` - Get contact form dropdown options
- `PUT /api/contact-settings` - Update contact form settings
- `POST /api/pages` - Create new custom page
- `DELETE /api/pages/{slug}` - Delete custom page

---

### Blog Newsletter & Landing Pages & Contact Page Enhancements ✅
**Date: Mar 6, 2025**

**Features Implemented:**

1. **Blog Page Newsletter Fix**
   - Fixed newsletter button on blog page that was redirecting to /contact
   - Now uses NewsletterSubscribe component with email input + Subscribe button
   - Properly integrates with existing newsletter subscription API

2. **New Landing Pages (Admin-Editable)**
   - Created 3 new marketing landing pages:
     - `/resume-builder-info` - AI Resume Builder landing page
     - `/resume-analyzer-info` - Resume Analyzer & LinkedIn Optimizer landing page
     - `/cover-letter-info` - Cover Letter Generator landing page
   - Each page features: Hero section, Stats bar, Features grid, Testimonials, CTA section
   - All content editable via Admin Panel → Landing Pages

3. **Admin Landing Pages Manager**
   - New admin section at `/admin/landing-pages`
   - Edit hero badge, title, highlight text, description, CTA button, image
   - Manage stats (value + label pairs)
   - Manage features (icon, title, description)
   - Manage testimonials (Resume Builder page only)
   - Edit bottom CTA section

4. **Admin SEO Updates**
   - Added Resume Builder to SEO Manager
   - Added all 3 landing pages to SEO Manager
   - Can now manage SEO metadata for: resume-builder, resume-builder-info, resume-analyzer-info, cover-letter-info

5. **Contact Page Redesign**
   - Added trust indicators bar (Fast Response, 100% Confidential, Expert Team)
   - New form fields: Company Name, Service Interest (dropdown), Budget Range (dropdown)
   - Quick Response Guarantee card
   - Privacy policy link
   - Enhanced visual design with icons and better spacing

**Files Created:**
- `/app/frontend/src/pages/ResumeBuilderLandingPage.jsx`
- `/app/frontend/src/pages/ResumeAnalyzerLandingPage.jsx`
- `/app/frontend/src/pages/CoverLetterLandingPage.jsx`
- `/app/frontend/src/pages/admin/AdminLandingPages.jsx`

**Files Modified:**
- `/app/frontend/src/pages/BlogPage.jsx` - Newsletter component integration
- `/app/frontend/src/pages/ContactPage.jsx` - Complete redesign with new fields
- `/app/frontend/src/pages/admin/AdminSeo.jsx` - Added new pages to SITE_PAGES
- `/app/frontend/src/pages/admin/AdminContacts.jsx` - Show new contact fields
- `/app/frontend/src/components/AdminLayout.jsx` - Added Landing Pages menu item
- `/app/frontend/src/App.js` - Added routes for new pages
- `/app/backend/routes/content.py` - Handle new contact form fields

**Landing Pages API:**
- `GET /api/pages/{slug}` - Fetch page content
- `PUT /api/pages/{slug}` - Update page content (admin)

**Service Interest Options:**
- Web Development, Mobile App Development, SEO Services, AI Solutions, E-commerce Development, Digital Marketing, Resume Services, Other

**Budget Range Options:**
- Under $1,000, $1,000-$5,000, $5,000-$10,000, $10,000-$25,000, $25,000-$50,000, $50,000+, Not Sure Yet

---

### Admin Pricing Toggles Implemented ✅
**Date: Mar 5, 2025**

**Features Implemented:**
- Admin can now control whether AI features are available for free or require payment
- Resume Builder and Resume Optimizer both respect their respective pricing settings
- When pricing is disabled (default): All AI features are visible and free
- When pricing is enabled: AI features are hidden for non-paying users

**Technical Changes:**
1. **Renamed API endpoint** from `/api/builder/pricing` to `/api/builder/resume-pricing` to avoid conflict with website builder tier pricing
2. **Resume Builder** - Conditionally hides AI buttons (Generate Summary, Generate Bullets, AI Suggest Skills, Generate Full Resume) based on `enabled` field
3. **Admin UI** - Fixed field name mismatch (`pricing_enabled` → `enabled`) to match backend API

**Files Modified:**
- `/app/frontend/src/pages/ResumeBuilderPage.jsx` - Added pricing state, conditional AI button rendering
- `/app/frontend/src/pages/admin/AdminResumeBuilder.jsx` - Fixed field name, updated API endpoint
- `/app/backend/routes/builder.py` - Renamed endpoints to `/resume-pricing`

**API Endpoints:**
- `GET /api/builder/resume-pricing` - Returns pricing settings
- `PUT /api/builder/resume-pricing` - Updates pricing settings (admin only)

**Default Behavior:**
```json
{
  "pricing_id": "resume_builder",
  "enabled": false,
  "price": 4.99,
  "currency": "EUR",
  "product_name": "Resume Builder Pro",
  "description": "Create professional resumes with AI assistance"
}
```

### Product Pricing Currency Conversion Fixed ✅
**Date: Mar 5, 2025**

**Bug Fixed:**
- Products priced in INR (e.g., ₹499) were showing ₹45,159.50 (incorrectly converted from EUR)
- **Root cause:** `convertPrice` function was applying EUR→visitor_currency conversion to ALL products regardless of their native currency
- **Fix:** Updated conversion logic to:
  1. If product currency = display currency → No conversion
  2. Otherwise: Convert product currency → EUR → display currency

**Example (After Fix):**
- WaaS: 499 INR → Shows ₹499.00 when viewing in INR ✅
- SEO Package: 499 EUR → Shows ₹45,159.50 when viewing in INR ✅

**Files Modified:**
- `/app/frontend/src/pages/ProductsPage.jsx` - Fixed `convertPrice()` function (lines 144-163)

### Dio Chatbot - Link Text Visibility Fixed ✅
**Date: Mar 4, 2025**

**Bug Fixed:**
- Links in chatbot messages (like "/services/web-development") were invisible (white text on white background)
- **Root cause:** Link CSS class used `text-primary-foreground` (white) instead of `text-primary` (purple)
- **Fix:** Changed link styling from `text-primary-foreground/90` to `text-primary`

**Files Modified:**
- `/app/frontend/src/components/DioChat.jsx` - Lines 451-478: Fixed link color classes

### Resume Optimizer - Empty Content After Editing Fixed ✅
**Date: Mar 4, 2025**

**Bug Fixed:**
- Professional templates showed blank/empty content after editing in RichEditor and clicking "Done Editing"
- **Root cause:** RichEditor outputs HTML (`<p>`, `<br>` tags) but `parseResumeData` wasn't handling HTML properly
- **Fix:** Complete rewrite of `parseResumeData` function to:
  1. Detect if content is HTML or plain text
  2. Normalize HTML to plain text using `normalizeContent()` while preserving structure
  3. Use section patterns (`EXPERIENCE`, `SKILLS`, etc.) to find content sections
  4. Parse experience entries with various formats (comma, pipe, "at" separators)

**Verified Working:**
- Upload resume → Analyze → Select Professional template → Edit Text → Edit content → Done Editing → Content displays correctly

**Files Modified:**
- `/app/frontend/src/components/resume/ProfessionalTemplate.jsx` - Complete rewrite of parseResumeData function (lines 25-260)

### Resume Optimizer - Editor & Parsing Fixes ✅
**Date: Mar 4, 2025**

**Bugs Fixed:**
1. **Professional templates now editable** - Clicking "Edit Text" shows RichEditor even when professional template is selected
2. **Experience parsing improved** - Job entries like "Senior AEM Developer, Tata Consultancy Services (TCS) Feb 2021 – Present" now correctly parsed:
   - Title: "Senior AEM Developer"
   - Company: "Tata Consultancy Services (TCS)"
   - Date: "Feb 2021 - Present"
3. **Button labels renamed** - "Text" → "Edit Text", "Sections" → "Edit Sections" for clarity

**Files Modified:**
- `/app/frontend/src/pages/ResumeOptimizerPage.jsx` - Button renames
- `/app/frontend/src/components/resume/ResumePreview.jsx` - Editing check moved before template check
- `/app/frontend/src/components/resume/ProfessionalTemplate.jsx` - Enhanced experience parsing

### Resume Optimizer - Professional Templates Bug Fix ✅
**Date: Mar 4, 2025**

**Bug Fixed:**
- Professional templates were showing blank content when used in Resume Optimizer
- Root cause: `parseResumeData` function only parsed HTML format but Resume Optimizer uses plain text with ALL CAPS headers

**Features Added:**
1. **Photo Upload in Resume Optimizer** - Appears when professional template is selected
2. **Template Badges** - "Photo" indicator on professional templates in selector
3. **Content Parsing** - Enhanced parser for:
   - ALL CAPS section headers (EXPERIENCE, SKILLS, etc.)
   - Contact info extraction (email, phone, LinkedIn)
   - Skills from "Category: skill1, skill2" format
   - Experience from "Title | Company | Date" format

**Files Modified:**
- `/app/frontend/src/pages/ResumeOptimizerPage.jsx` - Added photo upload UI & handler
- `/app/frontend/src/components/resume/ProfessionalTemplate.jsx` - Enhanced parseResumeData

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
