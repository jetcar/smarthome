'use strict';

const { Router } = require('express');
const deviceManager = require('../services/deviceManager');

const router = Router();

// GET /api/devices - all devices
router.get('/', (req, res) => {
  res.json(deviceManager.getAll());
});

// GET /api/devices/id/:id - single device by id (must come before /:type)
router.get('/id/:id', (req, res) => {
  const device = deviceManager.getById(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  res.json(device);
});

// DELETE /api/devices/id/:id - remove device
router.delete('/id/:id', (req, res) => {
  const device = deviceManager.getById(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  deviceManager.removeDevice(req.params.id);
  res.json({ success: true });
});

// POST /api/devices/discover - simulate device discovery
router.post('/discover', (req, res) => {
  const discovered = [
    { id: 'socket3', name: 'Xiaomi Smart Socket 3', type: 'xiaomi_socket', ip: '192.168.1.103' },
    { id: 'ac3', name: 'Office AC', type: 'midea_ac', ip: '192.168.1.112' },
    { id: 'sonoff2', name: 'Sonoff Power Meter 2', type: 'sonoff', ip: '192.168.1.121' },
  ];
  res.json({ found: discovered.length, devices: discovered });
});

// GET /api/devices/:type - devices by type
router.get('/:type', (req, res) => {
  const devices = deviceManager.getByType(req.params.type);
  res.json(devices);
});

module.exports = router;
