require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { authenticateToken } = require('../backend/middleware/auth');

const app = express();

const frontendPath = path.join(__dirname, '..', 'frontend');

const authUser = process.env.SITE_USERNAME || '';
const authPass = process.env.SITE_PASSWORD || '';

let cached = global.mongoose;
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/dad-medical-tracker';
        cached.promise = mongoose.connect(uri).then(mongooseInstance => mongooseInstance);
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

function isAuthConfigured() {
    return Boolean(authUser && authPass);
}

function basicAuth(req, res, next) {
    if (!isAuthConfigured()) {
        return next();
    }

    const authHeader = req.headers.authorization || '';
    const [scheme, encoded] = authHeader.split(' ');
    if (scheme === 'Basic' && encoded) {
        const decoded = Buffer.from(encoded, 'base64').toString('utf8');
        const [user, pass] = decoded.split(':');
        if (user === authUser && pass === authPass) {
            return next();
        }
    }

    res.setHeader('WWW-Authenticate', 'Basic realm="Medical Tracker"');
    return res.status(401).send('Authentication required');
}

app.disable('x-powered-by');
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(basicAuth);

app.use(async (req, res, next) => {
    try {
        await connectToDatabase();
        next();
    } catch (error) {
        next(error);
    }
});

// Auth Routes (no authentication required)
app.use('/api/auth', require('../backend/routes/auth'));

// Protected Routes (require authentication)
app.use('/api/patients', authenticateToken, require('../backend/routes/patients'));
app.use('/api/observations', authenticateToken, require('../backend/routes/observations'));
app.use('/api/medications', authenticateToken, require('../backend/routes/medications'));
app.use('/api/questions', authenticateToken, require('../backend/routes/questions'));
app.use('/api/intakes', authenticateToken, require('../backend/routes/intakes'));
app.use('/api/audit', authenticateToken, require('../backend/routes/audit'));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Serve frontend
app.use(express.static(frontendPath));

// SPA fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

module.exports = (req, res) => {
    app(req, res);
};
