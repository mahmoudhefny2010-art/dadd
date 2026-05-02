const mongoose = require('mongoose');

const MedicationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['oral', 'injection', 'iv', 'topical', 'inhaler'],
    required: true
  },
  dosage: {
    amount: Number,
    unit: String
  },
  frequency: String,
  schedule: [String], // e.g., ["08:00", "14:00", "20:00"]
  purpose: String,
  startDate: Date,
  endDate: Date,
  status: {
    type: String,
    enum: ['active', 'stopped', 'paused', 'replaced'],
    default: 'active'
  },
  notes: String,
  recordedBy: String,
  
  // Change history
  changeHistory: [{
    date: { type: Date, default: Date.now },
    action: { type: String, enum: ['created', 'updated', 'stopped', 'replaced', 'resumed'] },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedByName: String,
    changes: mongoose.Schema.Types.Mixed, // captures what changed
    reason: String // reason for change
  }],
  
  // Adherence/Checklist tracking
  checklist: [{
    date: Date,
    time: String,
    taken: { type: Boolean, default: false },
    takenBy: String,
    notes: String,
    recordedAt: { type: Date, default: Date.now }
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Index for efficient querying
MedicationSchema.index({ patientId: 1, status: 1 });
MedicationSchema.index({ patientId: 1, 'changeHistory.date': -1 });

module.exports = mongoose.model('Medication', MedicationSchema);
