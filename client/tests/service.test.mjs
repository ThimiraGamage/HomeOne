import test from 'node:test'
import assert from 'node:assert/strict'
import { MockHomeService, validateSettings } from '../src/services/mockHomeService.ts'
import { defaultSettings } from '../src/services/seed.ts'

const instant = async () => {}
const create = async (storage, wait = instant) => {
  const service = new MockHomeService(storage, wait)
  await service.load()
  return service
}
const device = service => service.getSnapshot().data.devices.find(item => item.id === 'light-living-01')
const memoryStorage = () => {
  const entries = new Map()
  return { getItem: key => entries.get(key) ?? null, setItem: (key, value) => entries.set(key, value), removeItem: key => entries.delete(key) }
}

test('energy totals and offline/invalid fixture data remain internally consistent', async () => {
  const data = (await create()).getSnapshot().data
  assert.equal(data.energy.circuits.reduce((sum, item) => sum + item.watts, 0), data.energy.power.value)
  assert.equal(Math.round(data.energy.history.reduce((sum, item) => sum + item.kwh, 0) * 10) / 10, data.energy.todayKwh)
  assert.ok(data.devices.some(item => item.availability === 'OFFLINE' && item.actualState === 'UNKNOWN'))
  assert.ok(data.rooms.some(item => item.temperature.quality === 'STALE'))
  assert.equal(data.rooms.find(item => item.id === 'kitchen').co2.value, null)
})

test('pending requests preserve confirmed state, block duplicates, then acknowledge actual state', async () => {
  let finish
  const service = await create(undefined, ms => ms === 350 ? Promise.resolve() : new Promise(resolve => { finish = resolve }))
  const before = device(service)
  const pending = service.commandDevice('light-living-01', 'OFF')
  assert.equal(device(service).commandStatus, 'PENDING')
  assert.equal(device(service).requestedState, 'OFF')
  assert.equal(device(service).actualState, 'ON')
  await assert.rejects(service.commandDevice('light-living-01', 'OFF'), /current command/)
  finish()
  await pending
  assert.equal(device(service).actualState, 'OFF')
  assert.equal(device(service).commandStatus, 'ACKNOWLEDGED')
  assert.equal(before.actualState, 'ON', 'old snapshots stay immutable')
})

for (const [outcome, expected] of [['failure', 'FAILED'], ['timeout', 'TIMED_OUT']]) {
  test(`${outcome} leaves actual state unchanged and can be retried`, async () => {
    const service = await create()
    await service.commandDevice('light-living-01', 'OFF', outcome)
    assert.equal(device(service).actualState, 'ON')
    assert.equal(device(service).commandStatus, expected)
    await service.commandDevice('light-living-01', 'OFF', 'success')
    assert.equal(device(service).actualState, 'OFF')
  })
}

test('offline and monitor-only devices reject commands without modifying data', async () => {
  const service = await create()
  const before = service.getSnapshot().data
  await assert.rejects(service.commandDevice('plug-study-01', 'ON'), /Offline/)
  await assert.rejects(service.commandDevice('fridge-01', 'OFF'), /monitor-only/)
  await assert.rejects(service.commandDevice('missing', 'ON'), /not found/)
  await assert.rejects(service.commandDevice('light-living-01', 'INVALID'), /Unsupported/)
  assert.equal(service.getSnapshot().data, before)
})

test('a reset cancels in-flight confirmation and clears saved preferences', async () => {
  let finish
  const storage = memoryStorage()
  const service = await create(storage, ms => ms === 350 ? Promise.resolve() : new Promise(resolve => { finish = resolve }))
  await service.saveSettings({ ...defaultSettings, homeName: 'Pilot house' })
  const pending = service.commandDevice('light-living-01', 'OFF')
  await service.reset()
  finish()
  await pending
  assert.equal(device(service).actualState, 'ON')
  assert.equal(device(service).commandStatus, 'IDLE')
  assert.equal((await create(storage)).getSnapshot().data.settings.homeName, 'My home')
})

test('settings validate bounds and names before any persistence or mutation', async () => {
  const service = await create()
  for (const patch of [
    { homeName: '  ' }, { homeName: 'x'.repeat(61) }, { lowLevel: 10 }, { criticalLevel: -1 },
    { highLevel: 101 }, { lowLevel: NaN }, { lowLevel: Infinity }, { lowLevel: 95 },
    { currency: 'USD' }, { notifications: 'yes' },
  ]) {
    await assert.rejects(service.saveSettings({ ...defaultSettings, ...patch }))
    assert.deepEqual(service.getSnapshot().data.settings, defaultSettings)
  }
  assert.equal(validateSettings({ ...defaultSettings, homeName: '  Home  ' }).homeName, 'Home')
})

