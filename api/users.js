// Vercel serverless function to handle contact form submissions
// - POST /api/users  -> create submission (stores in Supabase when configured or emails via SendGrid)
// - GET  /api/users  -> list submissions (requires x-admin-token header matching ADMIN_TOKEN)

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';
const SUPABASE_URL = process.env.SUPABASE_URL; // e.g. https://xyz.supabase.co
const SUPABASE_KEY = process.env.SUPABASE_KEY; // anon or service role key
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_TO = process.env.SENDGRID_TO; // email to receive submissions

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-token');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'POST') {
      const { name, email, subject, message } = req.body || {};
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ ok: false, error: 'Missing fields' });
      }
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
          body: JSON.stringify([{ name, email, subject, message, receivedAt }])
        });
        if (insertRes.ok) {
          const data = await insertRes.json();
          return res.json({ ok: true, submission: data[0] });
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

      // 3) If neither Supabase nor SendGrid is configured, return helpful error because
      //    Vercel serverless filesystem is ephemeral and cannot be relied on for persistence.
      return res.status(500).json({ ok: false, error: 'No persistent storage configured. Configure SUPABASE_URL+SUPABASE_KEY or SENDGRID_API_KEY+SENDGRID_TO.' });
    }

    if (req.method === 'GET') {
      const token = req.get('x-admin-token');
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
