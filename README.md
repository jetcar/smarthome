# SmartHome IoT Management System

A full-stack IoT management platform for smart home devices, consisting of:

- **Web Application** — browser-based dashboard to monitor and control all devices in real time
- **Backend Server** — Node.js/Express REST API with Socket.io for live updates
- **Android App** — setup wizard to discover and onboard new IoT devices

## Supported Devices

| Device | Type | Capabilities |
|--------|------|-------------|
| Xiaomi Smart Socket | `xiaomi_socket` | Power on/off, energy monitoring (W, V, A) |
| Xiaomi Gateway | `xiaomi_gateway` | Arm/disarm, illumination, sub-device management |
| Midea AC | `midea_ac` | Power, temperature (16–30 °C), mode, fan speed, swing |
| Sonoff Power Measurer | `sonoff` | Live watts/voltage/current, daily & total kWh |
| Floor Heating Zone | `floor_heating` | On/off, target temperature, manual/schedule mode |

---

## Architecture

```
┌──────────────────┐      HTTP/REST       ┌─────────────────────┐
│  Android App     │ ──────────────────▶  │                     │
│  (Setup Wizard)  │                      │  Node.js Server     │
└──────────────────┘                      │  :3000              │
                                          │                     │
┌──────────────────┐  HTTP + Socket.io    │  /api/devices       │
│  Web Dashboard   │ ◀──────────────────▶ │  /api/xiaomi        │
│  (Browser SPA)   │                      │  /api/midea         │
└──────────────────┘                      │  /api/sonoff        │
                                          │  /api/heating       │
                                          └─────────────────────┘
```

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18

### 1. Start the Backend Server

```bash
cd server
npm install
npm start
```

The server starts on **http://localhost:3000**.

### 2. Open the Web Dashboard

Navigate to **http://localhost:3000** in your browser. The server serves the web frontend automatically.

Alternatively, open `web/index.html` directly and point it to your server URL in **Settings**.

### 3. Install the Android App

