# Local API for Contact Form

This project includes a simple Express API (`server.js`) that saves contact form submissions to `data/submissions.json`.

Quick setup

1. Install dependencies:

```bash
npm install
```

2. Start the API server (default port 3000):

```bash
npm start
```

3. (Optional) Expose your local API to the internet using `localtunnel`:

```bash
npm run tunnel -- --subdomain your-unique-subdomain
# example: npm run tunnel -- --subdomain my-portfolio-api
```

The command prints a public URL (https://your-unique-subdomain.loca.lt) — use that as the API origin.

Notes
- The client `script.js` now uses the page origin as the API URL when available, and falls back to `http://localhost:3000/api/users` for local development.
- If you want to force a specific public URL, either host `server.js` on that domain, or set `API_URL` in `script.js` manually.

Security
- The GET `/api/users` route requires an admin token provided via header `x-admin-token` (see `server.js`).

Vercel Deployment (recommended for hosting frontend + serverless API)

Important: I can't use or accept account credentials on your behalf. Below are secure steps you can follow to deploy to Vercel and add persistent storage using Supabase.

1) Create a Vercel account and install the Vercel CLI, or sign in at https://vercel.com.

2) Prepare the project:

 - The repository root contains a serverless function at `api/users.js`. When deployed on Vercel, your contact form can post to `/api/users` on the same origin.

3) Persistent storage (choose one):

 - Supabase (recommended): create a Supabase project, add a table named `submissions` with columns `id` (bigint or bigint serial), `name`, `email`, `subject`, `message`, `receivedAt` (timestamp). Copy the `SUPABASE_URL` and `SUPABASE_KEY` (service role or anon key) and add them as Environment Variables on Vercel.
 - SendGrid (email-only): set `SENDGRID_API_KEY` and `SENDGRID_TO` env vars on Vercel to receive email copies of submissions.

4) Required Vercel environment variables (set in Project Settings → Environment Variables):

 - `SUPABASE_URL` (optional)
 - `SUPABASE_KEY` (optional)
 - `SENDGRID_API_KEY` (optional)
 - `SENDGRID_TO` (optional)
 - `ADMIN_TOKEN` (optional — used to protect GET /api/users)
 - `ALLOWED_ORIGIN` (optional — CORS origin, default `*`)

5) Deploy with Vercel CLI or Git integration:

```bash
# install vercel CLI
npm i -g vercel

# from project root
vercel login
vercel --prod
```

6) After deploy, your site origin will be the API origin; client `script.js` will post to `/api/users` automatically.

Security note: never paste account passwords or private keys into chat. Use the Vercel dashboard to add env vars.
# My Portfolio Contact API

This is a small Express API that accepts contact form submissions from a static portfolio site and saves them to a local JSON file. It is designed to be deployed to Heroku or any Node.js hosting provider.

Features:
- POST /api/users: Accepts { name, email, subject, message } and returns submission object.
- GET /api/users: Returns saved submissions (requires `x-admin-token` header matching `ADMIN_TOKEN`).

Run locally:
1. Install dependencies:
```bash
npm install
```
2. Start server:
```bash
npm start
```
3. Test with curl:
```bash
curl -X POST -H "Content-Type: application/json" -d '{"name":"Test","email":"a@b.com","subject":"Hello","message":"Hi"}' http://localhost:3000/api/users
```

Heroku deploy steps:
1. Login to Heroku: `heroku login`.
2. Create an app: `heroku create <your-app-name>`.
3. Push your code: `git push heroku main` (or `master` depending on branch).
4. Set environment vars:
```bash
heroku config:set ADMIN_TOKEN="your-secret-token" ALLOWED_ORIGIN="https://yourdomain.com"
```
If you want email notifications, set SendGrid variables:
```bash
heroku config:set SENDGRID_API_KEY="<your-sendgrid-key>" SENDGRID_TO="you@yourdomain.com" SENDGRID_FROM="no-reply@yourdomain.com"
```
5. Visit your app: `heroku open` or test POST with `curl`.

Notes:
- By default submissions are saved to `data/submissions.json`. For scalability use a database (Postgres, MongoDB) or a third party mail service for notifications.
- For CORS, set `ALLOWED_ORIGIN` to your website domain.
- For production email sending, use SendGrid, Mailgun, or similar services and store API keys in environment variables.
