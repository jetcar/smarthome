'use strict';

const { Router } = require('express');
const deviceManager = require('../services/deviceManager');
const heatingService = require('../services/heatingService');

const router = Router();

function getHeating(req, res) {
  const device = deviceManager.getById(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  if (device.type !== 'floor_heating') return res.status(400).json({ error: 'Device is not a floor heating zone' });
  return device;
}

// GET /api/heating - all heating zones
router.get('/', (req, res) => {
  res.json(deviceManager.getByType('floor_heating'));
});

// GET /api/heating/:id - single zone
router.get('/:id', (req, res) => {
  const device = getHeating(req, res);
  if (!device) return;
  res.json(device);
});

// POST /api/heating/:id/power
router.post('/:id/power', (req, res) => {
  const device = getHeating(req, res);
  if (!device) return;
  const { heating } = req.body;
  if (typeof heating !== 'boolean') return res.status(400).json({ error: 'heating must be a boolean' });
  const updated = heatingService.setHeating(device, heating);
  res.json(updated);
});

// POST /api/heating/:id/temperature
router.post('/:id/temperature', (req, res) => {
  const device = getHeating(req, res);
  if (!device) return;
  const { temperature } = req.body;
  if (typeof temperature !== 'number') return res.status(400).json({ error: 'temperature must be a number' });
  try {
    const updated = heatingService.setTargetTemp(device, temperature);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/heating/:id/mode
router.post('/:id/mode', (req, res) => {
  const device = getHeating(req, res);
  if (!device) return;
  const { mode } = req.body;
  if (!mode) return res.status(400).json({ error: 'mode is required' });
  try {
    const updated = heatingService.setMode(device, mode);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/heating/:id/schedule
router.put('/:id/schedule', (req, res) => {
  const device = getHeating(req, res);
  if (!device) return;
  const { schedule } = req.body;
  try {
    const updated = heatingService.updateSchedule(device, schedule);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
