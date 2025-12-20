// Vercel serverless function to handle contact form submissions
// - POST /api/users  -> create submission (stores in Supabase when configured or emails via SendGrid)
// - GET  /api/users  -> list submissions (requires x-admin-token header matching ADMIN_TOKEN)

// For production, set strong values for these in environment variables
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || (process.env.NODE_ENV === 'production' ? null : 'changeme');
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || (process.env.NODE_ENV === 'production' ? null : '*');
// Default to your Supabase project URL; override this by setting SUPABASE_URL in environment.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fcilspmbkcwwfihxcgod.supabase.co'; // e.g. https://xyz.supabase.co
const SUPABASE_KEY = process.env.SUPABASE_KEY; // anon or service role key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
// Default recipient for email notifications when SendGrid is used.
// Set SENDGRID_TO in your environment to override this value.
const SENDGRID_TO = process.env.SENDGRID_TO || 'muiz.olunlade.9@gmail.com'; // email to receive submissions

// SMTP fallback via nodemailer (useful when SendGrid or Supabase aren't configured)
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_SECURE = (process.env.SMTP_SECURE || 'false').toLowerCase() === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;


module.exports = async (req, res) => {
  if (!ALLOWED_ORIGIN && process.env.NODE_ENV === 'production') {
    console.error('ALLOWED_ORIGIN must be set in production to restrict CORS');
    return res.status(500).json({ ok: false, error: 'Server misconfigured: ALLOWED_ORIGIN' });
  }
  // Allow non-browser or file:/// origins while still honoring ALLOWED_ORIGIN in production.
    console.log('[Serverless] Incoming request', { method: req.method, path: req.url, origin: req.get('origin'), contentType: req.get('content-type') });
  const requestOrigin = req.get('origin');
  // Treat 'null' origin (file://) as no origin for local dev testing
  if (!requestOrigin || requestOrigin === 'null') {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (ALLOWED_ORIGIN === '*' || ALLOWED_ORIGIN === requestOrigin || (process.env.NODE_ENV !== 'production' && (requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1')))) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-token');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
      if (process.env.NODE_ENV === 'production' && SUPABASE_KEY && SUPABASE_KEY.length < 20) {
        console.warn('SUPABASE_KEY is set but seems short; ensure you are using a server-side key');
      }
    if (req.method === 'POST') {
      const { name, email, subject, message } = req.body || {};
        console.log('[Serverless] Body received', { name: name && name.length, email: email && email.length, subject: subject && subject.length, message: message && message.length });
      // Basic validation & sanitization
      if (!name || typeof name !== 'string' || name.length > 200) return res.status(400).json({ ok: false, error: 'Invalid name' });
      if (!email || typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ ok: false, error: 'Invalid email' });
      if (!subject || typeof subject !== 'string' || subject.length > 200) return res.status(400).json({ ok: false, error: 'Invalid subject' });
      if (!message || typeof message !== 'string' || message.length > 2000) return res.status(400).json({ ok: false, error: 'Invalid message' });
      const receivedAt = new Date().toISOString();

      // 1) Try Supabase insert when configured
      if (SUPABASE_URL && SUPABASE_KEY) {
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/submissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            Prefer: 'return=representation'
          },
          body: JSON.stringify([{ name, email, subject, message, received_at: receivedAt }])
        });
        if (insertRes.ok) {
          const data = await insertRes.json();
          // Supabase may return columns using snake_case; normalize keys in response
          const submission = data[0];
            console.log('[Serverless] Supabase insert: OK', submission && submission.id);
          return res.json({ ok: true, submission });
        }
        console.error('Supabase insert failed', await insertRes.text());
      }

      // 2) Fallback: send email via SendGrid if configured
      if (SENDGRID_API_KEY && SENDGRID_TO) {
        const mail = {
          personalizations: [{ to: [{ email: SENDGRID_TO }] }],
          from: { email: process.env.SENDGRID_FROM || SENDGRID_TO },
          subject: `New message from ${name}: ${subject}`,
          content: [{ type: 'text/plain', value: `${message}\n\nFrom: ${name} <${email}>` }]
        };
        const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: { Authorization: `Bearer ${SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(mail)
        });
        if (sgRes.ok) return res.json({ ok: true, method: 'sendgrid' });
        console.error('SendGrid failed', await sgRes.text());
      }

      // 2b) SMTP fallback via nodemailer (if configured)
      if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
        try {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: Number(SMTP_PORT), secure: SMTP_SECURE, auth: { user: SMTP_USER, pass: SMTP_PASS } });
          const mailOptions = {
            from: process.env.SMTP_FROM || SMTP_USER,
            to: SENDGRID_TO || process.env.SMTP_FROM || SMTP_USER,
            subject: `New message from ${name}: ${subject}`,
            text: `${message}\n\nFrom: ${name} <${email}>`
          };
          await transporter.sendMail(mailOptions);
          console.log('SMTP fallback: email sent via', SMTP_HOST);
          return res.json({ ok: true, method: 'smtp' });
        } catch (err) {
          console.error('SMTP fallback failed', err && err.stack ? err.stack : err);
        }
      }

      // 3) Ultimate fallback: try to persist to a temporary local file (ephemeral on serverless)
      try {
        const fs = require('fs');
        const tmpPath = '/tmp/submissions.json';
        let existing = [];
        try {
          const raw = fs.readFileSync(tmpPath, 'utf8');
          existing = JSON.parse(raw || '[]');
        } catch (e) { /* ignore */ }
        existing.push({ name, email, subject, message, received_at: receivedAt });
        fs.writeFileSync(tmpPath, JSON.stringify(existing, null, 2), 'utf8');
        console.warn('Stored submission to temporary file', tmpPath);
        return res.json({ ok: true, method: 'tmp', note: 'Stored to ephemeral filesystem; configure SUPABASE or SENDGRID for persistence.' });
      } catch (err) {
        console.error('Fallback temp file write failed', err && err.stack ? err.stack : err);
      }

      // 4) If none succeeded, return helpful error because
      //    Vercel serverless filesystem is ephemeral and cannot be relied on for persistence.
      return res.status(500).json({ ok: false, error: 'No persistent storage configured. Configure SUPABASE_URL+SUPABASE_KEY, SENDGRID_API_KEY+SENDGRID_TO, or SMTP_HOST+SMTP_USER+SMTP_PASS.' });
    }

    if (req.method === 'GET') {
      const token = req.get('x-admin-token');
      if (!ADMIN_TOKEN) {
        console.error('ADMIN_TOKEN is not set in environment. Fix by setting ADMIN_TOKEN');
        return res.status(500).json({ ok: false, error: 'ADMIN_TOKEN not configured' });
      }
      if (!token || token !== ADMIN_TOKEN) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
      }
      if (SUPABASE_URL && SUPABASE_KEY) {
        const listRes = await fetch(`${SUPABASE_URL}/rest/v1/submissions?select=*`, {
          method: 'GET',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
        });
        if (listRes.ok) {
          const rows = await listRes.json();
          return res.json({ ok: true, submissions: rows });
        }
        console.error('Supabase read failed', await listRes.text());
      }
      return res.status(500).json({ ok: false, error: 'No storage backend configured to list submissions.' });
    }

    res.setHeader('Allow', 'GET,POST,OPTIONS');
    return res.status(405).end();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
};
