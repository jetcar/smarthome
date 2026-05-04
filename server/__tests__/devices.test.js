'use strict';

const request = require('supertest');
const { app } = require('../index');

describe('Devices API', () => {
  test('GET /api/devices returns array with 8 devices', async () => {
    const res = await request(app).get('/api/devices');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(8);
  });

  test('GET /api/devices/xiaomi_socket returns only socket devices', async () => {
    const res = await request(app).get('/api/devices/xiaomi_socket');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((d) => expect(d.type).toBe('xiaomi_socket'));
  });

  test('GET /api/devices/id/socket1 returns socket1', async () => {
    const res = await request(app).get('/api/devices/id/socket1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('socket1');
  });
});

describe('Xiaomi API', () => {
  test('POST /api/xiaomi/sockets/socket1/power with {power:true} returns updated state', async () => {
    const res = await request(app)
      .post('/api/xiaomi/sockets/socket1/power')
      .send({ power: true });
    expect(res.status).toBe(200);
    expect(res.body.state.power).toBe(true);
  });

  test('POST /api/xiaomi/sockets/socket1/toggle returns toggled state', async () => {
    // First, ensure socket1 is on
    await request(app).post('/api/xiaomi/sockets/socket1/power').send({ power: true });
    const res = await request(app).post('/api/xiaomi/sockets/socket1/toggle');
    expect(res.status).toBe(200);
    expect(res.body.state.power).toBe(false);
  });

  test('POST /api/xiaomi/gateway/arm with {armed:true} sets armed state', async () => {
    const res = await request(app)
      .post('/api/xiaomi/gateway/arm')
      .send({ armed: true });
    expect(res.status).toBe(200);
    expect(res.body.state.armed).toBe(true);
  });
});

describe('Midea AC API', () => {
  test('GET /api/midea returns AC units', async () => {
    const res = await request(app).get('/api/midea');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((d) => expect(d.type).toBe('midea_ac'));
  });

  test('POST /api/midea/ac1/temperature with {temperature:26} sets temperature', async () => {
    const res = await request(app)
      .post('/api/midea/ac1/temperature')
      .send({ temperature: 26 });
    expect(res.status).toBe(200);
    expect(res.body.state.temperature).toBe(26);
  });

  test('POST /api/midea/ac1/mode with {mode:"heat"} sets mode', async () => {
    const res = await request(app)
      .post('/api/midea/ac1/mode')
      .send({ mode: 'heat' });
    expect(res.status).toBe(200);
    expect(res.body.state.mode).toBe('heat');
  });
});

describe('Sonoff API', () => {
  test('GET /api/sonoff returns sonoff devices', async () => {
    const res = await request(app).get('/api/sonoff');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((d) => expect(d.type).toBe('sonoff'));
  });
});

describe('Heating API', () => {
  test('GET /api/heating returns heating zones', async () => {
    const res = await request(app).get('/api/heating');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach((d) => expect(d.type).toBe('floor_heating'));
  });

  test('POST /api/heating/heat1/temperature with {temperature:23} sets target temp', async () => {
    const res = await request(app)
      .post('/api/heating/heat1/temperature')
      .send({ temperature: 23 });
    expect(res.status).toBe(200);
    expect(res.body.state.target_temp).toBe(23);
  });

  test('POST /api/heating/heat1/mode with {mode:"manual"} sets mode', async () => {
    const res = await request(app)
      .post('/api/heating/heat1/mode')
      .send({ mode: 'manual' });
    expect(res.status).toBe(200);
    expect(res.body.state.mode).toBe('manual');
  });
});
