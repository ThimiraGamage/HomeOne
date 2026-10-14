export type Availability = 'ONLINE' | 'OFFLINE' | 'UNKNOWN'
export type Quality = 'GOOD' | 'STALE' | 'SUSPECT' | 'INVALID'
export type CommandStatus = 'IDLE' | 'PENDING' | 'ACKNOWLEDGED' | 'FAILED' | 'TIMED_OUT'
export type CommandOutcome = 'success' | 'failure' | 'timeout'
export type Device = {
  id: string; homeId: string; name: string; roomId: string; type: string
  availability: Availability; actualState: 'ON' | 'OFF' | 'UNKNOWN'
  requestedState?: 'ON' | 'OFF'; controllable: boolean; commandStatus: CommandStatus
  commandId?: string; commandMessage?: string; lastSeen: string
  firmware: string; rssi: number | null; issue?: string
}
export type Measurement = { value: number | null; unit: string; observedAt: string; quality: Quality }
export type Room = {
  id: string; name: string; deviceId: string; temperature: Measurement
  humidity: Measurement; co2?: Measurement; occupied: boolean | null
  history: { time: string; temperature: number; humidity: number }[]
}
export type Alert = {
  id: string; severity: 'INFO' | 'WARNING' | 'CRITICAL'
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'; title: string
  source: string; detail: string; action: string; createdAt: string; updatedAt?: string
}
export type Automation = {
  id: string; name: string; trigger: string; conditions: string[]; action: string
  enabled: boolean; history: { timestamp: string; result: string }[]
}
export type Settings = {
  homeName: string; timezone: 'Asia/Colombo'; currency: 'LKR'
  criticalLevel: number; lowLevel: number; highLevel: number; notifications: boolean
}
export type HomeData = {
  homeId: string; generatedAt: string; devices: Device[]; rooms: Room[]
  alerts: Alert[]; automations: Automation[]; settings: Settings
  energy: {
    power: Measurement; todayKwh: number; monthKwh: number; voltage: number; powerFactor: number
    tariff: { id: string; effectiveFrom: string; rate: number; fixedCharge: number; label: string }
    history: { time: string; kwh: number }[]; circuits: { name: string; watts: number }[]
  }
  water: {
    level: Measurement; capacityLitres: number; pumpState: 'ON' | 'OFF' | 'FAULT' | 'UNKNOWN'
    history: { time: string; percent: number }[]; pumpRuntimeMinutes: number
  }
  security: {
    mode: 'DISARMED' | 'HOME' | 'AWAY' | 'NIGHT' | 'ALARM'
    contacts: { id: string; name: string; door: 'OPEN' | 'CLOSED' | 'UNKNOWN'; lock?: 'LOCKED' | 'UNLOCKED' | 'JAMMED' | 'UNKNOWN'; observedAt: string; availability: Availability }[]
    events: { id: string; timestamp: string; description: string; method: string }[]
  }
  garden: { name: string; soilMoisture: Measurement; valveState: 'ON' | 'OFF'; maxRuntimeMinutes: number; wateringWindow: string; lastWatered: string }
  pets: { name: string; portionGrams: number; schedule: string[]; foodPercent: number; history: { timestamp: string; grams: number; result: string }[] }
}
export type HomeSnapshot = { data: HomeData | null; loading: boolean; error: string | null; notice: string | null }
export interface HomeService {
  subscribe(listener: () => void): () => void
  getSnapshot(): HomeSnapshot
  load(): Promise<void>
  refreshTelemetry(): void
  commandDevice(id: string, state: 'ON' | 'OFF', outcome?: CommandOutcome): Promise<void>
  updateAlert(id: string, status: 'ACKNOWLEDGED' | 'RESOLVED'): Promise<void>
  setAutomation(id: string, enabled: boolean): Promise<void>
  saveSettings(settings: Settings): Promise<void>
  reset(): Promise<void>
  clearNotice(): void
}
