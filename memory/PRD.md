# DioCreations CMS Website - Product Requirements Document

## Original Problem Statement
Build a website similar to www.diocreations.eu with a design inspired by brainvire.com using violet/shades of violet color scheme. Features include:
- Full CMS backend to manage all website content
- AI chatbot (Dio) for lead collection
- Dynamic homepage with admin-editable content
- Geo-based currency display (EUR for Europe, INR for India, USD for US)
- Secure admin panel with Google OAuth for super admin

## What's Been Implemented

### Phase 1: Core CMS (Completed)
- [x] Public Pages: Homepage, About, Services, Products, Portfolio, Blog, Contact
- [x] Admin Panel: Dashboard with stats, CRUD for all content types
- [x] Dio Chatbot: Gemini-powered AI assistant for lead capture
- [x] Authentication: JWT + Google OAuth
- [x] Stripe Integration: Product payments

### Phase 2: Dynamic Homepage CMS (Completed - Dec 2025)

#### Hero Section Management
- [x] Multiple hero variants with text + image rotation
- [x] Editable: badge text, title lines, subtitle, CTAs, hero image
- [x] Rotation types: "refresh" (change on page load) or "auto" (carousel)
- [x] Per-variant accent color selection

#### Color Accent Variations
- [x] 5 color schemes: Violet, Blue, Teal, Pink, Orange
- [x] Accent colors change: badges, gradient text, CTA buttons
- [x] Admin can enable/disable individual color schemes
- [x] Session-persistent color rotation on page refresh

#### Section Ordering (Drag & Drop)
- [x] Admin can reorder: Services, Products, Blog, Portfolio, Testimonials, CTA
- [x] Up/down arrows in "Order" tab
- [x] Order persists after save and reflects on homepage

#### Section Visibility (Show/Hide Toggles)
- [x] 6 toggles: Services, Products, Blog, Portfolio, Testimonials, CTA
- [x] Hidden sections don't render on homepage

#### Featured Items Selection
- [x] Select specific blog posts to feature (configurable count)
- [x] Select specific products to feature (configurable count)
- [x] Featured items shown in homepage Blog/Products sections

#### Stats Section
- [x] Editable statistics displayed in hero
- [x] Configurable values and labels
- [x] Toggle visibility from admin

#### Geo-Based Currency Display
- [x] Auto-detect visitor country from headers (CF-IPCountry, X-Country-Code)
- [x] **India (IN)** → INR (₹) with rate 90.5
- [x] **USA (US)** → USD ($) with rate 1.08
- [x] **Italy (IT) / Europe** → EUR (€) with rate 1.0
- [x] **UK (GB)** → GBP (£) with rate 0.85
- [x] Product prices auto-convert and display in visitor's currency

### Phase 3: SEO Optimization (Completed - Dec 2025)
- [x] **Animated Favicon** - Purple "D" with rotating ring animation
- [x] **Meta Tags** - Title, description, keywords, author, robots
- [x] **Open Graph** - Facebook/social sharing tags with image
- [x] **Twitter Cards** - Twitter-specific meta tags
- [x] **Structured Data (JSON-LD)**:
  - Organization schema
  - LocalBusiness/ProfessionalService schema
  - Service offerings
  - Aggregate rating (4.9/5)
- [x] **robots.txt** - Allows crawling, blocks admin/api
- [x] **Dynamic Sitemap** - /api/sitemap.xml with all pages, services, blog posts, portfolio

### Phase 4: Dio Chatbot Enhancement (Completed - Dec 2025)
- [x] **Animated Dio Mascot** - SVG with animated eyes and smile
- [x] **Friendly Conversation Flow**:
  1. Greet user and ask for name
  2. Use name throughout conversation
  3. Be friendly, make user laugh
  4. Ask what service they need
  5. Share relevant service URL
  6. Collect contact info (email, phone/WhatsApp)
  7. Reassure 24-hour response time
- [x] **Lead Collection** - Captures name, email, phone automatically
- [x] **Portfolio Preview** - Shows relevant work when discussing services
- [x] **Service Links** - Clickable links to relevant pages

### Phase 5: Admin Security (Completed - Dec 2025)
- [x] Super Admin: `jomiejoseph@gmail.com` (Google OAuth only)
- [x] Admin Users page restricted to super admin
- [x] Super admin can grant/revoke access to other users

## Admin Homepage Manager (/admin/homepage)

6 Tabs:
1. **Hero** - Edit hero variants (text + image), rotation settings
2. **Colors** - Enable/disable color schemes for accent rotation
3. **Featured** - Select featured blog posts and products
4. **Stats** - Edit statistics shown in hero section
5. **Sections** - Show/hide toggles for each section
6. **Order** - Drag & drop section ordering

## Technical Architecture

### Key API Endpoints
- `GET /api/homepage/content` - Public homepage data with geo-currency
- `GET /api/geo/currency` - Get visitor's currency based on location
- `PUT /api/homepage/settings` - Update homepage settings (auth required)
- `POST /api/homepage/hero-variants` - Create new hero variant
- `PUT /api/homepage/featured-items` - Update featured items

### Database Collections
- `homepage_settings` - Settings including section_order, show_* toggles
- `hero_variants` - Hero content variants with hero_image
- `color_schemes` - Available color schemes
- `featured_items` - Manually selected featured items

## Credentials
- **Admin**: admin@diocreations.com / adminpassword
- **Super Admin**: jomiejoseph@gmail.com (Google OAuth only)

## Test Results (Dec 2025)
- Backend API: 100% pass rate (27 tests)
- Frontend: 100% pass rate
- All homepage features verified working

## Future Tasks (On Hold)
1. AI Website Builder with ResellerClub domain integration
2. Server.py refactoring into modular routes
