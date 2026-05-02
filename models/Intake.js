const mongoose = require('mongoose');

const IntakeSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  date: Date,
  water: {
    amount: Number,
    unit: { type: String, default: 'mL' },
    notes: String
  },
  food: {
    description: String,
    amount: { 
      value: Number,
      unit: String 
    },
    notes: String
  },
  stomachOutput: {
    description: String,
    amount: {
      value: Number,
      unit: String
    },
    notes: String
  },
  urineOutput: {
    description: String,
    amount: {
      value: Number,
      unit: String
    },
    color: String,
    notes: String
  },
  recordedBy: String,
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

module.exports = mongoose.model('Intake', IntakeSchema);
