#!/usr/bin/env node
// scripts/test-fallback.js
// Simple script to verify the contact API's fallback path. Exits with:
// 0 = persistent storage available (submission saved or email sent)
// 1 = error / unreachable
// 2 = fallback used (tmp) — notify or fail your CI when this occurs

const DEFAULT_URL = 'http://localhost:3000/api/users';
const args = process.argv.slice(2);
let apiUrl = process.env.API_URL || args[0] || DEFAULT_URL;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // optional webhook to notify when tmp is used
const TIMEOUT = Number(process.env.TIMEOUT_MS || 5000);

async function notifyWebhook(message, body) {
  if (!WEBHOOK_URL) return;
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message, detail: body })
    });
    console.log('Webhook notified.');
  } catch (err) {
    console.warn('Failed to notify webhook', err.message || err);
  }
}

(async function main() {
  console.log('Contact API fallback verifier');
  console.log('Target API URL:', apiUrl);

  const payload = {
    name: 'Fallback Test',
    email: `fallback+${Date.now()}@example.com`,
    subject: 'Fallback check',
    message: 'Automated fallback verification test'
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    clearTimeout(timer);

    let data = null;
    try { data = await res.json(); } catch (e) { data = { raw: await res.text() } }

    if (!res.ok) {
      console.error('Request failed:', res.status, data);
      await notifyWebhook(`Contact fallback check: ERROR ${res.status} (no response ok)`, { apiUrl, status: res.status, data });
      process.exit(1);
    }

    if (data && data.ok) {
      // Check for explicit method markers
      const method = data.method || (data.submission ? 'persistent' : undefined);
      console.log('Response OK. method:', method || '(unspecified)');
      if (method === 'tmp') {
        const msg = `ALERT: Contact API accepted submission but used TMP fallback on ${apiUrl}. Configure SUPABASE/SENDGRID/SMTP for persistence.`;
        console.warn(msg);
        await notifyWebhook(msg, { apiUrl, response: data });
        // Exit 2 to indicate fallback condition (CI should treat this as a warning/failure)
        process.exit(2);
      }

      // Treat as success (persistent storage / email sent)
      console.log('Persistent backend appears available or submission was accepted.', data);
      process.exit(0);
    }

    console.error('Unexpected response:', data);
    await notifyWebhook('Contact fallback check: unexpected response structure', { apiUrl, response: data });
    process.exit(1);

  } catch (err) {
    console.error('Error connecting to API:', err.message || err);
    await notifyWebhook(`Contact fallback check: network error (${err.message || err})`, { apiUrl });
    process.exit(1);
  }
})();
