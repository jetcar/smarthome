'use strict';

const { Router } = require('express');
const deviceManager = require('../services/deviceManager');
const xiaomiService = require('../services/xiaomiService');

const router = Router();

function getSocket(req, res) {
  const device = deviceManager.getById(req.params.id);
  if (!device) return res.status(404).json({ error: 'Device not found' });
  if (device.type !== 'xiaomi_socket') return res.status(400).json({ error: 'Device is not a Xiaomi socket' });
  return device;
}

// GET /api/xiaomi/sockets - all sockets
router.get('/sockets', (req, res) => {
  res.json(deviceManager.getByType('xiaomi_socket'));
});

// POST /api/xiaomi/sockets/:id/power
router.post('/sockets/:id/power', (req, res) => {
  const device = getSocket(req, res);
  if (!device) return;
  const { power } = req.body;
  if (typeof power !== 'boolean') return res.status(400).json({ error: 'power must be a boolean' });
  const updated = xiaomiService.setSocketPower(device, power);
  res.json(updated);
});

// POST /api/xiaomi/sockets/:id/toggle
router.post('/sockets/:id/toggle', (req, res) => {
  const device = getSocket(req, res);
  if (!device) return;
  const updated = xiaomiService.toggleSocket(device);
  res.json(updated);
});

// GET /api/xiaomi/gateway
router.get('/gateway', (req, res) => {
  const gateways = deviceManager.getByType('xiaomi_gateway');
  if (!gateways.length) return res.status(404).json({ error: 'Gateway not found' });
  res.json(gateways[0]);
});

// POST /api/xiaomi/gateway/arm
router.post('/gateway/arm', (req, res) => {
  const gateways = deviceManager.getByType('xiaomi_gateway');
  if (!gateways.length) return res.status(404).json({ error: 'Gateway not found' });
  const { armed } = req.body;
  if (typeof armed !== 'boolean') return res.status(400).json({ error: 'armed must be a boolean' });
  const updated = xiaomiService.setGatewayArmed(gateways[0], armed);
  res.json(updated);
});

module.exports = router;
