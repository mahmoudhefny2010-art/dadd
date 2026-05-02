const Patient = require('../models/Patient');
const { logAudit } = require('../utils/auditLogger');

exports.createPatient = async (req, res) => {
  try {
    const patientData = {
      ...req.body,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    };
    const patient = new Patient(patientData);
    await patient.save();
    
    // Log audit
    await logAudit(
      req.user.userId,
      req.user.email,
      'admin',
      patient._id,
      'create',
      'patient',
      patient._id,
      { created: true }
    );
    
    res.status(201).json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user.userId,
      updatedAt: new Date()
    };
    const patient = await Patient.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    
    // Log audit
    await logAudit(
      req.user.userId,
      req.user.email,
      'admin',
      patient._id,
      'update',
      'patient',
      patient._id,
      { updated: req.body }
    );
    
    res.json(patient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    
    // Log audit
    await logAudit(
      req.user.userId,
      req.user.email,
      'admin',
      patient._id,
      'delete',
      'patient',
      patient._id,
      { deleted: patient }
    );
    
    res.json({ message: 'Patient deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
