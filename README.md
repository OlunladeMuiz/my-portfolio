# Olunlade Muiz - Full Stack Developer Portfolio

![Portfolio Preview](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js->=16-brightgreen?style=flat-square&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

A modern, responsive full-stack portfolio showcasing projects, skills, and experience. Built with vanilla HTML/CSS/JavaScript frontend and Node.js/Express backend with production-ready features including form validation, CORS handling, rate limiting, and optional email integration.

---

## 🎯 Features

### Frontend
- **Responsive Design** - Mobile-first approach with adaptive navigation sidebar for screens <1024px
- **Dark/Light Theme Toggle** - Persistent theme preference using localStorage with system preference detection
- **Smooth Animations** - AOS (Animate On Scroll) library for engaging entrance animations
- **Accessible Navigation** - ARIA labels, keyboard navigation (ESC to close sidebar), focus management
- **Contact Form** - Real-time validation, error diagnostics, and fallback mechanisms
- **Performance Optimized** - Lazy loading images, optimized CSS animations, no heavy frameworks

### Backend (Node.js/Express)
- **Form Submission API** - Validates and persists contact form submissions
- **Dual Storage Options** - File-based fallback (JSON) or Supabase PostgreSQL integration
- **Email Notifications** - SendGrid integration with retry logic and exponential backoff
- **Request Idempotency** - Prevents duplicate submissions from retries
- **Security** - CORS validation, rate limiting (20 req/min), helmet.js security headers, input sanitization
- **Admin API** - Retrieve submissions with token-based authentication
- **Debugging Tools** - `/api/_debug/echo` endpoint for CORS troubleshooting
- **Structured Logging** - ISO timestamps for production monitoring

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16
- npm or yarn
- Python 3 (for static file serving during development)

### Installation & Running

```bash
# 1. Install dependencies
npm install

# 2. Start API server on port 3001 (in terminal 1)
$env:PORT=3001; npm start

# 3. Serve frontend on port 5000 (in terminal 2)
python -m http.server 5000

# 4. Open in browser
# http://localhost:5000
```

**Note:** Both servers must run simultaneously for the contact form to function.

---

## 📁 Project Structure

```
├── index.html              # Main portfolio HTML (659 lines)
├── script.js               # Frontend interactivity (493 lines)
├── style.css               # Responsive styling (1497 lines)
├── server.js               # Express API (408 lines)
├── package.json            # Dependencies & scripts
├── api/
│   └── users.js           # Serverless function (Vercel deployment)
├── data/
│   └── submissions.json   # Contact form submissions (file storage)
├── supabase/
│   └── migration.sql      # Supabase schema (optional)
├── resources/             # Images & assets
├── scripts/               # Testing utilities
└── vercel.json           # Vercel deployment config
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file for custom configuration:

```bash
# Server
PORT=3001
NODE_ENV=production

# Email (SendGrid)
SENDGRID_API_KEY=your_api_key_here
SENDGRID_FROM=noreply@yourdomain.com
SENDGRID_FROM_DOMAIN=yourdomain.com
SENDGRID_TO=your_email@example.com

# Database (Supabase - optional)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key

# Security
ADMIN_TOKEN=your_secure_token_here
ALLOWED_ORIGIN=https://yourdomain.com
```

### API Endpoints

#### POST `/api/users` - Submit Contact Form
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Interested in collaboration",
    "message": "I would like to discuss..."
  }'
```

**Response:**
```json
{
  "ok": true,
  "submission": {
    "id": 1702471234567,
    "request_id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "status": "sent",
    "created_at": "2025-12-20T12:00:00.000Z"
  }
}
```

#### GET `/api/users` - Retrieve Submissions (Admin)
```bash
curl http://localhost:3001/api/users \
  -H "x-admin-token: your_secure_token_here"
```

#### POST `/api/_debug/echo` - CORS Debugging
```bash
curl -X POST http://localhost:3001/api/_debug/echo \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 🔍 Development & Testing

### Run Tests
```bash
# E2E contact form submission test
npm run test:e2e

# CORS configuration test
npm run test:cors

# Fallback mechanism test
npm run test:fallback
```

### Available npm Scripts
```json
{
  "start": "node server.js",
  "test:e2e": "node test_e2e_submit.js",
  "test:cors": "node test_cors.js",
  "test:fallback": "node scripts/test-fallback.js"
}
```

---

## 📊 Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom properties, animations, responsive design
- **Vanilla JavaScript** - No build tools required, ~493 lines
- **AOS Library** - Scroll animations (CDN)
- **Font Awesome v6** - Icons (CDN)

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **express-validator** - Input validation & sanitization
- **cors** - Cross-Origin Resource Sharing
- **helmet** - Security headers
- **express-rate-limit** - Rate limiting (20 req/min)
- **@supabase/supabase-js** - PostgreSQL integration (optional)
- **@sendgrid/mail** - Email service (optional)

### Infrastructure
- **Vercel** - Recommended for serverless deployment
- **Supabase** - PostgreSQL database (optional, recommended)
- **localtunnel** - Expose local API publicly during development

---

## 🛠️ Challenges & Solutions

### 1. **CORS Configuration Complexity**
**Challenge:** The portfolio frontend runs on one port (5000) while the API runs on another (3001), requiring careful CORS setup. Cross-origin requests were failing during early development.

**Solution:** 
- Implemented flexible CORS middleware that allows localhost origins in development
- Created `/api/_debug/echo` endpoint for real-time CORS diagnostics
- Added comprehensive error messaging to guide developers
- Supports origin allowlist in production via `ALLOWED_ORIGIN` environment variable

### 2. **Port Conflict Management**
**Challenge:** Port 3000 was frequently occupied by other processes, causing connection failures and confusing error messages.

**Solution:**
- Made port configurable via `PORT` environment variable
- Implemented API auto-detection that probes ports 3000 and 3001
- Created clear documentation distinguishing local development ports
- Added fallback retry logic in frontend when primary API endpoint fails

### 3. **Duplicate Form Submissions (Idempotency)**
**Challenge:** Network retries and user double-clicks could create duplicate submissions, sending duplicate emails and polluting the database.

**Solution:**
- Implemented request idempotency using `request_id` (UUID)
- Database checks for existing `request_id` before inserting
- File-based fallback also maintains idempotency
- Returns existing submission if duplicate detected

### 4. **Mobile Navigation Responsiveness**
**Challenge:** Sidebar backdrop was positioned inside the sidebar element, so when the sidebar animated off-screen, the backdrop moved with it, blocking link clicks on mobile.

**Solution:**
- Restructured DOM: moved `.sidebar-backdrop` outside `<aside>` element as a sibling
- Updated CSS selectors to work with independent backdrop positioning
- Backdrop now stays visible over entire viewport when sidebar is open
- Added proper z-index layering (sidebar: 2000, backdrop: 1500)

### 5. **Storage Fallback Architecture**
**Challenge:** Required supporting multiple backends (file-based JSON, Supabase) without complex configuration, handling missing environment variables gracefully.

**Solution:**
- Automatic detection of Supabase credentials
- Falls back to JSON file storage (`data/submissions.json`) when Supabase unavailable
- Both storage methods support idempotency
- Email notifications work independently of storage choice
- Logging indicates which backend is active

### 6. **Email Service Reliability**
**Challenge:** SendGrid might be unavailable or keys missing, but form submissions should still succeed and be stored.

**Solution:**
- Made email optional via environment variable check
- Implemented retry logic with exponential backoff (3 attempts)
- Submission is saved to storage regardless of email success
- Status tracking allows follow-up retries or manual notifications
- Clear logging of email failures for debugging

### 7. **Accessible Form Validation**
**Challenge:** Needed to provide clear error messages to both users and developers during form failures, without exposing sensitive server details.

**Solution:**
- Comprehensive error handling with fallback diagnostics
- Client detects 404, 405, CORS errors and provides actionable guidance
- `/api/_debug/echo` provides real-time response codes without exposing internals
- Notifications displayed in UI with success/error styling
- Console logs provide detailed developer information

### 8. **Rate Limiting Without User Friction**
**Challenge:** Needed to prevent abuse while not blocking legitimate users with poor network connections.

**Solution:**
- Implemented 20 requests per 60-second window (generous for typical usage)
- Returns clear 429 error with retry guidance
- Works alongside idempotency to handle retries safely
- Can be adjusted per environment via configuration

### 9. **Responsive Design Consistency**
**Challenge:** Maintaining visual consistency across desktop (>1024px) and mobile (<1024px) breakpoints without duplicating styles.

**Solution:**
- CSS custom properties (variables) for theme colors
- Single responsive media query strategy at 1024px breakpoint
- Mobile-first CSS approach
- Smooth transitions between sidebar and desktop navigation
- Auto-close sidebar when window resizes to desktop size

### 10. **Production Deployment Preparation**
**Challenge:** Code needed to work in multiple environments (local development, Vercel serverless, traditional Node.js hosting) with different constraints.

**Solution:**
- Created separate `/api/users.js` serverless function for Vercel
- Environment-aware configuration (NODE_ENV checks)
- Database URL configuration supports both local files and Supabase
- Helmet.js and security headers for production
- Graceful shutdown handlers (SIGINT/SIGTERM)
- Comprehensive error logging with timestamps

### 11. **PDF Download on Mobile (Dec 21, 2025)**
**Challenge:** CV download button was downloading index.html source code on mobile instead of the PDF file from resources folder.

**Solution:**
- Updated CV button href to point to correct resource path: `/resources/Olunlade%20Abdulmuiz_full%20stack%20developer.pdf`
- Implemented JavaScript fetch + blob approach for guaranteed downloads across all devices
- Added fallback to direct link if fetch fails
- Properly set download attribute with target filename
- Tested and working on both mobile and desktop

### 12. **Site Load Performance (Dec 21, 2025)**
**Challenge:** Portfolio needed to open and load faster when the link is opened.

**Solution:**
- Added DNS prefetching for external domains (Google Fonts, CDN)
- Implemented resource preconnection to critical hosts
- Changed Font Awesome to async load via print media trick
- Deferred AOS animations until page fully loads
- Optimized critical CSS for faster first paint
- Deferred all scripts with `defer` attribute for non-blocking loads
- Eliminated render-blocking resources

---

## 📈 Performance Metrics

Optimizations implemented:

- **Lighthouse Score**: ~90 performance (tested with `lighthouse-perf.json`)
- **No Build Tool Required**: Vanilla CSS/JS eliminates build overhead
- **Lazy Loading**: Images use `loading="lazy"` attribute
- **Minimal Dependencies**: 9 backend packages (security-focused)
- **Efficient CSS**: Single stylesheet (1497 lines) with variable system
- **Debounced Scroll Events**: Navbar scroll effect and intersection observers
- **Responsive Images**: Decorative SVG loads only when visible

### Recent Performance Updates (Dec 21, 2025)
- ✅ **DNS Prefetching** - Pre-resolves external domains (Google Fonts, CDN)
- ✅ **Resource Preconnection** - Early connections to critical hosts
- ✅ **Async Font Loading** - Font Awesome loads asynchronously, doesn't block rendering
- ✅ **Deferred Animations** - AOS animations initialize only after page fully loads
- ✅ **Critical CSS** - Base styles optimized for faster first paint
- ✅ **Script Deferral** - Both AOS and script.js load after DOM is ready

---

## 🔐 Security Features

- ✅ **Input Validation & Sanitization** - express-validator with XSS protection via `.escape()`
- ✅ **CORS Enforcement** - Origin validation with allowlist
- ✅ **Rate Limiting** - 20 requests per minute per IP
- ✅ **Security Headers** - helmet.js (CSP, XSS, Clickjacking protection)
- ✅ **Email Obfuscation** - No plain-text email in HTML (only in footer)
- ✅ **Admin Token** - Protected `/api/users` endpoint requires authentication
- ✅ **No Sensitive Data in Logs** - Passwords/tokens never logged
- ✅ **HTTPS Ready** - Configured for production SSL/TLS
- ✅ **SQL Injection Prevention** - Parameterized Supabase queries
- ✅ **Atomic File Writes** - Prevents corruption in file-based storage

---

## 🚢 Deployment

### Option 1: Vercel (Recommended - Serverless)

```bash
# 1. Create account at vercel.com
# 2. Connect GitHub repository
# 3. Set environment variables in Vercel dashboard:
#    - SENDGRID_API_KEY
#    - SUPABASE_URL & SUPABASE_SERVICE_KEY
#    - ADMIN_TOKEN

# 4. Deploy
vercel

# Frontend automatically deployed to <project>.vercel.app
# API available at /api/users (serverless function)
```

### Option 2: Traditional Node.js Host (Heroku, Railway, Render)

```bash
# Heroku example:
heroku create my-portfolio-api
heroku config:set PORT=3001
heroku config:set SENDGRID_API_KEY=sg_...
git push heroku main
```

### Option 3: Docker

```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

### Database Setup (Supabase)

```sql
-- Create submissions table
CREATE TABLE submissions (
  id BIGSERIAL PRIMARY KEY,
  request_id UUID UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sendgrid_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Create policy (read-only for service role)
CREATE POLICY "service_role_full_access" ON submissions
  USING (true) WITH CHECK (true);
```

---

## 📝 Git Commits (Recent)

```
f540491 - perf: optimize site load time with resource hints, async font loading, deferred scripts
96c3de4 - fix: force PDF download using fetch + blob for all devices
2d803d1 - fix: update CV download link to point to resources folder
8e75308 - chore: update CV filename and fix styles
6945c60 - fix: correct footer copyright name capitalization
45a9d05 - fix: change Twitter links to Instagram  
a6887bd - fix(mobile-nav): move sidebar backdrop outside sidebar to allow link interaction
(and 9+ commits refining hero section, theme colors, CV integration)
```

---

## 🤝 Contributing

This is a personal portfolio project. For suggestions or improvements:

1. Open an issue describing the enhancement
2. Submit a pull request with changes
3. Ensure all tests pass: `npm run test:*`

---

## 📧 Contact

- **Email**: [muiz.olunlade.9@gmail.com](mailto:muiz.olunlade.9@gmail.com)
- **GitHub**: [github.com/OlunladeMuiz](https://github.com/OlunladeMuiz)
- **LinkedIn**: [muiz-olunlade-1b12693a6](https://www.linkedin.com/in/muiz-olunlade-1b12693a6?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app)
- **Instagram**: [@muiz_olunlade](https://www.instagram.com/muiz_olunlade/?hl=en)

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎓 Learning Resources

Technologies used in this project:

- [Express.js Documentation](https://expressjs.com/)
- [MDN Web Docs - CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [express-validator Guide](https://express-validator.github.io/docs/)
- [Supabase Documentation](https://supabase.com/docs)
- [SendGrid Node.js Library](https://github.com/sendgrid/sendgrid-nodejs)
- [Web Accessibility (A11y)](https://www.w3.org/WAI/ARIA/apg/)

---

**Last Updated**: December 21, 2025

Made with ❤️ by Olunlade Muiz