See the [Android App](#android-app) section below.

---

## Backend Server

Located in `server/`.

### API Endpoints

#### Devices (generic)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/devices` | List all registered devices |
| `GET` | `/api/devices/:type` | Filter by type (e.g. `xiaomi_socket`) |
| `GET` | `/api/devices/id/:id` | Get single device |
| `POST` | `/api/devices` | Add a new device |
| `DELETE` | `/api/devices/id/:id` | Remove a device |
| `POST` | `/api/devices/discover` | Simulate device discovery |

#### Xiaomi

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/xiaomi/sockets` | List all sockets |
| `POST` | `/api/xiaomi/sockets/:id/power` | `{ power: true\|false }` |
| `POST` | `/api/xiaomi/sockets/:id/toggle` | Toggle socket power |
| `GET` | `/api/xiaomi/gateway` | Gateway state |
| `POST` | `/api/xiaomi/gateway/arm` | `{ armed: true\|false }` |

#### Midea AC

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/midea` | List all AC units |
| `GET` | `/api/midea/:id` | Single AC unit |
| `POST` | `/api/midea/:id/power` | `{ power: true\|false }` |
| `POST` | `/api/midea/:id/temperature` | `{ temperature: 16–30 }` |
| `POST` | `/api/midea/:id/mode` | `{ mode: "cool"\|"heat"\|"fan"\|"dry"\|"auto" }` |
| `POST` | `/api/midea/:id/fan` | `{ speed: "low"\|"medium"\|"high"\|"auto" }` |
| `POST` | `/api/midea/:id/swing` | `{ swing: true\|false }` |

#### Sonoff

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/sonoff` | List all Sonoff devices |
| `GET` | `/api/sonoff/:id` | Single Sonoff device |
| `POST` | `/api/sonoff/:id/power` | `{ power: true\|false }` |
| `POST` | `/api/sonoff/:id/reset-energy` | Reset daily energy counter |

#### Floor Heating

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/heating` | List all heating zones |
| `GET` | `/api/heating/:id` | Single zone |
| `POST` | `/api/heating/:id/power` | `{ heating: true\|false }` |
| `POST` | `/api/heating/:id/temperature` | `{ temperature: 10–30 }` |
| `POST` | `/api/heating/:id/mode` | `{ mode: "manual"\|"schedule"\|"off" }` |
| `PUT` | `/api/heating/:id/schedule` | `{ schedule: [...] }` |

### Real-time Updates

The server emits `deviceUpdate` events via Socket.io whenever device state changes:

```js
socket.on('deviceUpdate', ({ deviceId, state }) => {
  console.log(`Device ${deviceId} updated:`, state);
});
```

### Running Tests

```bash
cd server
npm test
```

---

## Web Dashboard

Located in `web/`. Served automatically by the backend server at `http://localhost:3000`.

### Features

- **Dashboard** — summary cards: total devices, online count, active devices, total power consumption
- **Xiaomi Devices** — socket cards with power toggle, live energy readings; gateway arm/disarm
- **Midea AC** — temperature slider, mode selector (❄️ Cool / 🔥 Heat / 💨 Fan / 💧 Dry), fan speed, swing toggle
- **Sonoff** — live wattage display, daily/total kWh, energy reset button
- **Floor Heating** — zone cards with animated 🔥 when heating, target temperature control, schedule/manual mode
- **Settings** — configure server URL, view connection status

### Real-time Updates

The dashboard connects to the server via Socket.io and updates all device cards live as state changes arrive.

---

## Android App

Located in `android/`. Built with Kotlin, targeting Android SDK 24+.

### Setup Wizard Flow

```
MainActivity (Welcome)
     │
     ▼
ServerSetupActivity (Step 1)
  Enter SmartHome server URL, test connection
     │
     ▼
WifiSetupActivity (Step 2)
  Enter Wi-Fi SSID and password for IoT devices
     │
     ▼
DeviceDiscoveryActivity (Step 3)
  Scan local network, select devices to add
     │
     ▼
DeviceConfigActivity (Step 4)
  Configure each device and register it with the server
```

### Building

Open `android/` in Android Studio (Arctic Fox or newer). The app uses:

- **Kotlin** — primary language
- **Retrofit 2** — HTTP client for server communication
- **RecyclerView** — device list in discovery screen
- **Material Components** — UI widgets

### Permissions Required

- `INTERNET` — communicate with the SmartHome server
- `ACCESS_WIFI_STATE` / `CHANGE_WIFI_STATE` — read current Wi-Fi network
- `ACCESS_FINE_LOCATION` — required by Android to scan Wi-Fi networks

---

## Project Structure

```
smarthome/
├── server/                     # Node.js backend
│   ├── index.js                # Express app + Socket.io
│   ├── package.json
│   ├── routes/
│   │   ├── devices.js          # Generic device CRUD
│   │   ├── xiaomi.js           # Xiaomi socket/gateway
│   │   ├── midea.js            # Midea AC control
│   │   ├── sonoff.js           # Sonoff power measurer
│   │   └── heating.js          # Floor heating zones
│   ├── services/
│   │   ├── deviceManager.js    # In-memory device registry
│   │   ├── xiaomiService.js    # Xiaomi device logic
│   │   ├── mideaService.js     # Midea AC logic
│   │   ├── sonoffService.js    # Sonoff logic
│   │   └── heatingService.js   # Floor heating logic
│   └── __tests__/
│       └── devices.test.js     # Jest + Supertest API tests
│
├── web/                        # Browser frontend
│   ├── index.html              # Single-page application
│   ├── css/style.css           # Dark-theme responsive CSS
│   └── js/app.js               # Device management JS
│
├── android/                    # Android setup app
│   ├── build.gradle
│   ├── settings.gradle
│   └── app/src/main/
│       ├── AndroidManifest.xml
│       ├── java/com/smarthome/setup/
│       │   ├── MainActivity.kt
│       │   ├── ServerSetupActivity.kt
│       │   ├── WifiSetupActivity.kt
│       │   ├── DeviceDiscoveryActivity.kt
│       │   ├── DeviceConfigActivity.kt
│       │   ├── DeviceParcel.kt
│       │   ├── model/Device.kt
│       │   └── network/
│       │       ├── ApiService.kt
│       │       └── RetrofitClient.kt
│       └── res/layout/ + values/
│
└── README.md
```

---

## Configuration

### Server environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | HTTP port |

### Connecting real hardware

The `services/` layer is designed to be extended with real device SDKs:

- **Xiaomi** — use [miio](https://github.com/aholstenson/miio) npm package
- **Midea AC** — use [midea-air-conditioner](https://www.npmjs.com/package/midea-air-conditioner) or the Midea cloud API
- **Sonoff** — use MQTT or the [eWeLink API](https://coolkit-technologies.github.io/eWeLink-API/)
- **Floor heating** — depends on controller; typically Modbus RTU or a proprietary REST API