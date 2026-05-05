'use strict';

const { Router } = require('express');
const deviceManager = require('../services/deviceManager');
const mideaService = require('../services/mideaService');

const router = Router();

function getAc(req, res) {
  const device = deviceManager.getById(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  if (device.type !== 'midea_ac') return res.status(400).json({ error: 'Device is not a Midea AC' });
  return device;
}

// GET /api/midea - all AC units
router.get('/', (req, res) => {
  res.json(deviceManager.getByType('midea_ac'));
});

// GET /api/midea/:id - single AC
router.get('/:id', (req, res) => {
  const device = getAc(req, res);
  if (!device) return;
  res.json(device);
});

// POST /api/midea/:id/power
router.post('/:id/power', (req, res) => {
  const device = getAc(req, res);
  if (!device) return;
  const { power } = req.body;
  if (typeof power !== 'boolean') return res.status(400).json({ error: 'power must be a boolean' });
  const updated = mideaService.setAcPower(device, power);
  res.json(updated);
});

// POST /api/midea/:id/temperature
router.post('/:id/temperature', (req, res) => {
  const device = getAc(req, res);
  if (!device) return;
  const { temperature } = req.body;
  if (typeof temperature !== 'number') return res.status(400).json({ error: 'temperature must be a number' });
  try {
    const updated = mideaService.setAcTemperature(device, temperature);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/midea/:id/mode
router.post('/:id/mode', (req, res) => {
  const device = getAc(req, res);
  if (!device) return;
  const { mode } = req.body;
  if (!mode) return res.status(400).json({ error: 'mode is required' });
  try {
    const updated = mideaService.setAcMode(device, mode);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/midea/:id/fan
router.post('/:id/fan', (req, res) => {
  const device = getAc(req, res);
  if (!device) return;
  const { speed } = req.body;
  if (!speed) return res.status(400).json({ error: 'speed is required' });
  try {
    const updated = mideaService.setAcFanSpeed(device, speed);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/midea/:id/swing
router.post('/:id/swing', (req, res) => {
  const device = getAc(req, res);
  if (!device) return;
  const { swing } = req.body;
  if (typeof swing !== 'boolean') return res.status(400).json({ error: 'swing must be a boolean' });
  const updated = mideaService.setAcSwing(device, swing);
  res.json(updated);
});

module.exports = router;
