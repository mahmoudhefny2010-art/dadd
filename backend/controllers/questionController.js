const Question = require('../models/Question');
const { logAudit } = require('../utils/auditLogger');

exports.createQuestion = async (req, res) => {
  try {
    const questionData = {
      ...req.body,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    };
    const question = new Question(questionData);
    await question.save();
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      req.body.patientId,
      'create',
      'question',
      question._id,
      { question: req.body.question }
    );
    
    res.status(201).json(question);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const { patientId, status } = req.query;
    const query = {};
    if (patientId) query.patientId = patientId;
    if (status) query.status = status;
    const questions = await Question.find(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    if (!question) return res.status(404).json({ error: 'Question not found' });
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user.userId,
      updatedAt: new Date()
    };
    const question = await Question.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    if (!question) return res.status(404).json({ error: 'Question not found' });
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      question.patientId,
      'update',
      'question',
      question._id,
      { updated: req.body }
    );
    
    res.json(question);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      question.patientId,
      'delete',
      'question',
      question._id,
      { deleted: true }
    );
    
    res.json({ message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
