# DioAI Resume & LinkedIn Optimizer - PRD

## Original Problem Statement
Build and enhance a "DioAI Resume & LinkedIn Optimizer" tool with core site-wide features to make it deploy-ready.

## Latest Fixes (Mar 2025)

### 1. Resume Builder Mobile Layout Fix
- **Issue**: Export buttons not aligned on mobile in Preview tab (step 7)
- **Fix**: Changed to `flex-col sm:flex-row` layout with full-width buttons on mobile, horizontal on desktop

### 2. Page Title Fix  
- **Issue**: "TEST_Resume Optimiser" showing in browser tab
- **Fix**: Updated database SEO entry for resume-optimizer page to proper title

### 3. Hide Chatbot on Mobile
- **New Feature**: Added admin setting to hide Dio chatbot on mobile devices
- **Location**: Admin > Chatbot > Settings tab
- **Implementation**: 
  - New public API endpoint `/api/chatbot/public-settings`
  - DioChat component checks settings and hides when `hide_on_mobile: true`
  - Currently ENABLED (chatbot is hidden on mobile)

### 4. Admin Menu Editor Fixes (Previous Session)
- Fixed input focus bug (can now type full text without losing focus)
- Added Up/Down arrows to reorder menu items and sub-items
- Works for both Navigation and Footer menus

### 5. Admin Resume Management
- "Delete All Resumes" one-click button with double confirmation
- Individual delete buttons for each resume

## Key Files Modified
- `/app/frontend/src/pages/ResumeBuilderPage.jsx` - Mobile responsive buttons
- `/app/frontend/src/pages/admin/AdminChatbot.jsx` - Added Settings tab with hide mobile toggle
- `/app/frontend/src/components/DioChat.jsx` - Added mobile hide logic
- `/app/backend/routes/chatbot.py` - Added `/api/chatbot/public-settings` endpoint
- Database: `seo_pages` - Fixed resume-optimizer title
- Database: `chatbot_settings` - Added `hide_on_mobile: true`

## Deploy Status: READY ✅

## Credentials
- Admin: admin@diocreations.com / adminpassword
- Super Admin (Google): jomiejoseph@gmail.com
