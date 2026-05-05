'use strict';

const devices = new Map([
  ['socket1', {
    id: 'socket1',
    name: 'Xiaomi Smart Socket',
    type: 'xiaomi_socket',
    ip: '192.168.1.101',
    status: 'online',
    state: { power: false, power_consumption: 0, voltage: 220, current: 0 },
    lastSeen: new Date().toISOString(),
  }],
  ['socket2', {
    id: 'socket2',
    name: 'Xiaomi Smart Socket 2',
    type: 'xiaomi_socket',
    ip: '192.168.1.102',
    status: 'online',
    state: { power: true, power_consumption: 45.2, voltage: 221, current: 0.2 },
    lastSeen: new Date().toISOString(),
  }],
  ['gateway1', {
    id: 'gateway1',
    name: 'Xiaomi Gateway',
    type: 'xiaomi_gateway',
    ip: '192.168.1.100',
    status: 'online',
    state: { armed: false, illumination: 300, sub_devices: ['socket1', 'socket2'] },
    lastSeen: new Date().toISOString(),
  }],
  ['ac1', {
    id: 'ac1',
    name: 'Living Room AC',
    type: 'midea_ac',
    ip: '192.168.1.110',
    status: 'online',
    state: { power: false, temperature: 24, mode: 'cool', fan_speed: 'auto', swing: false },
    lastSeen: new Date().toISOString(),
  }],
  ['ac2', {
    id: 'ac2',
    name: 'Bedroom AC',
    type: 'midea_ac',
    ip: '192.168.1.111',
    status: 'online',
    state: { power: true, temperature: 22, mode: 'cool', fan_speed: 'medium', swing: true },
    lastSeen: new Date().toISOString(),
  }],
  ['sonoff1', {
    id: 'sonoff1',
    name: 'Sonoff Power Meter',
    type: 'sonoff',
    ip: '192.168.1.120',
    status: 'online',
    state: { power: true, watts: 1250.5, voltage: 230, current: 5.44, today_kwh: 3.2, total_kwh: 145.7 },
    lastSeen: new Date().toISOString(),
  }],
  ['heat1', {
    id: 'heat1',
    name: 'Floor Heating Zone 1',
    type: 'floor_heating',
    ip: '192.168.1.130',
    status: 'online',
    state: {
      heating: true,
      current_temp: 19.5,
      target_temp: 22,
      mode: 'schedule',
      schedule: [
        { days: [1, 2, 3, 4, 5], start: '07:00', end: '09:00', temp: 22 },
        { days: [0, 6], start: '08:00', end: '22:00', temp: 21 },
      ],
    },
    lastSeen: new Date().toISOString(),
  }],
  ['heat2', {
    id: 'heat2',
    name: 'Floor Heating Zone 2',
    type: 'floor_heating',
    ip: '192.168.1.131',
    status: 'online',
    state: { heating: false, current_temp: 18, target_temp: 20, mode: 'manual', schedule: [] },
    lastSeen: new Date().toISOString(),
  }],
]);

/** @type {((deviceId: string, state: object) => void) | null} */
let _onStateChange = null;

function setStateChangeCallback(fn) {
  _onStateChange = fn;
}

function getAll() {
  return Array.from(devices.values());
}

function getById(id) {
  return devices.get(id) || null;
}

function getByType(type) {
  return Array.from(devices.values()).filter((d) => d.type === type);
}

function updateState(id, statePatch) {
  const device = devices.get(id);
  if (!device) return null;
  device.state = { ...device.state, ...statePatch };
  device.lastSeen = new Date().toISOString();
  if (_onStateChange) _onStateChange(id, device.state);
  return device;
}

function setStatus(id, status) {
  const device = devices.get(id);
  if (!device) return null;
  device.status = status;
  device.lastSeen = new Date().toISOString();
  return device;
}

function addDevice(device) {
  if (!device.id) throw new Error('Device must have an id');
  devices.set(device.id, {
    ...device,
    lastSeen: new Date().toISOString(),
  });
  return devices.get(device.id);
}

function removeDevice(id) {
  return devices.delete(id);
}

module.exports = {
  getAll,
  getById,
  getByType,
  updateState,
  setStatus,
  addDevice,
  removeDevice,
  setStateChangeCallback,
};
