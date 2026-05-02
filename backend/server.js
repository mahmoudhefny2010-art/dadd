require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { authenticateToken } = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dad-medical-tracker')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Auth Routes (no authentication required)
app.use('/api/auth', require('./routes/auth'));

// Protected Routes (require authentication)
app.use('/api/patients', authenticateToken, require('./routes/patients'));
app.use('/api/observations', authenticateToken, require('./routes/observations'));
app.use('/api/medications', authenticateToken, require('./routes/medications'));
app.use('/api/questions', authenticateToken, require('./routes/questions'));
app.use('/api/intakes', authenticateToken, require('./routes/intakes'));
app.use('/api/audit', authenticateToken, require('./routes/audit'));

// Serve frontend
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

const PORT = process.env.PORT || 6001;
app.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`Server running on port ${PORT}`);
  console.log(`\x1b]8;;${url}\x1b\\Click here to open: ${url}\x1b]8;;\x1b\\`);
});
