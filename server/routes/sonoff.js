'use strict';

const { Router } = require('express');
const deviceManager = require('../services/deviceManager');
const sonoffService = require('../services/sonoffService');

const router = Router();

function getSonoff(req, res) {
  const device = deviceManager.getById(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  if (device.type !== 'sonoff') return res.status(400).json({ error: 'Device is not a Sonoff device' });
  return device;
}

// GET /api/sonoff - all sonoff devices
router.get('/', (req, res) => {
  res.json(deviceManager.getByType('sonoff'));
});

// GET /api/sonoff/:id - single sonoff
router.get('/:id', (req, res) => {
  const device = getSonoff(req, res);
  if (!device) return;
  res.json(device);
});

// POST /api/sonoff/:id/power
router.post('/:id/power', (req, res) => {
  const device = getSonoff(req, res);
  if (!device) return;
  const { power } = req.body;
  if (typeof power !== 'boolean') return res.status(400).json({ error: 'power must be a boolean' });
  const updated = sonoffService.setPower(device, power);
  res.json(updated);
});

// POST /api/sonoff/:id/reset-energy
router.post('/:id/reset-energy', (req, res) => {
  const device = getSonoff(req, res);
  if (!device) return;
  const updated = sonoffService.resetEnergy(device);
  res.json(updated);
});

module.exports = router;
