const Observation = require('../models/Observation');
const { logAudit } = require('../utils/auditLogger');

exports.createObservation = async (req, res) => {
  try {
    const observationData = {
      ...req.body,
      recordedBy: req.user.email,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    };
    const observation = new Observation(observationData);
    await observation.save();
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      req.body.patientId,
      'create',
      'observation',
      observation._id,
      { vitals: req.body.vitals }
    );
    
    res.status(201).json(observation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getObservations = async (req, res) => {
  try {
    const { patientId } = req.query;
    const query = patientId ? { patientId } : {};
    const observations = await Observation.find(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(observations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getObservation = async (req, res) => {
  try {
    const observation = await Observation.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    if (!observation) return res.status(404).json({ error: 'Observation not found' });
    res.json(observation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateObservation = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user.userId,
      updatedAt: new Date()
    };
    const observation = await Observation.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    if (!observation) return res.status(404).json({ error: 'Observation not found' });
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      observation.patientId,
      'update',
      'observation',
      observation._id,
      { updated: req.body }
    );
    
    res.json(observation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteObservation = async (req, res) => {
  try {
    const observation = await Observation.findByIdAndDelete(req.params.id);
    if (!observation) return res.status(404).json({ error: 'Observation not found' });
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      observation.patientId,
      'delete',
      'observation',
      observation._id,
      { deleted: true }
    );
    
    res.json({ message: 'Observation deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
