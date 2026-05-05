'use strict';

const deviceManager = require('./deviceManager');

const VALID_MODES = ['cool', 'heat', 'fan', 'dry', 'auto'];
const VALID_FAN_SPEEDS = ['low', 'medium', 'high', 'auto'];
const TEMP_MIN = 16;
const TEMP_MAX = 30;

function setAcPower(device, power) {
  return deviceManager.updateState(device.id, { power: Boolean(power) });
}

function setAcTemperature(device, temperature) {
  if (temperature < TEMP_MIN || temperature > TEMP_MAX) {
    throw new RangeError(`Temperature must be between ${TEMP_MIN} and ${TEMP_MAX}`);
  }
  return deviceManager.updateState(device.id, { temperature });
}

function setAcMode(device, mode) {
  if (!VALID_MODES.includes(mode)) {
    throw new TypeError(`Invalid mode. Must be one of: ${VALID_MODES.join(', ')}`);
  }
  return deviceManager.updateState(device.id, { mode });
}

function setAcFanSpeed(device, speed) {
  if (!VALID_FAN_SPEEDS.includes(speed)) {
    throw new TypeError(`Invalid fan speed. Must be one of: ${VALID_FAN_SPEEDS.join(', ')}`);
  }
  return deviceManager.updateState(device.id, { fan_speed: speed });
}

function setAcSwing(device, swing) {
  return deviceManager.updateState(device.id, { swing: Boolean(swing) });
}

function getAcState(device) {
  return device.state;
}

module.exports = {
  setAcPower,
  setAcTemperature,
  setAcMode,
  setAcFanSpeed,
  setAcSwing,
  getAcState,
};
