const mongoose = require('mongoose');

const ObservationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  vitals: {
    bloodSugar: {
      value: Number,
      unit: { type: String, default: 'mg/dL' }
    },
    bloodPressure: {
      systolic: Number,
      diastolic: Number,
      unit: { type: String, default: 'mmHg' }
    },
    oxygenLevel: {
      value: Number,
      unit: { type: String, default: '%' }
    },
    heartRate: {
      value: Number,
      unit: { type: String, default: 'bpm' }
    },
    temperature: {
      value: Number,
      unit: { type: String, default: '°C' }
    }
  },
  notes: String,
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

module.exports = mongoose.model('Observation', ObservationSchema);
