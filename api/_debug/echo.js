// A small debug endpoint used by the client to verify POST and CORS behavior.
// Use it to validate that your serverless functions accept POST and respond to preflight requests.

module.exports = async (req, res) => {
  const origin = req.get('origin');
  console.log('[DEBUG ECHO] request', { method: req.method, origin, headers: req.headers });
  // Allow non-browser origin in dev
  if (!origin || origin === 'null') res.setHeader('Access-Control-Allow-Origin', '*');
  else res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-token');
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    return res.json({ ok: true, origin, body: req.body || null });
  } catch (err) {
    console.error('[DEBUG ECHO] failed', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
};