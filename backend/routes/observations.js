const express = require('express');
const router = express.Router();
const observationController = require('../controllers/observationController');

router.post('/', observationController.createObservation);
router.get('/', observationController.getObservations);
router.get('/:id', observationController.getObservation);
router.put('/:id', observationController.updateObservation);
router.delete('/:id', observationController.deleteObservation);

module.exports = router;
