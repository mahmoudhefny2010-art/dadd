const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');

router.post('/', medicationController.createMedication);
router.get('/', medicationController.getMedications);
router.get('/:id', medicationController.getMedication);
router.get('/:id/history', medicationController.getMedicationHistory);
router.put('/:id', medicationController.updateMedication);
router.post('/:id/stop', medicationController.stopMedication);
router.post('/:id/replace', medicationController.replaceMedication);
router.post('/:id/checklist', medicationController.addChecklistEntry);
router.delete('/:id', medicationController.deleteMedication);

module.exports = router;
