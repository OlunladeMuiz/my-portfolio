const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
// Initialize SendGrid (if configured) and Supabase clients for robust handling
const sgMail = require('@sendgrid/mail');
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    log('info', 'SendGrid client configured');
} else {
    log('warn', 'SENDGRID_API_KEY not set; email sending is disabled');
}

// Supabase client (optional). Use SUPABASE_URL and SUPABASE_SERVICE_KEY when available.
const { createClient } = require('@supabase/supabase-js');
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
    try {
        supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });
        log('info', 'Supabase client initialized');
    } catch (err) {
        log('error', 'Failed to initialize Supabase client', err && err.stack ? err.stack : err);
    }
}

const { randomUUID } = require('crypto');

// Save to Supabase with idempotency (request_id) if configured, otherwise fallback to file-based idempotent write
async function saveSubmissionRecord({ request_id, name, email, subject, message, ip, user_agent }) {
    if (!request_id) request_id = randomUUID();
    if (supabase) {
        // Try to find existing record
        try {
            const { data: existing, error: selectErr } = await supabase.from('submissions').select('*').eq('request_id', request_id).limit(1).maybeSingle();
            if (selectErr) throw selectErr;
            if (existing) return existing;
            // Insert new record
            const { data, error } = await supabase.from('submissions').insert([{ request_id, name, email, subject, message, ip_address: ip, user_agent }]).select();
            if (error) {
                // If duplicate error occurs, fetch the existing row
                log('warn', 'Supabase insert error', error);
                const { data: row } = await supabase.from('submissions').select('*').eq('request_id', request_id).limit(1).maybeSingle();
                return row;
            }
            return (data && data[0]) || data;
        } catch (err) {
            log('error', 'Supabase save failed', err && err.stack ? err.stack : err);
            throw err;
        }
    }

    // File fallback with idempotency
    try {
        const content = await fsPromises.readFile(submissionsFile, 'utf8').catch(() => '[]');
        const arr = JSON.parse(content || '[]');
        const existing = arr.find(s => s.request_id === request_id);
        if (existing) return existing;
        const record = { id: Date.now(), request_id, name, email, subject, message, ip_address: ip, user_agent, status: 'pending', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        arr.push(record);
        await fsPromises.writeFile(submissionsFile + '.tmp', JSON.stringify(arr, null, 2), 'utf8');
        await fsPromises.rename(submissionsFile + '.tmp', submissionsFile);
        return record;
    } catch (err) {
        log('error', 'File fallback save failed', err && err.stack ? err.stack : err);
        throw err;
    }
}

async function updateSubmissionStatus(request_id, updates) {
    updates.updated_at = new Date().toISOString();
    if (supabase) {
        const { error } = await supabase.from('submissions').update(updates).eq('request_id', request_id);
        if (error) log('error', 'Failed to update supabase record', error);
        return;
    }
    try {
        const content = await fsPromises.readFile(submissionsFile, 'utf8').catch(() => '[]');
        const arr = JSON.parse(content || '[]');
        const idx = arr.findIndex(s => s.request_id === request_id);
        if (idx === -1) return;
        arr[idx] = { ...arr[idx], ...updates };
        await fsPromises.writeFile(submissionsFile + '.tmp', JSON.stringify(arr, null, 2), 'utf8');
        await fsPromises.rename(submissionsFile + '.tmp', submissionsFile);
    } catch (err) {
        log('error', 'Failed to update file record', err && err.stack ? err.stack : err);
    }
}

// SendGrid helper with simple retry/backoff
async function sendEmailWithRetry({ to, from, subject, text, html, maxAttempts = 3 }) {
    if (!process.env.SENDGRID_API_KEY) {
        log('warn', 'SendGrid API key not configured. Skipping email send.');
        return { success: false, skipped: true };
    }
    let attempt = 0;
    let lastErr = null;
    const baseDelay = 500; // ms
    while (attempt < maxAttempts) {
        try {
            attempt++;
            const msg = { to, from, subject, text, html };
            const res = await sgMail.send(msg);
            const sgId = (res && res[0] && res[0].headers && res[0].headers['x-message-id']) || null;
            return { success: true, id: sgId };
        } catch (err) {
            lastErr = err;
            log('warn', `SendGrid attempt ${attempt} failed`, err && err.message ? err.message : err);
            // exponential backoff
            await new Promise(r => setTimeout(r, baseDelay * Math.pow(3, attempt - 1)));
        }
    }
    return { success: false, error: lastErr };
}

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure NODE_ENV defaults to development for local testing
if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
    log('info', 'NODE_ENV not set, defaulting to development mode');
}

