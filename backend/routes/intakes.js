const express = require('express');
const router = express.Router();
const intakeController = require('../controllers/intakeController');

router.post('/', intakeController.createIntake);
router.get('/', intakeController.getIntakes);
router.get('/:id', intakeController.getIntake);
router.put('/:id', intakeController.updateIntake);
router.delete('/:id', intakeController.deleteIntake);

module.exports = router;
