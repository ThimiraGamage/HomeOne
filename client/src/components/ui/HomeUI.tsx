import { lazy, Suspense, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Measurement } from '../../services/models'
import { age, dateTime } from '../../services/format'

const HistoryPlot = lazy(() => import('./HistoryPlot'))
export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const value = typeof children === 'string' ? children : ''
  const good = ['ONLINE', 'GOOD', 'ACKNOWLEDGED', 'RESOLVED', 'LOCKED', 'CLOSED'].includes(value)
  const bad = ['CRITICAL', 'FAILED', 'INVALID', 'JAMMED'].includes(value)
  const warning = ['WARNING', 'STALE', 'SUSPECT', 'PENDING', 'TIMED_OUT', 'OPEN', 'UNLOCKED'].includes(value)
  return <span className={`status-badge status-badge--${tone ?? (good ? 'good' : bad ? 'bad' : warning ? 'warning' : 'neutral')}`}>{typeof children === 'string' ? children.replaceAll('_', ' ') : children}</span>
}
export function Panel({ title, subtitle, children, action, className = '' }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode; className?: string }) {
  return <section className={`home-panel ${className}`}><div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>
}
export function Metric({ label, value, detail, icon, to, tone = '' }: { label: string; value: ReactNode; detail: ReactNode; icon?: ReactNode; to?: string; tone?: string }) {
  const content = <><div className="metric-top"><span>{label}</span>{icon}</div><div className="metric-value">{value}</div><div className="metric-detail">{detail}</div></>
  return to ? <Link to={to} className={`metric-card ${tone}`}>{content}</Link> : <div className={`metric-card ${tone}`}>{content}</div>
}
export function MeasurementValue({ measurement }: { measurement: Measurement }) {
  return <div className="measurement"><strong>{measurement.quality === 'INVALID' || measurement.value === null ? 'Unavailable' : `${measurement.value} ${measurement.unit}`}</strong><Badge>{measurement.quality}</Badge><small title={dateTime(measurement.observedAt)}>Observed {age(measurement.observedAt)}</small></div>
}
export function Empty({ message = 'No items match these filters.' }: { message?: string }) { return <div className="empty-state">{message}</div> }
export function HistoryChart({ data, field, unit, label }: { data: { time: string; [key: string]: string | number }[]; field: string; unit: string; label: string }) {
  const values = data.map(item => Number(item[field]))
  if (!values.length) return <Empty message="No history available." />
  return <figure className="history-figure"><div className="chart-wrap" role="img" aria-label={`${label}. Minimum ${Math.min(...values).toFixed(1)} ${unit}, maximum ${Math.max(...values).toFixed(1)} ${unit}.`}>
    <Suspense fallback={<div className="empty-state" role="status">Loading chart… History values are available below.</div>}><HistoryPlot data={data} field={field} unit={unit} label={label} /></Suspense></div><figcaption>{label} · simulated history · times in Asia/Colombo</figcaption>
    <details className="chart-data"><summary>View history values</summary><div className="table-scroll"><table><thead><tr><th>Observed</th><th>{label} ({unit})</th></tr></thead><tbody>{data.map(item => <tr key={item.time}><td>{dateTime(item.time)}</td><td>{Number(item[field]).toFixed(1)}</td></tr>)}</tbody></table></div></details>
  </figure>
}