// Basic config
const submissionsFile = path.join(__dirname, 'data', 'submissions.json');
// In production these MUST be set. For local dev, defaults allow easier testing.
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || (process.env.NODE_ENV === 'production' ? null : 'changeme');
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || (process.env.NODE_ENV === 'production' ? null : '*');
// Default recipient for email notifications when SendGrid is used locally.
// You can override this by setting SENDGRID_TO in your environment.
const SENDGRID_TO = process.env.SENDGRID_TO || 'muiz.olunlade.9@gmail.com';

// Ensure data directory exists
try {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
    if (!fs.existsSync(submissionsFile)) fs.writeFileSync(submissionsFile, '[]');
} catch (err) {
    console.error('Error creating data folder:', err);
}

// Minimal structured logger
function log(level, ...msgs) {
    const ts = new Date().toISOString();
    // Only log info, warn, error, and debug (not debug by default but can enable)
    const shouldLog = ['info', 'warn', 'error', 'debug'].includes(level);
    if (shouldLog) {
        console.log(ts, level, ...msgs);
    }
}

const fsPromises = fs.promises;
// Simple in-memory write queue to serialize file writes and avoid races/blocking
const writeQueue = [];
let writingQueue = false;

async function writeSubmissionAtomic(submission) {
    const tempFile = submissionsFile + '.tmp';
    try {
        const content = await fsPromises.readFile(submissionsFile, 'utf8').catch(() => '[]');
        const arr = JSON.parse(content || '[]');
        arr.push(submission);
        await fsPromises.writeFile(tempFile, JSON.stringify(arr, null, 2), 'utf8');
        await fsPromises.rename(tempFile, submissionsFile);
        return true;
    } catch (err) {
        // Best-effort cleanup
        try { await fsPromises.unlink(tempFile).catch(() => {}); } catch (e) {}
        throw err;
    }
}

async function enqueueSubmission(submission) {
    writeQueue.push(submission);
    if (writingQueue) return;
    writingQueue = true;
    while (writeQueue.length) {
        const item = writeQueue.shift();
        await writeSubmissionAtomic(item);
    }
    writingQueue = false;
}

// Request logging for debugging (minimal)
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) log('info', `${req.method} ${req.path}`, req.body || '');
    next();
});

app.use(express.json());
app.use(helmet());
if (!ALLOWED_ORIGIN && process.env.NODE_ENV === 'production') {
    console.error('ALLOWED_ORIGIN must be set in production to restrict CORS');
    process.exit(1);
}

// Configure CORS: in development, allow all origins (including mobile on same network)
// In production, require ALLOWED_ORIGIN to be set and restrict to that origin.
const corsOptions = {
    origin: function (origin, callback) {
        // In development, allow all origins (including requests without origin header)
        if (process.env.NODE_ENV !== 'production') {
            log('info', '[CORS] Development mode: allowing origin', origin || '(no origin header)');
            return callback(null, true);
        }
        
        // In production, check against ALLOWED_ORIGIN
        if (!origin || origin === 'null') {
            // Non-browser requests (file://, curl, Postman)
            return callback(null, true);
        }
        
        if (ALLOWED_ORIGIN === '*' || origin === ALLOWED_ORIGIN) {
            return callback(null, true);
        }
        
        log('warn', '[CORS] Production: blocked origin', origin);
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Requested-With', 'x-admin-token']
};

// Preflight handler MUST run before the global CORS middleware
app.options('/api/*', cors(corsOptions));

app.use(cors(corsOptions));

// JSON parse error handler: return JSON instead of HTML for invalid JSON requests
app.use((err, req, res, next) => {
    if (!err) return next();
    if (err instanceof SyntaxError || err.type === 'entity.parse.failed') {
        log('error', 'Invalid JSON in request body:', err.message || err);
        return res.status(400).json({ ok: false, error: 'Invalid JSON in request body' });
    }
    next(err);
});

// Rate limiter to help avoid spam (JSON responses)
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ ok: false, error: 'Too many requests, please try again later.' })
});

// (preflight handler moved earlier)

// Apply rate limiter only to non-OPTIONS requests
app.use('/api/', (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    limiter(req, res, next);
});

// Health
app.get('/', (req, res) => res.json({ ok: true, message: 'Contact API is running' }));

