const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');
// Optional: uncomment to enable SendGrid notifications
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic config
const submissionsFile = path.join(__dirname, 'data', 'submissions.json');
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'changeme';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

// Ensure data directory exists
try {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
    if (!fs.existsSync(submissionsFile)) fs.writeFileSync(submissionsFile, '[]');
} catch (err) {
    console.error('Error creating data folder:', err);
}

app.use(express.json());
app.use(cors({ origin: ALLOWED_ORIGIN }));

// Rate limiter to help avoid spam
const limiter = rateLimit({ windowMs: 60 * 1000, max: 10 });
app.use('/api/', limiter);

// Health
app.get('/', (req, res) => res.json({ ok: true, message: 'Contact API is running' }));

// Save contact form submissions
app.post('/api/users', (req, res) => {
    const { name, email, subject, message } = req.body || {};
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ ok: false, error: 'Missing fields' });
    }
    const submission = {
        id: Date.now(),
        name,
        email,
        subject,
        message,
        receivedAt: new Date().toISOString()
    };
    // append to JSON
    try {
        const content = fs.readFileSync(submissionsFile, 'utf8');
        const arr = JSON.parse(content || '[]');
        arr.push(submission);
        fs.writeFileSync(submissionsFile, JSON.stringify(arr, null, 2));
    } catch (err) {
        console.error('Failed to save submission', err);
        return res.status(500).json({ ok: false, error: 'Failed to save submission' });
    }

    // Here you could send email or push to DB, but we are keeping it simple.
    // Example SendGrid usage (uncomment and set SENDGRID_API_KEY and SENDGRID_TO):
    // if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_TO) {
    //   sgMail.send({
    //     to: process.env.SENDGRID_API_KEY_TO || process.env.SENDGRID_TO,
    //     from: process.env.SENDGRID_FROM || 'no-reply@yourdomain.com',
    //     subject: `New message from ${name}: ${subject}`,
    //     text: `${message}\n\nFrom: ${name} <${email}>`
    //   }).catch(e => console.error('SendGrid error', e));
    // }
    return res.json({ ok: true, submission });
});

// List submissions (admin only)
app.get('/api/users', (req, res) => {
    const token = req.get('x-admin-token');
    if (!token || token !== ADMIN_TOKEN) {
        return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    try {
        const content = fs.readFileSync(submissionsFile, 'utf8');
        const arr = JSON.parse(content || '[]');
        return res.json({ ok: true, submissions: arr });
    } catch (err) {
        console.error('Failed to read submissions', err);
        return res.status(500).json({ ok: false, error: 'Failed to read submissions' });
    }
});

// Start
app.listen(PORT, () => console.log(`Contact API listening on port ${PORT}`));
