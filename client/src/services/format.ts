export function dateTime(value: string) {
  return new Intl.DateTimeFormat('en-LK', { timeZone: 'Asia/Colombo', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
export function timeOnly(value: string) {
  return new Intl.DateTimeFormat('en-LK', { timeZone: 'Asia/Colombo', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
export function age(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60_000))
  return minutes < 1 ? 'less than a minute ago' : minutes < 60 ? `${minutes} min ago` : `${Math.floor(minutes / 60)}h ${minutes % 60}m ago`
}
export function money(value: number) { return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(value) }
