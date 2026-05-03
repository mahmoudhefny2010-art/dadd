const Shift = require('../models/Shift');
const { logAudit } = require('../utils/auditLogger');

exports.createShift = async (req, res) => {
  try {
    const shiftData = {
      ...req.body,
      createdBy: req.user.userId,
      updatedBy: req.user.userId
    };
    const shift = new Shift(shiftData);
    await shift.save();

    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      req.body.patientId,
      'create',
      'shift',
      shift._id,
      { shift: req.body }
    );

    res.status(201).json(shift);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getShifts = async (req, res) => {
  try {
    const { patientId } = req.query;
    const query = patientId ? { patientId } : {};
    const shifts = await Shift.find(query)
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name')
      .sort({ shiftStart: -1 });
    res.json(shifts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateShift = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      updatedBy: req.user.userId,
      updatedAt: new Date()
    };
    const shift = await Shift.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    if (!shift) return res.status(404).json({ error: 'Shift not found' });

    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      shift.patientId,
      'update',
      'shift',
      shift._id,
      { updated: req.body }
    );

    res.json(shift);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.deleteShift = async (req, res) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });

    await logAudit(
      req.user.userId,
      req.user.email,
      req.user.role,
      shift.patientId,
      'delete',
      'shift',
      shift._id,
      { deleted: true }
    );

    res.json({ message: 'Shift deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
