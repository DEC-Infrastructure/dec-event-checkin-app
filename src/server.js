/**
 * Simple Node.js Server for Event Check-In Application
 * 
 * This server reads environment variables from .env file and serves them to the client.
 * Run with: node server.js
 */

const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Endpoint to provide safe configuration to client (NO SECRETS)
app.get('/api/config', (req, res) => {
    res.json({
        LOOKUP_ENDPOINT: process.env.LOOKUP_ENDPOINT || 'https://automation.decjobboard.online/webhook/lookup-checkin',
        UPDATE_ENDPOINT: process.env.UPDATE_ENDPOINT || 'https://automation.decjobboard.online/webhook/update-checkin',
        NODE_ENV: process.env.NODE_ENV || 'development'
    });
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
