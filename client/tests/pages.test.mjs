import test from 'node:test'
import assert from 'node:assert/strict'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { navigationGroups } from '../src/data/navigation.ts'
import { SectionPage } from '../src/pages/SectionPage.tsx'
import { AppShell } from '../src/components/layout/AppShell.tsx'
import { MockHomeService } from '../src/services/mockHomeService.ts'
import { HomeServiceContext } from '../src/services/homeStore.ts'

const pages = navigationGroups.flatMap(group => group.items)
const render = (service, path) => {
  const page = pages.find(item => item.path === path)
  return renderToStaticMarkup(createElement(HomeServiceContext.Provider, { value: service },
    createElement(MemoryRouter, { initialEntries: [path] },
      createElement(AppShell, null, createElement(SectionPage, { page })),
    ),
  ))
}
const create = async () => { const service = new MockHomeService(undefined, async () => {}); await service.load(); return service }

test('all twelve pages render meaningful content with a global simulation notice', async () => {
  const service = await create()
  const expected = {
    '/dashboard': 'Needs attention', '/energy': 'Tariff and estimate', '/water': 'Reserve thresholds',
    '/rooms': 'Bedroom', '/devices': 'Device inventory', '/security': 'Access and security history',
    '/garden': 'Before watering', '/pets': 'Optional module preview', '/automations': 'Low water reserve',
    '/alerts': 'Alert centre', '/maintenance': 'Device health', '/settings': 'Home preferences',
  }
  assert.equal(pages.length, 12)
  for (const page of pages) {
    const markup = render(service, page.path)
    assert.ok(markup.includes(`<h1>${page.title}</h1>`), page.path)
    assert.ok(markup.includes(expected[page.path]), page.path)
    assert.ok(markup.includes('Simulation mode'), page.path)
    assert.ok(!markup.includes('placeholder-panel'), page.path)
  }
})

test('settings and alert mutations appear across independent page renders', async () => {
  const service = await create()
  await service.saveSettings({ ...service.getSnapshot().data.settings, homeName: 'Pilot house', lowLevel: 25 })
  assert.ok(render(service, '/water').includes('Below 25%'))
  assert.ok(render(service, '/dashboard').includes('Pilot house'))
  await service.updateAlert('alert-01', 'ACKNOWLEDGED')
  assert.ok(render(service, '/dashboard').includes('2 open demo alerts'))
  await service.setAutomation('rule-02', true)
  assert.match(render(service, '/garden'), /Rule preview[\s\S]*?Enabled/)
})

test('device UI keeps actual state ON during pending confirmation and renders failure state', async () => {
  let finish
  const service = new MockHomeService(undefined, ms => ms === 350 ? Promise.resolve() : new Promise(resolve => { finish = resolve }))
  await service.load()
  const pending = service.commandDevice('light-living-01', 'OFF', 'failure')
  const waiting = render(service, '/devices')
  assert.ok(waiting.includes('Waiting for confirmation'))
  assert.match(waiting, /Living room lights[\s\S]*?Confirmed reported state<\/span><strong>ON<\/strong>[\s\S]*?Requested: OFF/)
  finish()
  await pending
  assert.ok(render(service, '/devices').includes('FAILED'))
  assert.ok(render(service, '/devices').includes('Reported state is unchanged'))
})

test('security keeps door and lock separate; offline and invalid measurements are visible', async () => {
  const service = await create()
  const security = render(service, '/security')
  assert.ok(security.includes('Security status incomplete'))
  assert.ok(security.includes('Contact position'))
  assert.ok(security.includes('Lock feedback'))
  assert.ok(!security.includes('>Unlock<'))
  const rooms = render(service, '/rooms')
  assert.ok(rooms.includes('STALE'))
  assert.ok(rooms.includes('INVALID'))
  assert.ok(rooms.includes('Unavailable'))
})

test('loading and failed-load pages expose useful status and retry controls', async () => {
  const service = new MockHomeService(undefined, async () => { throw Error('failure') })
  assert.ok(render(service, '/dashboard').includes('Loading your simulated home'))
  await service.load()
  assert.ok(render(service, '/dashboard').includes('Retry loading'))
})
