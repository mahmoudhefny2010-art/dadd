const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  userRole: String,
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'view'],
    required: true
  },
  dataType: {
    type: String,
    enum: ['question', 'observation', 'medication', 'intake', 'patient'],
    required: true
  },
  dataId: mongoose.Schema.Types.ObjectId,
  changes: mongoose.Schema.Types.Mixed, // Store old and new values
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Create index for efficient querying
AuditLogSchema.index({ patientId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
