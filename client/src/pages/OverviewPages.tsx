import { Activity, Bell, Droplets, Shield, Smartphone, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, HistoryChart, MeasurementValue, Metric, Panel } from '../components/ui/HomeUI'
import { dateTime, money } from '../services/format'
import type { HomeData } from '../services/models'

export function Dashboard({ data }: { data: HomeData }) {
  const online = data.devices.filter(device => device.availability === 'ONLINE').length
  const active = data.devices.filter(device => device.availability === 'ONLINE' && device.actualState === 'ON').length
  const alerts = data.alerts.filter(alert => alert.status !== 'RESOLVED')
  const unknownDoors = data.security.contacts.filter(contact => contact.door === 'UNKNOWN').length
  const onLights = data.devices.filter(device => device.controllable && device.actualState === 'ON').length
  const estimate = data.energy.monthKwh * data.energy.tariff.rate + data.energy.tariff.fixedCharge
  return <>
    <div className="welcome-strip"><div><span className="eyebrow">YOUR HOME AT A GLANCE</span><h2>A little more clarity. Every day.</h2><p>Explore your home’s simulated systems and see what needs attention.</p></div><div className="welcome-icon"><Activity size={38} strokeWidth={1.4} /></div></div>
    <div className="metrics-grid">
      <Metric label="Power now" value={<>{data.energy.power.value}<small> W</small></>} detail={`${data.energy.todayKwh} kWh today`} icon={<Zap size={19} />} to="/energy" />
      <Metric label="Water reserve" value={<>{data.water.level.value}<small>%</small></>} detail={`${Math.round((data.water.level.value ?? 0) * data.water.capacityLitres / 100)} of ${data.water.capacityLitres.toLocaleString()} L`} icon={<Droplets size={19} />} to="/water" />
      <Metric label="Devices online" value={<>{online}<small> / {data.devices.length}</small></>} detail={`${active} reporting ON · ${onLights} convenience loads ON`} icon={<Smartphone size={19} />} to="/devices" />
      <Metric label="Unresolved alerts" value={alerts.length} detail={`${alerts.filter(alert => alert.severity === 'CRITICAL').length} critical · review recommended`} icon={<Bell size={19} />} to="/alerts" tone="metric-warning" />
    </div>
    <div className="content-grid">
      <Panel title="Energy overview" subtitle={`Today: ${data.energy.todayKwh} kWh · 3-hour sample intervals`} action={<Link className="text-link" to="/energy">View energy →</Link>}><HistoryChart data={data.energy.history} field="kwh" unit="kWh" label="Energy consumed" /><div className="panel-footnote">Month-to-date demo estimate <strong>{money(estimate)}</strong> · illustrative tariff</div></Panel>
      <Panel title="Needs attention" subtitle="Acknowledgement does not fix the underlying device." action={<Link className="text-link" to="/alerts">All alerts →</Link>}><div className="compact-list">{alerts.slice(0, 3).map(alert => <Link to="/alerts" className="attention-row" key={alert.id}><Badge>{alert.severity}</Badge><strong>{alert.title}</strong><span>{alert.action}</span></Link>)}</div></Panel>
    </div>
    <div className="content-grid">
      <Panel title="Room comfort" subtitle="Freshness is shown for each measurement." action={<Link className="text-link" to="/rooms">All rooms →</Link>}><div className="room-summary-list">{data.rooms.map(room => <div className="room-summary" key={room.id}><strong>{room.name}</strong><MeasurementValue measurement={room.temperature} /><MeasurementValue measurement={room.humidity} /></div>)}</div></Panel>
      <Panel title="Home status" subtitle="Sample status, with gaps clearly identified."><div className="status-summary"><Shield size={30} /><div><h3>{unknownDoors ? 'Security status incomplete' : 'Contacts reporting'}</h3><p>{unknownDoors} door position unknown · {data.security.mode.toLowerCase()} mode</p><Link className="text-link" to="/security">Review doors and locks →</Link></div></div><div className="summary-facts"><div><span>Pump reported state</span><Badge>{data.water.pumpState}</Badge></div><div><span>Enabled preview rules</span><strong>{data.automations.filter(rule => rule.enabled).length} / {data.automations.length}</strong></div><div><span>Garden soil moisture</span><strong>{data.garden.soilMoisture.value}%</strong></div></div></Panel>
    </div>
  </>
}

