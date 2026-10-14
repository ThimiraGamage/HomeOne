import type { CommandOutcome, HomeData, HomeService, HomeSnapshot, Settings } from './models.ts'
import { createSeed, defaultSettings } from './seed.ts'

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem'>
const settingsKey = 'homeone.demo.settings.v1'
export function validateSettings(input: Settings): Settings {
  const name = typeof input.homeName === 'string' ? input.homeName.trim() : ''
  if (!name || name.length > 60) throw new Error('Home name must contain 1–60 characters.')
  const { criticalLevel: critical, lowLevel: low, highLevel: high } = input
  if (![critical, low, high].every(Number.isFinite) || critical < 0 || high > 100 || !(critical < low && low < high)) {
    throw new Error('Thresholds must satisfy 0 ≤ critical < low < high ≤ 100%.')
  }
  if (input.timezone !== 'Asia/Colombo' || input.currency !== 'LKR' || typeof input.notifications !== 'boolean') throw new Error('Invalid home preferences.')
  return { homeName: name, timezone: 'Asia/Colombo', currency: 'LKR', criticalLevel: critical, lowLevel: low, highLevel: high, notifications: input.notifications }
}

/** The UI depends on HomeService; replace this adapter when the API milestone starts. */
export class MockHomeService implements HomeService {
  private snapshot: HomeSnapshot = { data: null, loading: true, error: null, notice: null }
  private listeners = new Set<() => void>()
  private revision = 0
  private sequence = 0
  private loading: Promise<void> | null = null
  private storage?: Storage
  private wait: (ms: number) => Promise<void>
  private now: () => number
  constructor(storage?: Storage, wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)), now = () => Date.now()) {
    this.storage = storage
    this.wait = wait
    this.now = now
  }
  getSnapshot = () => this.snapshot
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  private emit(patch: Partial<HomeSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch }
    this.listeners.forEach(listener => listener())
  }
  private data(): HomeData {
    if (!this.snapshot.data) throw new Error('Home data is not loaded. Please retry.')
    return this.snapshot.data
  }
  private update(change: (data: HomeData) => HomeData, notice: string | null = null) {
    this.emit({ data: change(this.data()), notice })
  }
  clearNotice = () => this.emit({ notice: null })
  load = (): Promise<void> => {
    if (this.loading) return this.loading
    this.emit({ loading: true, error: null })
    this.loading = this.loadData().finally(() => { this.loading = null })
    return this.loading
  }
  private async loadData() {
    try {
      await this.wait(350)
      const data = this.snapshot.data ?? createSeed(this.now())
      let notice: string | null = null
      if (!this.snapshot.data && this.storage) {
        try {
          const saved = this.storage.getItem(settingsKey)
          if (saved) data.settings = validateSettings(JSON.parse(saved))
        } catch { notice = 'Saved preferences could not be read. Default settings are in use.' }
      }
      this.emit({ data, loading: false, error: null, notice })
    } catch { this.emit({ loading: false, error: 'The demo service could not load. Please try again.' }) }
  }
  refreshTelemetry = () => {
    if (!this.snapshot.data) return
    const observedAt = new Date(this.now()).toISOString()
    const fresh = (reading: HomeData['water']['level']) => reading.quality === 'GOOD' ? { ...reading, observedAt } : reading
    this.update(data => ({ ...data, generatedAt: observedAt,
      devices: data.devices.map(device => device.availability === 'ONLINE' && !device.issue ? { ...device, lastSeen: observedAt } : device),
      rooms: data.rooms.map(room => ({ ...room, temperature: fresh(room.temperature), humidity: fresh(room.humidity), ...(room.co2 ? { co2: fresh(room.co2) } : {}) })),
      energy: { ...data.energy, power: fresh(data.energy.power) }, water: { ...data.water, level: fresh(data.water.level) },
      garden: { ...data.garden, soilMoisture: fresh(data.garden.soilMoisture) },
      security: { ...data.security, contacts: data.security.contacts.map(contact => contact.availability === 'ONLINE' ? { ...contact, observedAt } : contact) },
    }), this.snapshot.notice)
  }
  commandDevice = async (id: string, state: 'ON' | 'OFF', outcome: CommandOutcome = 'success') => {
    if (state !== 'ON' && state !== 'OFF') throw new Error('Unsupported requested state.')
    if (!['success', 'failure', 'timeout'].includes(outcome)) throw new Error('Unsupported simulation outcome.')
    const device = this.data().devices.find(item => item.id === id)
    if (!device) throw new Error('Device not found.')
    if (!device.controllable) throw new Error('This device is monitor-only.')
    if (device.availability !== 'ONLINE') throw new Error('Offline or unknown devices cannot receive commands.')
    if (device.commandStatus === 'PENDING') throw new Error('Wait for the current command to finish.')
    const commandId = `demo-${++this.sequence}`
    const revision = this.revision
    this.update(data => ({ ...data, devices: data.devices.map(item => item.id === id ? { ...item, requestedState: state, commandStatus: 'PENDING', commandId, commandMessage: 'Request sent; waiting for simulated device confirmation.' } : item) }))
    try { await this.wait(outcome === 'timeout' ? 2500 : 1400) }
    catch { outcome = 'failure' }
    if (revision !== this.revision) return
    const status = outcome === 'success' ? 'ACKNOWLEDGED' : outcome === 'timeout' ? 'TIMED_OUT' : 'FAILED'
    const message = outcome === 'success' ? `Simulated device confirmed ${state}.` : outcome === 'timeout' ? 'Confirmation timed out. Reported state is unchanged.' : 'Simulated device rejected the request. Reported state is unchanged.'
    this.update(data => ({ ...data, devices: data.devices.map(item => item.id === id && item.commandId === commandId ? {
      ...item, actualState: outcome === 'success' ? state : item.actualState,
      commandStatus: status, commandMessage: message,
      lastSeen: outcome === 'success' ? new Date(this.now()).toISOString() : item.lastSeen,
    } : item) }), `${device.name}: ${message}`)
  }
  updateAlert = async (id: string, status: 'ACKNOWLEDGED' | 'RESOLVED') => {
    if (!['ACKNOWLEDGED', 'RESOLVED'].includes(status)) throw new Error('Unsupported alert status.')
    const alert = this.data().alerts.find(item => item.id === id)
    if (!alert) throw new Error('Alert not found.')
    if (alert.status === 'RESOLVED') throw new Error('This alert is already resolved.')
    this.update(data => ({ ...data, alerts: data.alerts.map(item => item.id === id ? { ...item, status, updatedAt: new Date(this.now()).toISOString() } : item) }), `${alert.title}: ${status === 'RESOLVED' ? 'resolved' : 'acknowledged'} in this demo session.`)
  }
  setAutomation = async (id: string, enabled: boolean) => {
    const rule = this.data().automations.find(item => item.id === id)
    if (!rule) throw new Error('Automation not found.')
    this.update(data => ({ ...data, automations: data.automations.map(item => item.id === id ? { ...item, enabled,
      history: [{ timestamp: new Date(this.now()).toISOString(), result: `Demo rule ${enabled ? 'enabled' : 'disabled'}; no physical action executed.` }, ...item.history] } : item) }), `${rule.name} ${enabled ? 'enabled' : 'disabled'} for preview. No gateway scheduler is connected.`)
  }
  saveSettings = async (input: Settings) => {
    const settings = validateSettings(input)
    let persisted = false
    try { if (this.storage) { this.storage.setItem(settingsKey, JSON.stringify(settings)); persisted = true } } catch { /* Session state remains usable when storage is blocked. */ }
    this.update(data => ({ ...data, settings }), persisted ? 'Preferences saved in this browser only.' : 'Preferences updated for this session. Browser storage is unavailable.')
  }
  reset = async () => {
    this.revision++
    let removed = true
    try { this.storage?.removeItem(settingsKey) } catch { removed = false }
    this.emit({ data: { ...createSeed(this.now()), settings: { ...defaultSettings } }, loading: false, error: null,
      notice: removed ? 'Demo restored. Session changes and saved preferences cleared.' : 'Demo restored for this session. Browser storage could not be cleared.' })
  }
}
