'use strict';

const deviceManager = require('./deviceManager');

function getState(device) {
  return device.state;
}

function setPower(device, power) {
  return deviceManager.updateState(device.id, { power: Boolean(power) });
}

function resetEnergy(device) {
  return deviceManager.updateState(device.id, { today_kwh: 0 });
}

module.exports = {
  getState,
  setPower,
  resetEnergy,
};
