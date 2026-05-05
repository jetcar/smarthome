'use strict';

/* ── SmartHome App ─────────────────────────────────────────────── */
const App = (() => {
  /* ── State ────────────────────────────────────────────────────── */
  let serverUrl  = localStorage.getItem('smarthome_url') || 'http://localhost:3000';
  let socket     = null;
  let devices    = {};   // deviceId → device object
  let connected  = false;

  /* ── DOM helpers ──────────────────────────────────────────────── */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function el(tag, cls, html = '') {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  /* ── Toast notifications ──────────────────────────────────────── */
  function toast(msg, type = 'info') {
    const container = $('#toast-container');
    const t = el('div', `toast toast--${type}`);
    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    t.textContent = `${icons[type] || ''} ${msg}`;
    container.appendChild(t);
    setTimeout(() => t.remove(), 2900);
  }

  /* ── API ──────────────────────────────────────────────────────── */
  async function api(method, path, body) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(`${serverUrl}${path}`, opts);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      return data;
    } catch (err) {
      toast(err.message, 'error');
      throw err;
    }
  }

  /* ── Device state helpers ─────────────────────────────────────── */
  function applyUpdate(deviceId, statePatch) {
    if (!devices[deviceId]) return;
    devices[deviceId].state = { ...devices[deviceId].state, ...statePatch };
    renderDevice(devices[deviceId]);
    updateDashboard();
  }

  function renderDevice(device) {
    switch (device.type) {
      case 'xiaomi_socket':  renderSocket(device, true); break;
      case 'xiaomi_gateway': renderGateway(device, true); break;
      case 'midea_ac':       renderAc(device, true); break;
      case 'sonoff':         renderSonoff(device, true); break;
      case 'floor_heating':  renderHeating(device, true); break;
    }
  }

  /* ── Control functions ────────────────────────────────────────── */
  async function toggleSocketPower(deviceId) {
    try {
      const updated = await api('POST', `/api/xiaomi/sockets/${deviceId}/toggle`);
      applyUpdate(deviceId, updated.state);
      toast(`Socket ${updated.state.power ? 'ON' : 'OFF'}`, 'success');
    } catch (_) {}
  }

  async function setGatewayArmed(armed) {
    try {
      const updated = await api('POST', '/api/xiaomi/gateway/arm', { armed });
      applyUpdate(updated.id, updated.state);
      toast(`Gateway ${armed ? 'armed 🔒' : 'disarmed 🔓'}`, 'success');
    } catch (_) {}
  }

  async function setAcPower(deviceId, power) {
    try {
      const updated = await api('POST', `/api/midea/${deviceId}/power`, { power });
      applyUpdate(deviceId, updated.state);
    } catch (_) {}
  }

  async function setAcTemperature(deviceId, temperature) {
    try {
      const updated = await api('POST', `/api/midea/${deviceId}/temperature`, { temperature });
      applyUpdate(deviceId, updated.state);
    } catch (_) {}
  }

  async function setAcMode(deviceId, mode) {
    try {
      const updated = await api('POST', `/api/midea/${deviceId}/mode`, { mode });
      applyUpdate(deviceId, updated.state);
    } catch (_) {}
  }

  async function setAcFanSpeed(deviceId, speed) {
    try {
      const updated = await api('POST', `/api/midea/${deviceId}/fan`, { speed });
      applyUpdate(deviceId, updated.state);
    } catch (_) {}
  }

  async function setAcSwing(deviceId, swing) {
    try {
      const updated = await api('POST', `/api/midea/${deviceId}/swing`, { swing });
      applyUpdate(deviceId, updated.state);
    } catch (_) {}
  }

  async function setSonoffPower(deviceId, power) {
    try {
      const updated = await api('POST', `/api/sonoff/${deviceId}/power`, { power });
      applyUpdate(deviceId, updated.state);
    } catch (_) {}
  }

  async function resetSonoffEnergy(deviceId) {
    try {
      const updated = await api('POST', `/api/sonoff/${deviceId}/reset-energy`);
      applyUpdate(deviceId, updated.state);
      toast('Energy counter reset', 'success');
    } catch (_) {}
  }

  async function setHeatingPower(deviceId, heating) {
    try {
      const updated = await api('POST', `/api/heating/${deviceId}/power`, { heating });
      applyUpdate(deviceId, updated.state);
    } catch (_) {}
  }

  async function setHeatingTargetTemp(deviceId, temperature) {
    try {
      const updated = await api('POST', `/api/heating/${deviceId}/temperature`, { temperature });
      applyUpdate(deviceId, updated.state);
    } catch (_) {}
  }

  async function setHeatingMode(deviceId, mode) {
    try {
      const updated = await api('POST', `/api/heating/${deviceId}/mode`, { mode });
      applyUpdate(deviceId, updated.state);
    } catch (_) {}
  }

  /* ── Render helpers ───────────────────────────────────────────── */
  function onlineDot(status) {
    const cls = status === 'online' ? 'status-dot--online' : 'status-dot--offline';
    return `<span class="status-dot ${cls}"></span>`;
  }

  function toggleHTML(id, checked, name = '') {
    const c = checked ? 'checked' : '';
    return `
      <label class="toggle" title="${name}">
        <input type="checkbox" ${c} data-device-id="${id}" data-role="power-toggle" />
        <span class="toggle-track"></span>
      </label>`;
  }

  /* ── Render: Xiaomi Socket ────────────────────────────────────── */
  function renderSocket(device, update = false) {
    const { id, name, ip, status, state } = device;
    const w = (state.power_consumption || 0).toFixed(1);
    const v = (state.voltage || 0).toFixed(0);
    const a = (state.current || 0).toFixed(2);

    const html = `
      <div class="card socket-card" data-device-id="${id}">
        <div class="card-header">
          <div class="card-title-row">
            ${onlineDot(status)}
            <div>
              <div class="card-title">${name}</div>
              <div class="card-subtitle ip-badge">${ip}</div>
            </div>
          </div>
          ${toggleHTML(id, state.power)}
        </div>
        <div class="divider"></div>
        <div class="stats-row">
          <div class="stat-item">
            <div class="stat-value">${w}</div>
            <div class="stat-label">Watts</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${v}</div>
            <div class="stat-label">Volts</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${a}</div>
            <div class="stat-label">Amps</div>
          </div>
        </div>
      </div>`;

    if (update) {
      const existing = $(`#sockets-container [data-device-id="${id}"]`);
      if (existing) {
        existing.outerHTML = html; // replace in-place via template
        // actual replacement:
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        existing.replaceWith(tmp.firstElementChild);
        bindSocketCard($(`#sockets-container [data-device-id="${id}"]`));
      }
    }
    return html;
  }

  function bindSocketCard(card) {
    if (!card) return;
    const toggle = card.querySelector('[data-role="power-toggle"]');
    if (toggle) toggle.addEventListener('change', () => toggleSocketPower(toggle.dataset.deviceId));
  }

  /* ── Render: Gateway ──────────────────────────────────────────── */
  function renderGateway(device, update = false) {
    const { id, name, ip, status, state } = device;
    const subCount = Array.isArray(state.sub_devices) ? state.sub_devices.length : 0;

    const html = `
      <div class="card gateway-card" data-device-id="${id}">
        <div class="card-header">
          <div class="card-title-row">
            ${onlineDot(status)}
            <div>
              <div class="card-title">${name}</div>
              <div class="card-subtitle ip-badge">${ip}</div>
            </div>
          </div>
          <div class="toggle-wrap">
            <span class="toggle-label">${state.armed ? '🔒 Armed' : '🔓 Disarmed'}</span>
            <label class="toggle">
              <input type="checkbox" ${state.armed ? 'checked' : ''} data-device-id="${id}" data-role="gateway-arm" />
              <span class="toggle-track"></span>
            </label>
          </div>
        </div>
        <div class="gateway-body">
          <div class="gateway-stat">
            <div class="gateway-stat-value" style="color:var(--accent-yellow)">${state.illumination ?? '—'}</div>
            <div class="gateway-stat-label">Illumination (lux)</div>
          </div>
          <div class="gateway-stat">
            <div class="gateway-stat-value" style="color:var(--accent-green)">${subCount}</div>
            <div class="gateway-stat-label">Sub-devices</div>
          </div>
        </div>
      </div>`;

    if (update) {
      const existing = $(`#gateway-container [data-device-id="${id}"]`);
      if (existing) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        existing.replaceWith(tmp.firstElementChild);
        bindGatewayCard($(`#gateway-container [data-device-id="${id}"]`));
      }
    }
    return html;
  }

  function bindGatewayCard(card) {
    if (!card) return;
    const toggle = card.querySelector('[data-role="gateway-arm"]');
    if (toggle) toggle.addEventListener('change', () => setGatewayArmed(toggle.checked));
  }

  /* ── Render: Midea AC ─────────────────────────────────────────── */
  const AC_MODES = [
    { id: 'cool', label: '❄️ Cool' },
    { id: 'heat', label: '🔥 Heat' },
    { id: 'fan',  label: '💨 Fan'  },
    { id: 'dry',  label: '💧 Dry'  },
    { id: 'auto', label: '🔄 Auto' },
  ];

  function renderAc(device, update = false) {
    const { id, name, ip, status, state } = device;
    const temp = state.temperature ?? 24;
    const modeButtons = AC_MODES.map(m =>
      `<button class="mode-btn ${state.mode === m.id ? 'active' : ''}"
               data-device-id="${id}" data-role="ac-mode" data-mode="${m.id}">${m.label}</button>`
    ).join('');

    const html = `
      <div class="card ac-card" data-device-id="${id}">
        <div class="card-header">
          <div class="card-title-row">
            ${onlineDot(status)}
            <div>
              <div class="card-title">${name}</div>
              <div class="card-subtitle ip-badge">${ip}</div>
            </div>
          </div>
          ${toggleHTML(id, state.power)}
        </div>
        <div class="divider"></div>

        <div class="temp-control">
          <button class="temp-btn" data-device-id="${id}" data-role="ac-temp-down">−</button>
          <div class="temp-display">
            ${temp}<span class="temp-unit">°C</span>
          </div>
          <button class="temp-btn" data-device-id="${id}" data-role="ac-temp-up">+</button>
          <div style="flex:1"></div>
          <div class="swing-wrap">
            <label class="toggle" title="Swing">
              <input type="checkbox" ${state.swing ? 'checked' : ''} data-device-id="${id}" data-role="ac-swing" />
              <span class="toggle-track"></span>
            </label>
            <span>Swing</span>
          </div>
        </div>

        <div class="mode-btns">${modeButtons}</div>

        <div class="ac-row" style="margin-top:14px">
          <span class="ac-label">Fan Speed</span>
          <select class="styled-select" style="width:140px" data-device-id="${id}" data-role="ac-fan">
            ${['auto','low','medium','high'].map(s =>
              `<option value="${s}" ${state.fan_speed === s ? 'selected' : ''}>${s.charAt(0).toUpperCase()+s.slice(1)}</option>`
            ).join('')}
          </select>
        </div>
      </div>`;

    if (update) {
      const existing = $(`#ac-container [data-device-id="${id}"]`);
      if (existing) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        existing.replaceWith(tmp.firstElementChild);
        bindAcCard($(`#ac-container [data-device-id="${id}"]`));
      }
    }
    return html;
  }

  function bindAcCard(card) {
    if (!card) return;
    const id = card.dataset.deviceId;

    card.querySelector('[data-role="power-toggle"]')
        ?.addEventListener('change', e => setAcPower(id, e.target.checked));

    card.querySelector('[data-role="ac-temp-down"]')
        ?.addEventListener('click', () => {
          const cur = devices[id]?.state?.temperature ?? 24;
          if (cur > 16) setAcTemperature(id, cur - 1);
        });

    card.querySelector('[data-role="ac-temp-up"]')
        ?.addEventListener('click', () => {
          const cur = devices[id]?.state?.temperature ?? 24;
          if (cur < 30) setAcTemperature(id, cur + 1);
        });

    card.querySelectorAll('[data-role="ac-mode"]')
        .forEach(btn => btn.addEventListener('click', () => setAcMode(id, btn.dataset.mode)));

    card.querySelector('[data-role="ac-fan"]')
        ?.addEventListener('change', e => setAcFanSpeed(id, e.target.value));

    card.querySelector('[data-role="ac-swing"]')
        ?.addEventListener('change', e => setAcSwing(id, e.target.checked));
  }

  /* ── Render: Sonoff ───────────────────────────────────────────── */
  function renderSonoff(device, update = false) {
    const { id, name, ip, status, state } = device;
    const watts   = (state.watts || 0).toFixed(1);
    const maxW    = 3000;
    const barPct  = Math.min(100, ((state.watts || 0) / maxW) * 100).toFixed(1);

    const html = `
      <div class="card sonoff-card" data-device-id="${id}">
        <div class="card-header">
          <div class="card-title-row">
            ${onlineDot(status)}
            <div>
              <div class="card-title">${name}</div>
              <div class="card-subtitle ip-badge">${ip}</div>
            </div>
          </div>
          ${toggleHTML(id, state.power)}
        </div>
        <div class="divider"></div>
        <div class="watts-display">${watts} <span style="font-size:1.2rem;font-weight:400">W</span></div>
        <div class="watts-label">Live Power</div>
        <div class="power-bar-wrap">
          <div class="power-bar-bg">
            <div class="power-bar-fill" style="width:${barPct}%"></div>
          </div>
        </div>
        <div class="reading-grid">
          <div class="stat-item">
            <div class="stat-value">${(state.voltage || 0).toFixed(0)}</div>
            <div class="stat-label">Volts</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${(state.current || 0).toFixed(2)}</div>
            <div class="stat-label">Amps</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${(state.today_kwh || 0).toFixed(2)}</div>
            <div class="stat-label">Today kWh</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${(state.total_kwh || 0).toFixed(1)}</div>
            <div class="stat-label">Total kWh</div>
          </div>
        </div>
        <div style="margin-top:14px">
          <button class="btn btn--danger btn--sm" data-device-id="${id}" data-role="reset-energy">⟳ Reset Energy</button>
        </div>
      </div>`;

    if (update) {
      const existing = $(`#sonoff-container [data-device-id="${id}"]`);
      if (existing) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        existing.replaceWith(tmp.firstElementChild);
        bindSonoffCard($(`#sonoff-container [data-device-id="${id}"]`));
      }
    }
    return html;
  }

  function bindSonoffCard(card) {
    if (!card) return;
    const id = card.dataset.deviceId;

    card.querySelector('[data-role="power-toggle"]')
        ?.addEventListener('change', e => setSonoffPower(id, e.target.checked));

    card.querySelector('[data-role="reset-energy"]')
        ?.addEventListener('click', () => resetSonoffEnergy(id));
  }

  /* ── Render: Floor Heating ────────────────────────────────────── */
  function renderHeating(device, update = false) {
    const { id, name, ip, status, state } = device;
    const curTemp = (state.current_temp ?? 0).toFixed(1);
    const tgtTemp = state.target_temp ?? 20;
    const flameClass = state.heating ? 'active' : '';

    const html = `
      <div class="card heating-card" data-device-id="${id}">
        <div class="card-header">
          <div class="card-title-row">
            ${onlineDot(status)}
            <div>
              <div class="card-title">${name}</div>
              <div class="card-subtitle ip-badge">${ip}</div>
            </div>
          </div>
          <div class="card-title-row" style="gap:8px">
            <span class="flame-icon ${flameClass}">🔥</span>
            <span class="status-dot ${state.heating ? 'status-dot--heating' : 'status-dot--offline'}"></span>
          </div>
        </div>
        <div class="divider"></div>

        <div class="temp-row">
          <div class="temp-block">
            <div class="temp-block-label">Current</div>
            <div class="temp-block-value temp-block-value--current">${curTemp}°</div>
          </div>
          <div class="temp-block">
            <div class="temp-block-label">Target</div>
            <div class="temp-block-value temp-block-value--target">${tgtTemp}°</div>
          </div>
        </div>

        <div class="temp-control" style="justify-content:center">
          <button class="temp-btn" data-device-id="${id}" data-role="heat-temp-down">−</button>
          <span style="font-size:0.85rem;color:var(--text-secondary);min-width:80px;text-align:center">Set Target</span>
          <button class="temp-btn" data-device-id="${id}" data-role="heat-temp-up">+</button>
        </div>

        <div class="ac-row" style="margin-top:10px">
          <span class="ac-label">Mode</span>
          <select class="styled-select" style="width:150px" data-device-id="${id}" data-role="heat-mode">
            ${['manual','schedule','off'].map(m =>
              `<option value="${m}" ${state.mode === m ? 'selected' : ''}>${m.charAt(0).toUpperCase()+m.slice(1)}</option>`
            ).join('')}
          </select>
        </div>

        <div class="ac-row" style="margin-top:12px">
          <span class="ac-label">Heating</span>
          ${toggleHTML(id, state.heating)}
        </div>
      </div>`;

    if (update) {
      const existing = $(`#heating-container [data-device-id="${id}"]`);
      if (existing) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        existing.replaceWith(tmp.firstElementChild);
        bindHeatingCard($(`#heating-container [data-device-id="${id}"]`));
      }
    }
    return html;
  }

  function bindHeatingCard(card) {
    if (!card) return;
    const id = card.dataset.deviceId;

    card.querySelector('[data-role="power-toggle"]')
        ?.addEventListener('change', e => setHeatingPower(id, e.target.checked));

    card.querySelector('[data-role="heat-temp-down"]')
        ?.addEventListener('click', () => {
          const cur = devices[id]?.state?.target_temp ?? 20;
          if (cur > 5) setHeatingTargetTemp(id, cur - 0.5);
        });

    card.querySelector('[data-role="heat-temp-up"]')
        ?.addEventListener('click', () => {
          const cur = devices[id]?.state?.target_temp ?? 20;
          if (cur < 35) setHeatingTargetTemp(id, cur + 0.5);
        });

    card.querySelector('[data-role="heat-mode"]')
        ?.addEventListener('change', e => setHeatingMode(id, e.target.value));
  }

  /* ── Render all sections ──────────────────────────────────────── */
  function renderAll() {
    const allDevices = Object.values(devices);

    // Sockets
    const socketsContainer = $('#sockets-container');
    const sockets = allDevices.filter(d => d.type === 'xiaomi_socket');
    if (sockets.length) {
      socketsContainer.innerHTML = sockets.map(d => renderSocket(d)).join('');
      $$('#sockets-container .socket-card').forEach(bindSocketCard);
    } else {
      socketsContainer.innerHTML = emptyState('No sockets found');
    }

    // Gateway
    const gatewayContainer = $('#gateway-container');
    const gateways = allDevices.filter(d => d.type === 'xiaomi_gateway');
    if (gateways.length) {
      gatewayContainer.innerHTML = gateways.map(d => renderGateway(d)).join('');
      $$('#gateway-container .gateway-card').forEach(bindGatewayCard);
    } else {
      gatewayContainer.innerHTML = emptyState('No gateway found');
    }

    // AC
    const acContainer = $('#ac-container');
    const acs = allDevices.filter(d => d.type === 'midea_ac');
    if (acs.length) {
      acContainer.innerHTML = acs.map(d => renderAc(d)).join('');
      $$('#ac-container .ac-card').forEach(bindAcCard);
    } else {
      acContainer.innerHTML = emptyState('No AC units found');
    }

    // Sonoff
    const sonoffContainer = $('#sonoff-container');
    const sonoffs = allDevices.filter(d => d.type === 'sonoff');
    if (sonoffs.length) {
      sonoffContainer.innerHTML = sonoffs.map(d => renderSonoff(d)).join('');
      $$('#sonoff-container .sonoff-card').forEach(bindSonoffCard);
    } else {
      sonoffContainer.innerHTML = emptyState('No Sonoff devices found');
    }

    // Heating
    const heatingContainer = $('#heating-container');
    const heating = allDevices.filter(d => d.type === 'floor_heating');
    if (heating.length) {
      heatingContainer.innerHTML = heating.map(d => renderHeating(d)).join('');
      $$('#heating-container .heating-card').forEach(bindHeatingCard);
    } else {
      heatingContainer.innerHTML = emptyState('No heating zones found');
    }

    updateDashboard();
  }

  function emptyState(msg) {
    return `<div class="empty-state"><div class="empty-state-icon">📭</div>${msg}</div>`;
  }

  /* ── Dashboard ────────────────────────────────────────────────── */
  function updateDashboard() {
    const all = Object.values(devices);
    const online  = all.filter(d => d.status === 'online').length;
    const powered = all.filter(d => d.state?.power || d.state?.heating).length;

    let totalWatts = 0;
    all.forEach(d => {
      if (d.type === 'xiaomi_socket' && d.state?.power) totalWatts += d.state.power_consumption || 0;
      if (d.type === 'sonoff'        && d.state?.power) totalWatts += d.state.watts || 0;
    });

    $('#dash-total').textContent   = all.length;
    $('#dash-online').textContent  = online;
    $('#dash-powered').textContent = powered;
    $('#dash-watts').textContent   = `${totalWatts.toFixed(0)} W`;

    renderDashMini('dash-sockets',  all.filter(d => d.type === 'xiaomi_socket'),  dashSocketRow);
    renderDashMini('dash-ac',       all.filter(d => d.type === 'midea_ac'),       dashAcRow);
    renderDashMini('dash-sonoff',   all.filter(d => d.type === 'sonoff'),         dashSonoffRow);
    renderDashMini('dash-heating',  all.filter(d => d.type === 'floor_heating'), dashHeatRow);
  }

  function renderDashMini(containerId, list, rowFn) {
    const c = $(`#${containerId}`);
    if (!c) return;
    if (!list.length) { c.innerHTML = '<div style="color:var(--text-muted);font-size:0.8rem">No devices</div>'; return; }
    c.innerHTML = list.map(rowFn).join('');
  }

  function dashSocketRow(d) {
    const on = d.state?.power;
    return `<div class="dash-mini-item">
      <span class="dash-mini-name">${d.name}</span>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="dash-mini-val">${(d.state?.power_consumption || 0).toFixed(0)} W</span>
        <span class="dash-mini-badge ${on ? 'badge--on' : 'badge--off'}">${on ? 'ON' : 'OFF'}</span>
      </div>
    </div>`;
  }

  function dashAcRow(d) {
    const on = d.state?.power;
    return `<div class="dash-mini-item">
      <span class="dash-mini-name">${d.name}</span>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="dash-mini-val">${d.state?.temperature ?? '—'}°C</span>
        <span class="dash-mini-badge ${on ? 'badge--on' : 'badge--off'}">${on ? 'ON' : 'OFF'}</span>
      </div>
    </div>`;
  }

  function dashSonoffRow(d) {
    return `<div class="dash-mini-item">
      <span class="dash-mini-name">${d.name}</span>
      <span class="dash-mini-val">${(d.state?.watts || 0).toFixed(0)} W</span>
    </div>`;
  }

  function dashHeatRow(d) {
    const on = d.state?.heating;
    return `<div class="dash-mini-item">
      <span class="dash-mini-name">${d.name}</span>
      <div style="display:flex;align-items:center;gap:8px">
        <span class="dash-mini-val">${(d.state?.current_temp ?? '—')}°C</span>
        <span class="dash-mini-badge ${on ? 'badge--heat' : 'badge--off'}">${on ? 'Heating' : 'Off'}</span>
      </div>
    </div>`;
  }

  /* ── Navigation ───────────────────────────────────────────────── */
  const sectionTitles = {
    dashboard: 'Dashboard',
    xiaomi:    'Xiaomi Devices',
    midea:     'Midea AC',
    sonoff:    'Sonoff',
    heating:   'Floor Heating',
    settings:  'Settings',
  };

  function navigate(section) {
    $$('.content-section').forEach(s => s.classList.remove('active'));
    $$('.nav-link').forEach(l => l.classList.remove('active'));

    const sec = $(`#section-${section}`);
    if (sec) sec.classList.add('active');

    const link = $(`.nav-link[data-section="${section}"]`);
    if (link) link.classList.add('active');

    $('#pageTitle').textContent = sectionTitles[section] || section;

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      $('#sidebar').classList.remove('open');
      $('#sidebar-overlay')?.classList.remove('visible');
    }
  }

  /* ── Connection status UI ─────────────────────────────────────── */
  function setConnectionStatus(status, transport = '') {
    connected = status === 'connected';
    const dot   = $('#connectionStatus .status-dot');
    const label = $('#statusLabel');
    const sDot  = $('#settingsStatus .status-dot');
    const sText = $('#settingsStatusText');
    const sTrans = $('#settingsTransport');
    const sSid   = $('#settingsSocketId');

    if (connected) {
      dot.className   = 'status-dot status-dot--online';
      label.textContent = 'Connected';
      sDot.className  = 'status-dot status-dot--online';
      sText.textContent = 'Connected';
      sTrans.textContent = transport || 'websocket';
      sSid.textContent   = socket?.id || '—';
    } else {
      dot.className   = 'status-dot status-dot--offline';
      label.textContent = status === 'error' ? 'Error' : 'Disconnected';
      sDot.className  = 'status-dot status-dot--offline';
      sText.textContent = status === 'error' ? 'Connection error' : 'Disconnected';
      sTrans.textContent = '—';
      sSid.textContent   = '—';
    }
  }

  /* ── Socket.io ────────────────────────────────────────────────── */
  function connectSocket() {
    if (socket) socket.disconnect();

    setConnectionStatus('connecting');

    try {
      socket = io(serverUrl, { transports: ['websocket', 'polling'], reconnectionDelay: 2000 });
    } catch {
      setConnectionStatus('error');
      return;
    }

    socket.on('connect', () => {
      setConnectionStatus('connected', socket.io.engine.transport.name);
      toast('Connected to server', 'success');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
      toast('Disconnected from server', 'error');
    });

    socket.on('connect_error', () => {
      setConnectionStatus('error');
    });

    socket.on('allDevices', (list) => {
      devices = {};
      list.forEach(d => { devices[d.id] = d; });
      renderAll();
    });

    socket.on('deviceUpdate', ({ deviceId, state }) => {
      if (devices[deviceId]) {
        devices[deviceId].state = { ...devices[deviceId].state, ...state };
        renderDevice(devices[deviceId]);
        updateDashboard();
      }
    });
  }

  /* ── Initial data fetch (REST fallback) ──────────────────────── */
  async function fetchAllDevices() {
    try {
      const list = await api('GET', '/api/devices');
      devices = {};
      list.forEach(d => { devices[d.id] = d; });
      renderAll();
    } catch (_) {}
  }

  /* ── Settings actions ─────────────────────────────────────────── */
  function initSettings() {
    const urlInput  = $('#serverUrl');
    const connectBtn = $('#connectBtn');
    const discoverBtn = $('#discoverBtn');

    urlInput.value = serverUrl;

    connectBtn.addEventListener('click', () => {
      serverUrl = urlInput.value.trim().replace(/\/$/, '');
      localStorage.setItem('smarthome_url', serverUrl);
      connectSocket();
      fetchAllDevices();
      toast(`Connecting to ${serverUrl}`, 'info');
    });

    discoverBtn.addEventListener('click', async () => {
      discoverBtn.disabled = true;
      discoverBtn.textContent = '🔍 Scanning…';
      try {
        const result = await api('POST', '/api/devices/discover');
        const container = $('#discoverResults');
        if (result.devices?.length) {
          container.innerHTML = result.devices.map(d => `
            <div class="discover-item">
              <div>
                <div class="discover-item-name">${d.name}</div>
                <div class="discover-item-ip">${d.ip} — ${d.type}</div>
              </div>
              <span class="dash-mini-badge badge--on">Found</span>
            </div>`).join('');
          toast(`Found ${result.found} device(s)`, 'success');
        } else {
          container.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem">No new devices found.</div>';
        }
      } catch (_) {
        toast('Discovery failed', 'error');
      } finally {
        discoverBtn.disabled = false;
        discoverBtn.textContent = '🔍 Discover Devices';
      }
    });
  }

  /* ── Sidebar / Navigation ─────────────────────────────────────── */
  function initNav() {
    // Sidebar overlay for mobile
    const overlay = document.createElement('div');
    overlay.id = 'sidebar-overlay';
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    $$('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(link.dataset.section);
      });
    });

    $('#hamburger').addEventListener('click', () => {
      $('#sidebar').classList.toggle('open');
      overlay.classList.toggle('visible');
    });

    overlay.addEventListener('click', () => {
      $('#sidebar').classList.remove('open');
      overlay.classList.remove('visible');
    });

    $('#refreshBtn').addEventListener('click', async () => {
      const btn = $('#refreshBtn');
      btn.style.transform = 'rotate(180deg)';
      await fetchAllDevices();
      setTimeout(() => { btn.style.transform = ''; }, 400);
      toast('Devices refreshed', 'info');
    });
  }

  /* ── Init ─────────────────────────────────────────────────────── */
  function init() {
    initNav();
    initSettings();
    navigate('dashboard');
    connectSocket();
    // Fallback REST fetch if socket doesn't deliver allDevices quickly
    setTimeout(() => {
      if (!Object.keys(devices).length) fetchAllDevices();
    }, 3000);
  }

  document.addEventListener('DOMContentLoaded', init);

  // Expose for console debugging
  return {
    toggleSocketPower,
    setGatewayArmed,
    setAcPower, setAcTemperature, setAcMode, setAcFanSpeed, setAcSwing,
    setSonoffPower, resetSonoffEnergy,
    setHeatingPower, setHeatingTargetTemp, setHeatingMode,
    navigate,
    fetchAllDevices,
    get devices() { return devices; },
  };
})();
