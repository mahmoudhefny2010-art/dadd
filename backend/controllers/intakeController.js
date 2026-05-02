const Intake = require('../models/Intake');
const { logAudit } = require('../utils/auditLogger');

exports.createIntake = async (req, res) => {
  try {
    const intakeData = {
      ...req.body,
      recordedBy: req.user.email,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    };
    const intake = new Intake(intakeData);
    await intake.save();
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      req.body.patientId,
      'create',
      'intake',
      intake._id,
      { intake: req.body }
    );
    
    res.status(201).json(intake);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getIntakes = async (req, res) => {
  try {
    const { patientId } = req.query;
    const query = patientId ? { patientId } : {};
    const intakes = await Intake.find(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ date: -1 });
    res.json(intakes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getIntake = async (req, res) => {
  try {
    const intake = await Intake.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    if (!intake) return res.status(404).json({ error: 'Intake record not found' });
    res.json(intake);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateIntake = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user.userId,
      updatedAt: new Date()
    };
    const intake = await Intake.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    if (!intake) return res.status(404).json({ error: 'Intake record not found' });
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      intake.patientId,
      'update',
      'intake',
      intake._id,
      { updated: req.body }
    );
    
    res.json(intake);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteIntake = async (req, res) => {
  try {
    const intake = await Intake.findByIdAndDelete(req.params.id);
    if (!intake) return res.status(404).json({ error: 'Intake record not found' });
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      intake.patientId,
      'delete',
      'intake',
      intake._id,
      { deleted: true }
    );
    
    res.json({ message: 'Intake record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
