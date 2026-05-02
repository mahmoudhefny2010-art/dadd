const AuditLog = require('../models/AuditLog');

async function logAudit(userId, userName, userRole, patientId, action, dataType, dataId, changes) {
  try {
    const log = new AuditLog({
      userId,
      userName,
      userRole,
      patientId,
      action,
      dataType,
      dataId,
      changes,
      timestamp: new Date()
    });
    await log.save();
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}

module.exports = { logAudit };
