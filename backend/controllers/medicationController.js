const Medication = require('../models/Medication');
const { logAudit } = require('../utils/auditLogger');

exports.createMedication = async (req, res) => {
  try {
    const medicationData = {
      ...req.body,
      recordedBy: req.user.email,
      createdBy: req.user.userId,
      updatedBy: req.user.userId,
      changeHistory: [{
        date: new Date(),
        action: 'created',
        changedBy: req.user.userId,
        changedByName: req.user.email,
        changes: { created: req.body.name }
      }]
    };
    const medication = new Medication(medicationData);
    await medication.save();
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      req.body.patientId,
      'create',
      'medication',
      medication._id,
      { action: 'created', medication: req.body.name }
    );
    
    res.status(201).json(medication);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getMedications = async (req, res) => {
  try {
    const { patientId, status } = req.query;
    const query = patientId ? { patientId } : {};
    if (status) query.status = status;
    
    const medications = await Medication.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(medications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMedication = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    if (!medication) return res.status(404).json({ error: 'Medication not found' });
    res.json(medication);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMedication = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) return res.status(404).json({ error: 'Medication not found' });
    
    const oldData = { ...medication.toObject() };
    
    const updateData = {
      ...req.body,
      updatedBy: req.user.userId,
      updatedAt: new Date()
    };
    
    // Add to change history
    updateData.$push = {
      changeHistory: {
        date: new Date(),
        action: 'updated',
        changedBy: req.user.userId,
        changedByName: req.user.email,
        changes: req.body,
        reason: req.body.changeReason || ''
      }
    };
    
    const updatedMed = await Medication.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      medication.patientId,
      'update',
      'medication',
      medication._id,
      { action: 'updated', changes: req.body }
    );
    
    res.json(updatedMed);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Stop medication
exports.stopMedication = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) return res.status(404).json({ error: 'Medication not found' });
    
    const updateData = {
      status: 'stopped',
      endDate: req.body.endDate || new Date(),
      updatedBy: req.user.userId,
      updatedAt: new Date(),
      $push: {
        changeHistory: {
          date: new Date(),
          action: 'stopped',
          changedBy: req.user.userId,
          changedByName: req.user.email,
          reason: req.body.reason || 'Medication discontinued'
        }
      }
    };
    
    const updatedMed = await Medication.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      medication.patientId,
      'update',
      'medication',
      medication._id,
      { action: 'stopped', reason: req.body.reason }
    );
    
    res.json(updatedMed);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Replace medication (stop old, note relationship)
exports.replaceMedication = async (req, res) => {
  try {
    const oldMedication = await Medication.findById(req.params.id);
    if (!oldMedication) return res.status(404).json({ error: 'Medication not found' });

    const replacementReason = req.body.reason || `Replaced with ${req.body.newMedicationName}`;
    
    // Stop the old medication
    const updateData = {
      status: 'replaced',
      endDate: req.body.replacementDate || new Date(),
      updatedBy: req.user.userId,
      $push: {
        changeHistory: {
          date: new Date(),
          action: 'replaced',
          changedBy: req.user.userId,
          changedByName: req.user.email,
          reason: replacementReason,
          changes: { replacedWith: req.body.newMedicationName }
        }
      }
    };
    
    const stoppedMed = await Medication.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    // Create new medication
    const newMedication = new Medication({
      ...req.body.newMedicationData,
      patientId: oldMedication.patientId,
      createdBy: req.user.userId,
      updatedBy: req.user.userId,
      recordedBy: req.user.email,
      startDate: req.body.replacementDate || new Date(),
      changeHistory: [{
        date: new Date(),
        action: 'created',
        changedBy: req.user.userId,
        changedByName: req.user.email,
        reason: req.body.reason ? `Replacement for ${oldMedication.name} - ${req.body.reason}` : `Replacement for ${oldMedication.name}`,
        changes: { replacedFrom: oldMedication.name }
      }]
    });
    
    await newMedication.save();
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      oldMedication.patientId,
      'update',
      'medication',
      oldMedication._id,
      { action: 'replaced', replacedWith: req.body.newMedicationName }
    );
    
    res.json({
      stopped: stoppedMed,
      new: newMedication
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add checklist entry (medication taken)
exports.addChecklistEntry = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id);
    if (!medication) return res.status(404).json({ error: 'Medication not found' });
    
    const checklistEntry = {
      date: req.body.date || new Date(),
      time: req.body.time || new Date().toLocaleTimeString(),
      taken: req.body.taken !== false,
      takenBy: req.user.email,
      notes: req.body.notes || '',
      recordedAt: new Date()
    };
    
    medication.checklist.push(checklistEntry);
    await medication.save();
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      medication.patientId,
      'update',
      'medication',
      medication._id,
      { action: 'checklist_entry', entry: checklistEntry }
    );
    
    res.json(medication);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get medication history/change log
exports.getMedicationHistory = async (req, res) => {
  try {
    const medication = await Medication.findById(req.params.id)
      .populate('changeHistory.changedBy', 'name email');
    
    if (!medication) return res.status(404).json({ error: 'Medication not found' });
    
    res.json({
      medication: {
        id: medication._id,
        name: medication.name,
        status: medication.status
      },
      changeHistory: medication.changeHistory.reverse(),
      checklist: medication.checklist.reverse()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMedication = async (req, res) => {
  try {
    const medication = await Medication.findByIdAndDelete(req.params.id);
    if (!medication) return res.status(404).json({ error: 'Medication not found' });
    
    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      medication.patientId,
      'delete',
      'medication',
      medication._id,
      { deleted: true }
    );
    
    res.json({ message: 'Medication deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