test('only preferences persist; session alert, rule and device changes reset on refresh', async () => {
  const storage = memoryStorage()
  const service = await create(storage)
  await service.saveSettings({ ...defaultSettings, homeName: 'Pilot', lowLevel: 25, notifications: false })
  await service.updateAlert('alert-01', 'ACKNOWLEDGED')
  await service.setAutomation('rule-02', true)
  await service.commandDevice('light-living-01', 'OFF')
  const reloaded = (await create(storage)).getSnapshot().data
  assert.equal(reloaded.settings.homeName, 'Pilot')
  assert.equal(reloaded.settings.lowLevel, 25)
  assert.equal(reloaded.settings.notifications, false)
  assert.equal(reloaded.alerts[0].status, 'OPEN')
  assert.equal(reloaded.automations.find(rule => rule.id === 'rule-02').enabled, false)
  assert.equal(reloaded.devices.find(item => item.id === 'light-living-01').actualState, 'ON')
})

test('alert acknowledgement, resolution and rule history share one observable state', async () => {
  const service = await create()
  let notifications = 0
  const unsubscribe = service.subscribe(() => notifications++)
  await service.updateAlert('alert-01', 'ACKNOWLEDGED')
  assert.equal(service.getSnapshot().data.alerts.filter(item => item.status === 'OPEN').length, 2)
  assert.equal(service.getSnapshot().data.alerts.filter(item => item.status !== 'RESOLVED').length, 4)
  await service.updateAlert('alert-01', 'RESOLVED')
  assert.equal(service.getSnapshot().data.alerts.filter(item => item.status !== 'RESOLVED').length, 3)
  assert.equal(service.getSnapshot().data.devices.find(item => item.id === 'plug-study-01').availability, 'OFFLINE')
  await service.setAutomation('rule-02', true)
  assert.equal(service.getSnapshot().data.automations.find(item => item.id === 'rule-02').history.length, 2)
  await assert.rejects(service.updateAlert('alert-01', 'ACKNOWLEDGED'), /already resolved/)
  assert.equal(notifications, 3)
  unsubscribe()
  await service.setAutomation('rule-02', false)
  assert.equal(notifications, 3)
})

test('blocked or corrupt browser storage falls back cleanly to session preferences', async () => {
  const blocked = { getItem() { throw Error('blocked') }, setItem() { throw Error('blocked') }, removeItem() { throw Error('blocked') } }
  const service = await create(blocked)
  assert.equal(service.getSnapshot().error, null)
  await service.saveSettings({ ...defaultSettings, homeName: 'Session home' })
  assert.equal(service.getSnapshot().data.settings.homeName, 'Session home')
  assert.match(service.getSnapshot().notice, /session/)
  const corrupt = await create({ ...memoryStorage(), getItem: () => '{broken-json' })
  assert.deepEqual(corrupt.getSnapshot().data.settings, defaultSettings)
  assert.match(corrupt.getSnapshot().notice, /could not be read/)
})

test('telemetry refresh preserves stale, invalid and offline timestamps', async () => {
  let now = Date.now()
  const service = new MockHomeService(undefined, instant, () => now)
  await service.load()
  const before = service.getSnapshot().data
  now += 60_000
  service.refreshTelemetry()
  const after = service.getSnapshot().data
  assert.notEqual(after.rooms[0].temperature.observedAt, before.rooms[0].temperature.observedAt)
  assert.equal(after.rooms[1].temperature.observedAt, before.rooms[1].temperature.observedAt)
  assert.equal(after.rooms[2].co2.observedAt, before.rooms[2].co2.observedAt)
  assert.equal(after.devices.find(item => item.id === 'plug-study-01').lastSeen, before.devices.find(item => item.id === 'plug-study-01').lastSeen)
})

test('service load errors are exposed and retry recovers', async () => {
  let fail = true
  const service = new MockHomeService(undefined, async () => { if (fail) throw Error('unavailable') })
  await service.load()
  assert.equal(service.getSnapshot().loading, false)
  assert.ok(service.getSnapshot().error)
  fail = false
  await service.load()
  assert.ok(service.getSnapshot().data)
  assert.equal(service.getSnapshot().error, null)
})
