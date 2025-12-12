One-click GitHub → Vercel setup

This file explains how to create a GitHub repository from this project and perform a one-click import to Vercel. It also lists the environment variables you'll need to paste into the Vercel Dashboard.

1) Create a GitHub repository

 - From your local project folder run:

```bash
git init
git add .
git commit -m "Initial commit: portfolio + API"
# create remote (replace USERNAME and REPO)
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

2) One‑click import to Vercel

 - Go to: https://vercel.com/new
 - Authorize GitHub and select your repository.
 - Vercel will detect the `api/` serverless functions and deploy the site.

Alternatively you can use the import URL (replace `USERNAME/REPO`):

```
https://vercel.com/new?repo=USERNAME/REPO
```

3) Environment variables (paste these into Vercel Project Settings → Environment Variables)

 - `SUPABASE_URL` — your Supabase REST endpoint (e.g. https://xyz.supabase.co)
 - `SUPABASE_KEY` — Supabase anon/service role key
 - `SENDGRID_API_KEY` — API key for SendGrid (optional if using email fallback)
 - `SENDGRID_TO` — recipient email for form copies (required if using SendGrid)
 - `SENDGRID_FROM` — from email for SendGrid (optional)
 - `ADMIN_TOKEN` — random secret to protect GET `/api/users` (e.g. a long random string)
 - `ALLOWED_ORIGIN` — allowed CORS origin (default `*`, set to your domain for production)

Notes

 - The serverless function `api/users.js` will store into Supabase when `SUPABASE_URL` + `SUPABASE_KEY` are set. If not provided, it attempts to send email via SendGrid. Vercel's filesystem is ephemeral — do not rely on saving to disk in production.
 - Don't share secrets in chat. Use the Vercel Dashboard UI to paste env vars.

Optional: Automatic import link for templates

 - After pushing to GitHub you can create a direct import link like:

```
https://vercel.com/new?repo=USERNAME/REPO&env=SUPABASE_URL,SUPABASE_KEY,SENDGRID_API_KEY,SENDGRID_TO,ADMIN_TOKEN
```

Replace `USERNAME/REPO` and follow prompts to set environment variables during import.
