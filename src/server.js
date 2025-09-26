/**
 * Simple Node.js Server for Event Check-In Application
 * 
 * This server reads environment variables from .env file and serves them to the client.
 * Run with: node server.js
 */

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Endpoint to provide safe configuration to client (NO SECRETS)
app.get('/api/config', (req, res) => {
    res.json({
        LOOKUP_ENDPOINT: process.env.LOOKUP_ENDPOINT || 'https://automation.decjobboard.online/webhook/lookup-checkin',
        UPDATE_ENDPOINT: process.env.UPDATE_ENDPOINT || 'https://automation.decjobboard.online/webhook/update-checkin',
        NODE_ENV: process.env.NODE_ENV || 'development'
    });
});

// Format date as yyyy-mm-dd hh:mm:ss (local time)
function formatDateTime(date) {
    const d = new Date(date);
    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

// Send check-in confirmation email (server-side; uses RESEND_KEY)
app.post('/api/send-checkin-email', async (req, res) => {
    try {
        const { toEmail, fullName, checkInTime } = req.body || {};

        if (!toEmail) {
            return res.status(400).json({ error: 'toEmail is required' });
        }

        const { Resend } = require('resend');
        const resendApiKey = process.env.RESEND_KEY;
        if (!resendApiKey) {
            return res.status(500).json({ error: 'Email service not configured' });
        }
        const resend = new Resend(resendApiKey);

        const templatePath = path.join(__dirname, '../public/email.html');
        let html = fs.readFileSync(templatePath, 'utf8');

        const safeName = (fullName && String(fullName).trim()) || 'there';
        const safeTime = formatDateTime((checkInTime && String(checkInTime).trim()) || new Date());

        // Insert name into greeting: "Hi ," -> "Hi <Name>,"
        html = html.replace(/Hi\s*,/i, `Hi ${safeName},`);

        // Insert check-in time just after the label span "Check-in Time:" regardless of extra spans
        // Matches: (Check-in Time:</span>) and appends a space + time
        const timeLabelRegex = /(Check-in\s*Time:\s*<\/span>)/i;
        if (timeLabelRegex.test(html)) {
            html = html.replace(timeLabelRegex, `$1 ${safeTime}`);
        }

        // Prepare attachment 
        const attachmentPath = path.join(__dirname, 'attachments/DEC Meetup Lagos 2025 Agenda.pdf');
        let attachments = [];
        try {
            const pdfBuffer = fs.readFileSync(attachmentPath);
            attachments.push({ filename: 'DEC Meetup Lagos 2025 Agenda.pdf', content: pdfBuffer });
        } catch (_) {
            // If file missing, send email without attachment
            attachments = [];
        }

        const fromEmail = process.env.EMAIL_FROM || 'noreply@dataengineeringcommunity.com';
        const fromAddress = `DEC Meetup Lagos <${fromEmail}>`;
        const subject = `Check-In Confirmed - Agenda Attached`;

        const result = await resend.emails.send({
            from: fromAddress,
            to: toEmail,
            subject,
            html,
            attachments
        });

        if (result && result.id) {
            return res.json({ success: true, id: result.id });
        }
        return res.status(500).json({ error: 'Failed to send email' });
    } catch (error) {
        console.error('Email send error:', error && error.message ? error.message : error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


// Secure endpoint to generate JWT tokens (server-side only)
app.post('/api/generate-jwt', (req, res) => {
    try {
        const jwt = require('jsonwebtoken');

        const payload = {
            sub: 'checkin-app',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
            iss: 'event-checkin'
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256' });

        res.json({ token });
    } catch (error) {
        console.error('Error generating JWT:', error);
        res.status(500).json({ error: 'Failed to generate JWT token' });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
    console.log(`Event Check-In server running on http://localhost:${PORT}`);
    console.log('Environment variables loaded from .env file');

    // Verify JWT_SECRET is loaded
    if (process.env.JWT_SECRET) {
        console.log('JWT_SECRET loaded successfully');
    } else {
        console.log('JWT_SECRET not found in .env file');
    }
});