// Save contact form submissions with idempotency, Supabase & SendGrid integration
app.post('/api/users',
    // Validation & sanitization
    body('request_id').optional().isString().trim().isLength({ max: 200 }),
    body('name').isString().trim().isLength({ min: 1, max: 200 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('subject').isString().trim().isLength({ min: 1, max: 200 }).escape(),
    body('message').isString().trim().isLength({ min: 1, max: 2000 }).escape(),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ ok: false, errors: errors.array() });
        const { request_id, name, email, subject, message } = req.body || {};
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ ok: false, error: 'Missing fields' });
        }

        const ip = (req.get('x-forwarded-for') || req.ip || '').split(',')[0].trim();
        const ua = req.get('user-agent') || '';

        let record;
        try {
            record = await saveSubmissionRecord({ request_id, name, email, subject, message, ip, user_agent: ua });
        } catch (err) {
            log('error', 'Failed to persist submission', err && err.stack ? err.stack : err);
            return res.status(500).json({ ok: false, error: 'Failed to save submission' });
        }

        // If it was already sent previously, respond success without re-sending
        if (record && record.status === 'sent' && record.sendgrid_id) {
            return res.json({ ok: true, submission: record, note: 'Already sent' });
        }

        // Compose email
        const from = process.env.SENDGRID_FROM || `no-reply@${process.env.SENDGRID_FROM_DOMAIN || 'example.com'}`;
        const to = process.env.SENDGRID_TO || SENDGRID_TO;
        const emailSubject = `Contact form: ${subject}`;
        const text = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
        const html = `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong></p><p>${message.replace(/\n/g,'<br/>')}</p>`;

        const sendRes = await sendEmailWithRetry({ to, from, subject: emailSubject, text, html });

        if (sendRes.skipped) {
            // Email sending not configured; keep status pending
            await updateSubmissionStatus(record.request_id, { status: 'pending' });
            return res.json({ ok: true, submission: record, email: { skipped: true } });
        }

        if (sendRes.success) {
            await updateSubmissionStatus(record.request_id, { status: 'sent', sendgrid_id: sendRes.id || null });
            const updated = { ...record, status: 'sent', sendgrid_id: sendRes.id || null };
            return res.json({ ok: true, submission: updated });
        }

        // Permanent failure or after retries
        const errMsg = sendRes.error && sendRes.error.message ? sendRes.error.message : String(sendRes.error || 'Unknown error');
        await updateSubmissionStatus(record.request_id, { status: 'failed', error: errMsg });
        return res.status(502).json({ ok: false, error: 'Failed to send notification email' });
    });

// Debug echo endpoint for troubleshooting CORS and body parsing issues
app.post('/api/_debug/echo', (req, res) => {
    const origin = req.get('origin');
    log('debug', '[DEBUG ECHO] Received request', { origin, headers: req.headers, body: req.body });
    return res.json({ ok: true, origin, headers: { referer: req.get('referer') }, body: req.body });
});

// List submissions (admin only)
app.get('/api/users', (req, res) => {
    const token = req.get('x-admin-token');
    if (!ADMIN_TOKEN || ADMIN_TOKEN === 'changeme') {
        log('warn', 'ADMIN_TOKEN is not set to a secure value. Protect the endpoint using environment variable ADMIN_TOKEN.');
    }
    if (!token || token !== ADMIN_TOKEN) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    try {
        const content = fs.readFileSync(submissionsFile, 'utf8');
        const arr = JSON.parse(content || '[]');
        return res.json({ ok: true, submissions: arr });
    } catch (err) {
        log('error', 'Failed to read submissions', err);
        return res.status(500).json({ ok: false, error: 'Failed to read submissions' });
    }
});

// Global error handler: JSON parse errors and others
app.use((err, req, res, next) => {
    if (!err) return next();
    if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
        log('error', 'Invalid JSON in request body (global handler):', err.message || err);
        return res.status(400).json({ ok: false, error: 'Invalid JSON in request body' });
    }
    log('error', 'Unhandled server error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
});

// Start server with robust error handling
function startServer() {
    try {
        const server = app.listen(PORT, () => log('info', `Contact API listening on port ${PORT}`));

        // Graceful shutdown handlers
        process.on('SIGINT', () => {
            log('info', 'SIGINT received: shutting down server');
            server.close(() => process.exit(0));
        });
        process.on('SIGTERM', () => {
            log('info', 'SIGTERM received: shutting down server');
            server.close(() => process.exit(0));
        });

        return server;
    } catch (err) {
        log('error', 'Failed to start server:', err);
        process.exit(1);
    }
}

// Global handlers to capture unexpected errors and rejections
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err && err.stack ? err.stack : err);
    // do not exit immediately in development; attempt a graceful shutdown
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

startServer();
