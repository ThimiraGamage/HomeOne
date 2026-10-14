import type { Device, HomeData, Measurement, Settings } from './models.ts'

export const defaultSettings: Settings = {
  homeName: 'My home', timezone: 'Asia/Colombo', currency: 'LKR',
  criticalLevel: 10, lowLevel: 20, highLevel: 90, notifications: true,
}

export function createSeed(now = Date.now()): HomeData {
  const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString()
  const measure = (value: number | null, unit: string, minutes = 0, quality: Measurement['quality'] = 'GOOD'): Measurement => ({ value, unit, observedAt: ago(minutes), quality })
  const device = (id: string, name: string, roomId: string, type: string, overrides: Partial<Device> = {}): Device => ({
    id, homeId: 'home-01', name, roomId, type, availability: 'ONLINE', actualState: 'ON',
    controllable: false, commandStatus: 'IDLE', lastSeen: ago(0), firmware: '0.1.0-demo', rssi: -54, ...overrides,
  })
  const historyTimes = Array.from({ length: 8 }, (_, i) => ago((7 - i) * 180))
  return {
    homeId: 'home-01', generatedAt: ago(0), settings: { ...defaultSettings },
    devices: [
      device('gateway-01', 'Home gateway', 'utility', 'Gateway'),
      device('energy-main-01', 'Main energy meter', 'utility', 'Energy meter'),
      device('tank-01', 'Water tank sensor', 'utility', 'Water sensor'),
      device('room-living-01', 'Living room sensor', 'living', 'Room sensor'),
      device('room-bed-01', 'Bedroom sensor', 'bedroom', 'Room sensor', { lastSeen: ago(28), issue: 'Telemetry is stale; inspect sensor connection.' }),
      device('room-kitchen-01', 'Kitchen sensor', 'kitchen', 'Room sensor'),
      device('light-living-01', 'Living room lights', 'living', 'Light', { controllable: true }),
      device('fan-bed-01', 'Bedroom fan', 'bedroom', 'Fan', { controllable: true, actualState: 'OFF' }),
      device('plug-study-01', 'Study lamp', 'study', 'Smart plug', { availability: 'OFFLINE', actualState: 'UNKNOWN', controllable: true, lastSeen: ago(86), rssi: null, issue: 'Node has not reported; check its power and network.' }),
      device('fridge-01', 'Refrigerator', 'kitchen', 'Appliance monitor'),
      device('door-front-01', 'Front door contact', 'entrance', 'Door sensor'),
      device('door-back-01', 'Back door contact', 'entrance', 'Door sensor', { availability: 'OFFLINE', actualState: 'UNKNOWN', lastSeen: ago(43), rssi: null, issue: 'Door position unknown until the node reconnects.' }),
      device('garden-01', 'Garden soil sensor', 'garden', 'Garden sensor'),
    ],
    rooms: [
      { id: 'living', name: 'Living room', deviceId: 'room-living-01', temperature: measure(27.4, '°C'), humidity: measure(62, '%'), co2: measure(780, 'ppm'), occupied: true,
        history: historyTimes.map((time, i) => ({ time, temperature: [25.8, 25.5, 26, 27, 28.2, 28.5, 27.9, 27.4][i], humidity: [66, 67, 66, 63, 59, 58, 60, 62][i] })) },
      { id: 'bedroom', name: 'Bedroom', deviceId: 'room-bed-01', temperature: measure(26.1, '°C', 28, 'STALE'), humidity: measure(65, '%', 28, 'STALE'), occupied: null,
        history: historyTimes.slice(0, -1).map((time, i) => ({ time, temperature: 25.2 + i * .15, humidity: 68 - i * .5 })) },
      { id: 'kitchen', name: 'Kitchen', deviceId: 'room-kitchen-01', temperature: measure(29.2, '°C'), humidity: measure(71, '%'), co2: measure(null, 'ppm', 12, 'INVALID'), occupied: false,
        history: historyTimes.map((time, i) => ({ time, temperature: [26, 25.8, 26.3, 29, 28, 30.2, 29.8, 29.2][i], humidity: [65, 66, 66, 72, 68, 75, 73, 71][i] })) },
    ],
    alerts: [
      { id: 'alert-01', severity: 'WARNING', status: 'OPEN', title: 'Study lamp is offline', source: 'plug-study-01', detail: 'The node has not reported for more than an hour. Its actual state is unknown.', action: 'Check the plug power and local Wi-Fi before sending a command.', createdAt: ago(80) },
      { id: 'alert-02', severity: 'WARNING', status: 'OPEN', title: 'Bedroom readings are stale', source: 'room-bed-01', detail: 'Temperature and humidity have not updated for 28 minutes.', action: 'Inspect the room sensor. Do not use its last reading for automation.', createdAt: ago(20) },
      { id: 'alert-03', severity: 'CRITICAL', status: 'OPEN', title: 'Back door position unknown', source: 'door-back-01', detail: 'The contact node is offline. Closed-door status cannot be confirmed.', action: 'Check the door locally and restore the sensor connection.', createdAt: ago(40) },
      { id: 'alert-04', severity: 'INFO', status: 'ACKNOWLEDGED', title: 'Gateway restarted', source: 'gateway-01', detail: 'Sample gateway restart completed. No real gateway is connected.', action: 'Review the simulated recovery event.', createdAt: ago(240), updatedAt: ago(230) },
      { id: 'alert-05', severity: 'INFO', status: 'RESOLVED', title: 'Tank refilled', source: 'tank-01', detail: 'Sample tank fill cycle completed at 74%.', action: 'No action required.', createdAt: ago(180), updatedAt: ago(170) },
    ],
    automations: [
      { id: 'rule-01', name: 'Low water reserve', trigger: 'Tank level below configured low threshold', conditions: ['Fresh, valid readings for 3 samples', '5% recovery hysteresis', 'One notification per 30 minutes'], action: 'Create a warning alert', enabled: true, history: [{ timestamp: ago(1440), result: 'Sample: warning generated at 18%.' }] },
      { id: 'rule-02', name: 'Garden morning watering', trigger: 'Soil moisture below 30%', conditions: ['06:00–07:00 Asia/Colombo', 'Tank above 30%', 'No leak or sensor fault', 'Maximum 10 minutes; verify flow'], action: 'Request bounded irrigation from local gateway', enabled: false, history: [{ timestamp: ago(600), result: 'Sample: skipped outside watering window.' }] },
      { id: 'rule-03', name: 'Away mode lighting', trigger: 'Security mode changes to Away', conditions: ['Selected convenience lights online', 'Wait for device confirmation'], action: 'Request living room lights OFF', enabled: true, history: [{ timestamp: ago(1500), result: 'Sample: lights OFF confirmed.' }] },
    ],
    energy: {
      power: measure(842, 'W'), todayKwh: 14.8, monthKwh: 186.7, voltage: 230.4, powerFactor: .96,
      tariff: { id: 'demo-flat-v1', effectiveFrom: '2026-10-01', rate: 35, fixedCharge: 500, label: 'Illustrative flat-rate demo — not an official tariff' },
      history: [1.1, .7, .6, 2.4, 2.8, 1.9, 2.6, 2.7].map((kwh, i) => ({ time: historyTimes[i], kwh })),
      circuits: [{ name: 'Kitchen appliances', watts: 430 }, { name: 'Lighting', watts: 142 }, { name: 'Fans', watts: 120 }, { name: 'Other monitored loads', watts: 150 }],
    },
    water: { level: measure(74, '%'), capacityLitres: 1000, pumpState: 'OFF', pumpRuntimeMinutes: 18,
      history: [88, 85, 79, 72, 66, 58, 82, 74].map((percent, i) => ({ time: historyTimes[i], percent })) },
    security: { mode: 'HOME', contacts: [
      { id: 'door-front-01', name: 'Front entrance', door: 'CLOSED', lock: 'LOCKED', observedAt: ago(0), availability: 'ONLINE' },
      { id: 'door-back-01', name: 'Back door', door: 'UNKNOWN', lock: 'UNKNOWN', observedAt: ago(43), availability: 'OFFLINE' },
      { id: 'window-living-01', name: 'Living room window', door: 'OPEN', observedAt: ago(0), availability: 'ONLINE' },
    ], events: [
      { id: 'event-01', timestamp: ago(12), description: 'Front entrance locked', method: 'Sample local key event' },
      { id: 'event-02', timestamp: ago(43), description: 'Back door contact unavailable', method: 'Sample heartbeat timeout' },
      { id: 'event-03', timestamp: ago(65), description: 'Home mode selected', method: 'Sample homeowner action' },
    ] },
    garden: { name: 'Garden zone 1', soilMoisture: measure(34, '%'), valveState: 'OFF', maxRuntimeMinutes: 10, wateringWindow: '06:00–07:00 Asia/Colombo', lastWatered: ago(600) },
    pets: { name: 'Pet feeder preview', portionGrams: 40, schedule: ['07:00', '18:00'], foodPercent: 68,
      history: [{ timestamp: ago(300), grams: 40, result: 'Sample portion verified' }, { timestamp: ago(1080), grams: 40, result: 'Sample portion verified' }] },
  }
}
