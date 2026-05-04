'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const { Server } = require('socket.io');

const deviceManager = require('./services/deviceManager');
const devicesRouter = require('./routes/devices');
const xiaomiRouter = require('./routes/xiaomi');
const mideaRouter = require('./routes/midea');
const sonoffRouter = require('./routes/sonoff');
const heatingRouter = require('./routes/heating');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Wire up socket.io emission whenever device state changes
deviceManager.setStateChangeCallback((deviceId, state) => {
  io.emit('deviceUpdate', { deviceId, state });
});

// Routes
app.use('/api/devices', devicesRouter);
app.use('/api/xiaomi', xiaomiRouter);
app.use('/api/midea', mideaRouter);
app.use('/api/sonoff', sonoffRouter);
app.use('/api/heating', heatingRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Socket.io connection handling
io.on('connection', (socket) => {
  socket.emit('allDevices', deviceManager.getAll());
});

// Simulate periodic state fluctuations (power consumption)
let simulationInterval = null;

function startSimulation() {
  simulationInterval = setInterval(() => {
    const sockets = deviceManager.getByType('xiaomi_socket');
    sockets.forEach((device) => {
      if (device.state.power) {
        const delta = (Math.random() - 0.5) * 5;
        const newConsumption = Math.max(0, parseFloat((device.state.power_consumption + delta).toFixed(1)));
        deviceManager.updateState(device.id, { power_consumption: newConsumption });
      }
    });

    const sonoffs = deviceManager.getByType('sonoff');
    sonoffs.forEach((device) => {
      if (device.state.power) {
        const delta = (Math.random() - 0.5) * 50;
        const newWatts = Math.max(0, parseFloat((device.state.watts + delta).toFixed(1)));
        deviceManager.updateState(device.id, { watts: newWatts });
      }
    });
  }, 5000);
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
}

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  startSimulation();
  server.listen(PORT, () => {
    console.log(`SmartHome server running on port ${PORT}`);
  });
}

module.exports = { app, server, startSimulation, stopSimulation };
