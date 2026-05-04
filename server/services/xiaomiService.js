'use strict';

const deviceManager = require('./deviceManager');

function toggleSocket(device) {
  const newPower = !device.state.power;
  return deviceManager.updateState(device.id, {
    power: newPower,
    current: newPower ? 0.2 : 0,
    power_consumption: newPower ? 45.0 : 0,
  });
}

function setSocketPower(device, power) {
  return deviceManager.updateState(device.id, {
    power: Boolean(power),
    current: power ? 0.2 : 0,
    power_consumption: power ? 45.0 : 0,
  });
}

function getSocketState(device) {
  return device.state;
}

function setGatewayArmed(device, armed) {
  return deviceManager.updateState(device.id, { armed: Boolean(armed) });
}

function getGatewayState(device) {
  return device.state;
}

module.exports = {
  toggleSocket,
  setSocketPower,
  getSocketState,
  setGatewayArmed,
  getGatewayState,
};