export function Energy({ data }: { data: HomeData }) {
  const energy = data.energy
  return <>
    <div className="metrics-grid"><Metric label="Power now" value={`${energy.power.value} W`} detail="Main meter · simulated" icon={<Zap size={19} />} /><Metric label="Energy today" value={`${energy.todayKwh} kWh`} detail="Sum of the sample history intervals" /><Metric label="Month to date" value={`${energy.monthKwh} kWh`} detail="Includes today’s sample consumption" /><Metric label="Estimated month to date" value={money(energy.monthKwh * energy.tariff.rate + energy.tariff.fixedCharge)} detail="Illustrative rate + fixed charge" /></div>
    <div className="content-grid"><Panel title="Consumption history" subtitle="Each point represents a 3-hour interval."><HistoryChart data={energy.history} field="kwh" unit="kWh" label="Energy consumed" /></Panel><Panel title="Where power is going" subtitle="Selected simulated circuits; totals match power now."><div className="circuit-list">{energy.circuits.map(circuit => <div key={circuit.name}><div className="split-line"><strong>{circuit.name}</strong><span>{circuit.watts} W</span></div><progress max={energy.power.value ?? 1} value={circuit.watts} aria-label={`${circuit.name} power share`} /></div>)}</div><div className="summary-facts"><div><span>Voltage</span><strong>{energy.voltage} V</strong></div><div><span>Power factor</span><strong>{energy.powerFactor}</strong></div></div></Panel></div>
    <Panel title="Tariff and estimate" subtitle={energy.tariff.label}><div className="tariff-grid"><div><span className="muted">Version / effective date</span><p><strong>{energy.tariff.id}</strong> · {energy.tariff.effectiveFrom}</p></div><div><span className="muted">Illustrative calculation</span><p>{energy.monthKwh} kWh × {money(energy.tariff.rate)} + {money(energy.tariff.fixedCharge)} = <strong>{money(energy.monthKwh * energy.tariff.rate + energy.tariff.fixedCharge)}</strong></p></div></div><p className="panel-footnote">This demo uses a flat sample rate, not Sri Lanka’s official block tariff. A verified, effective-dated billing engine belongs in the backend milestone.</p></Panel>
  </>
}

export function Water({ data }: { data: HomeData }) {
  const { water, settings } = data
  const level = water.level.value
  const valid = water.level.quality === 'GOOD' && level !== null
  const condition = !valid ? 'Unavailable' : level < settings.criticalLevel ? 'Critical reserve' : level < settings.lowLevel ? 'Low reserve' : level > settings.highLevel ? 'High level' : 'Within thresholds'
  return <>
    <div className="metrics-grid"><Metric label="Tank level" value={valid ? `${level}%` : 'Unavailable'} detail={condition} icon={<Droplets size={19} />} /><Metric label="Estimated water" value={valid ? `${Math.round(level * water.capacityLitres / 100)} L` : 'Unavailable'} detail={`${water.capacityLitres.toLocaleString()} L calibrated sample capacity`} /><Metric label="Pump state" value={water.pumpState} detail="Reported state · monitor-only in this milestone" /><Metric label="Pump runtime today" value={`${water.pumpRuntimeMinutes} min`} detail="Simulated operating history" /></div>
    <div className="content-grid"><Panel title="Water tank" subtitle="Sample tank with a constant cross-section."><div className="tank-layout"><div className="water-tank" role="img" aria-label={`Tank ${level}% full`}><div className="tank-fill" style={{ height: `${level ?? 0}%` }} /><strong>{level}%</strong></div><div><MeasurementValue measurement={water.level} /><p>Estimated litres = usable capacity × level fraction.</p><Badge tone={valid ? 'good' : 'bad'}>{condition}</Badge><p className="muted">Observed {dateTime(water.level.observedAt)}</p></div></div></Panel><Panel title="Level history" subtitle="Simulated consumption and a refill cycle."><HistoryChart data={water.history} field="percent" unit="%" label="Tank level" /></Panel></div>
    <Panel title="Reserve thresholds" subtitle="These demo preferences can be edited in Settings." action={<Link className="text-link" to="/settings">Edit thresholds →</Link>}><div className="threshold-grid"><div><Badge>CRITICAL</Badge><h3>Below {settings.criticalLevel}%</h3><p>Critical reserve; non-essential irrigation must be blocked.</p></div><div><Badge>WARNING</Badge><h3>Below {settings.lowLevel}%</h3><p>Low-reserve notification after persistent valid readings.</p></div><div><Badge tone="neutral">HIGH</Badge><h3>Above {settings.highLevel}%</h3><p>Review fill status; independent float protection is required for real control.</p></div></div><p className="panel-footnote">No pump command is available. Future control requires a local gateway, valid measurements, bounded runtime and independent protection.</p></Panel>
  </>
}
