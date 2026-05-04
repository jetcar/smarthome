'use strict';

const deviceManager = require('./deviceManager');

const VALID_MODES = ['manual', 'schedule', 'off'];
const TEMP_MIN = 10;
const TEMP_MAX = 30;

function setHeating(device, enabled) {
  return deviceManager.updateState(device.id, { heating: Boolean(enabled) });
}

function setTargetTemp(device, temp) {
  if (temp < TEMP_MIN || temp > TEMP_MAX) {
    throw new RangeError(`Temperature must be between ${TEMP_MIN} and ${TEMP_MAX}`);
  }
  return deviceManager.updateState(device.id, { target_temp: temp });
}

function setMode(device, mode) {
  if (!VALID_MODES.includes(mode)) {
    throw new TypeError(`Invalid mode. Must be one of: ${VALID_MODES.join(', ')}`);
  }
  return deviceManager.updateState(device.id, { mode });
}

function updateSchedule(device, schedule) {
  if (!Array.isArray(schedule)) {
    throw new TypeError('Schedule must be an array');
  }
  return deviceManager.updateState(device.id, { schedule });
}

function getState(device) {
  return device.state;
}

module.exports = {
  setHeating,
  setTargetTemp,
  setMode,
  updateSchedule,
  getState,
};
