export const PERIODS = [
  { key: 'day', label: 'Ngày' },
  { key: 'week', label: 'Tuần' },
  { key: 'month', label: 'Tháng' },
  { key: 'quarter', label: 'Quý' }
]

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

function startOfWeek(date) {
  const d = startOfDay(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

function endOfWeek(date) {
  const s = startOfWeek(date)
  const e = new Date(s)
  e.setDate(e.getDate() + 6)
  return endOfDay(e)
}

function startOfMonth(date) {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

function endOfMonth(date) {
  const d = new Date(date)
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

function startOfQuarter(date) {
  const d = new Date(date)
  const qMonth = Math.floor(d.getMonth() / 3) * 3
  return new Date(d.getFullYear(), qMonth, 1, 0, 0, 0, 0)
}

function endOfQuarter(date) {
  const d = new Date(date)
  const qMonth = Math.floor(d.getMonth() / 3) * 3
  return endOfDay(new Date(d.getFullYear(), qMonth + 3, 0))
}

function isoWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}

export function getRange(period, refDate) {
  const d = new Date(refDate)
  if (period === 'week') return [startOfWeek(d), endOfWeek(d)]
  if (period === 'month') return [startOfMonth(d), endOfMonth(d)]
  if (period === 'quarter') return [startOfQuarter(d), endOfQuarter(d)]
  return [startOfDay(d), endOfDay(d)]
}

export function shiftRef(period, refDate, dir) {
  const d = new Date(refDate)
  if (period === 'week') d.setDate(d.getDate() + 7 * dir)
  else if (period === 'month') d.setMonth(d.getMonth() + dir)
  else if (period === 'quarter') d.setMonth(d.getMonth() + 3 * dir)
  else d.setDate(d.getDate() + dir)
  return d
}

export function formatRangeLabel(period, refDate) {
  const [start, end] = getRange(period, refDate)
  const fmt = (d) => d.toLocaleDateString('vi-VN')
  if (period === 'week') return `Tuần ${isoWeekNumber(start)} (${fmt(start)} - ${fmt(end)})`
  if (period === 'month') return `Tháng ${start.getMonth() + 1}/${start.getFullYear()}`
  if (period === 'quarter') return `Quý ${Math.floor(start.getMonth() / 3) + 1}/${start.getFullYear()}`
  return fmt(start)
}

export function toDateInputValue(date) {
  const d = new Date(date)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}
