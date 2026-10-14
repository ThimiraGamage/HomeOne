import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { timeOnly } from '../../services/format'

export default function HistoryPlot({ data, field, unit, label }: { data: { time: string; [key: string]: string | number }[]; field: string; unit: string; label: string }) {
  const chartData = data.map(item => ({ ...item, label: timeOnly(item.time) }))
  return <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }} accessibilityLayer>
    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e5ebf1" />
    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#748196' }} tickLine={false} axisLine={false} minTickGap={28} />
    <YAxis tick={{ fontSize: 11, fill: '#748196' }} tickLine={false} axisLine={false} />
    <Tooltip formatter={value => [`${Number(value).toFixed(1)} ${unit}`, label]} contentStyle={{ borderRadius: 12, borderColor: '#e5ebf1' }} />
    <Area type="monotone" dataKey={field} stroke="#32a69a" fill="#32a69a" fillOpacity={.13} strokeWidth={2.5} isAnimationActive={false} />
  </AreaChart></ResponsiveContainer>
}
