const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  question: {
    type: String,
    required: true
  },
  category: String,
  status: {
    type: String,
    enum: ['pending', 'asked', 'answered'],
    default: 'pending'
  },
  answer: String,
  askedDate: Date,
  answeredDate: Date,
  askedBy: String,
  answeredBy: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
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

module.exports = mongoose.model('Question', QuestionSchema);
