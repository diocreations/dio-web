# DioCreations CMS Website - Product Requirements Document

## Original Problem Statement
Build a website similar to www.diocreations.eu with a design inspired by brainvire.com using violet/shades of violet color scheme. Features include:
- Full CMS backend to manage all website content
- AI chatbot (Dio) for lead collection
- Dynamic homepage with admin-editable content
- Geo-based currency display (EUR for Europe, INR for India)
- Secure admin panel with Google OAuth for super admin

## User Choices
- Full CMS to manage everything (pages, content, images)
- All pages: Home, About, Services, Products, Portfolio, Blog, Contact
- Contact form with email notification
- Both JWT auth and Google social login for admin panel
- Animated SVG logo support
- Design like brainvire.com with VIOLET color scheme
- Dio chatbot to collect leads and show portfolio samples
- Dynamic homepage with rotation features
- Geo-based currency localization

## What's Been Implemented

### Phase 1: Core CMS (Completed)
- [x] **Public Pages**: Homepage, About, Services, Products, Portfolio, Blog, Contact
- [x] **Admin Panel**: Dashboard with stats, CRUD for all content types
- [x] **Dio Chatbot**: Gemini-powered AI assistant for lead capture
- [x] **Authentication**: JWT + Google OAuth
- [x] **Stripe Integration**: Product payments

### Phase 2: Dynamic Homepage (Completed - Dec 2025)
- [x] **Hero Section Management**
  - Editable badge text, title lines, subtitle, CTAs
  - Multiple hero variants with rotation option
  - Default matches LIVE site design (light background, left-text/right-image layout)
  
- [x] **Stats Section**
  - Editable statistics displayed in hero (500+ Projects, 200+ Clients, 10+ Years)
  - Toggle visibility from admin
  
- [x] **Section Visibility Controls**
  - Show/hide Services, Products, Portfolio, Testimonials, CTA sections
  
- [x] **Admin Homepage Manager** (`/admin/homepage`)
  - 5 tabs: Hero, Colors, Featured, Stats, Sections
  - Real-time preview of changes
  
- [x] **Geo-Based Currency**
  - Auto-detect visitor country from headers
  - Display prices in local currency (EUR, INR, USD, GBP, etc.)
  - Currency conversion rates maintained in backend

### Phase 3: Admin Security (Completed - Dec 2025)
- [x] **Super Admin Enforcement**
  - `jomiejoseph@gmail.com` is permanent super admin
  - Super admin can grant/revoke access to other users
  - Google OAuth required for admin access
  
- [x] **Admin Users Management** (`/admin/users`)
  - View all admin users with roles
  - Add new admin users (super admin only)
  - Remove admin access (super admin only)
  - Clear "Access Restricted" message for non-super-admins

## Technical Architecture

### Backend (FastAPI + MongoDB)
```
/app/backend/
├── server.py          # All models and API routes
├── .env               # Environment variables
└── requirements.txt   # Python dependencies
```

### Frontend (React + Tailwind + Shadcn/UI)
```
/app/frontend/src/
├── App.js             # Routing and auth context
├── pages/
│   ├── HomePage.jsx   # Dynamic homepage
│   └── admin/
│       ├── AdminHomepage.jsx  # Homepage CMS
│       ├── AdminUsers.jsx     # User management
│       └── ...other admin pages
└── components/
    ├── Layout.jsx     # Public layout with header/footer
    └── AdminLayout.jsx # Admin sidebar layout
```

### Key API Endpoints
- `GET /api/homepage/content` - Public homepage data with currency
- `GET /api/homepage/settings` - Admin homepage settings
- `PUT /api/homepage/settings` - Update homepage settings
- `GET /api/homepage/hero-variants` - List hero variants
- `POST /api/homepage/hero-variants` - Create hero variant
- `PUT /api/homepage/hero-variants/{id}` - Update hero variant
- `GET /api/homepage/color-schemes` - List color schemes
- `PUT /api/homepage/featured-items` - Update featured items
- `GET /api/geo/currency` - Get visitor's currency
- `GET /api/admin/users` - List admin users (super admin only)
- `POST /api/admin/users` - Add admin user (super admin only)

### Database Collections
- `homepage_settings` - Homepage configuration
- `hero_variants` - Hero section content variants
- `color_schemes` - Available color schemes
- `featured_items` - Manually selected featured items
- `admin_users` - Admin access list
- `services`, `products`, `blog`, `portfolio`, `testimonials` - Content

## Credentials

### Admin Access
- **Default Admin**: admin@diocreations.com / adminpassword
- **Super Admin**: jomiejoseph@gmail.com (Google OAuth only)

### API Keys (in backend/.env)
- EMERGENT_LLM_KEY - For Dio chatbot
- STRIPE_API_KEY - For payments
- RESELLERCLUB_API_KEY - For domain services (planned)

## Test Results (Dec 2025)
- Backend API: 100% pass rate (25 tests)
- Frontend: 100% pass rate
- All new homepage features verified working

## Future Tasks (On Hold)
1. **AI Website Builder** - Generate unique 5-page websites with AI
2. **ResellerClub Integration** - Domain search and purchase
3. **Automated Hosting** - Deploy generated websites
4. **Server.py Refactoring** - Split into modular routes

## Deployment
- **Preview**: https://editable-cms-site.preview.emergentagent.com
- **Production**: www.diocreations.eu (user-managed)
