const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');

// Get audit logs for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const logs = await AuditLog.find({ patientId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('userId', 'name email role');

    const total = await AuditLog.countDocuments({ patientId });

    res.json({
      logs,
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get audit logs for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const logs = await AuditLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('userId', 'name email role');

    const total = await AuditLog.countDocuments({ userId });

    res.json({
      logs,
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all recent audit logs
router.get('/', async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;

    const logs = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('userId', 'name email role')
      .populate('patientId', 'name');

    const total = await AuditLog.countDocuments();

    res.json({
      logs,
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
