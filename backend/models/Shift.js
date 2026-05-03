const mongoose = require('mongoose');

const ShiftSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  staffName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['doctor', 'nurse'],
    required: true
  },
  shiftStart: {
    type: Date,
    required: true
  },
  shiftEnd: {
    type: Date,
    required: true
  },
  notes: String,
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

ShiftSchema.index({ patientId: 1, shiftStart: -1 });

module.exports = mongoose.model('Shift', ShiftSchema);
