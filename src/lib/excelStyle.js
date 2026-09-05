import * as XLSX from 'xlsx-js-style'

const BRAND = '2E7D32'
const TOTAL_FILL = 'FEF3C7'
const BORDER_COLOR = 'D1D5DB'
const LABEL_COLOR = '475569'

const THIN_BORDER = {
  top: { style: 'thin', color: { rgb: BORDER_COLOR } },
  bottom: { style: 'thin', color: { rgb: BORDER_COLOR } },
  left: { style: 'thin', color: { rgb: BORDER_COLOR } },
  right: { style: 'thin', color: { rgb: BORDER_COLOR } }
}

const MONEY_FORMAT = '#,##0'

function ref(r, c) {
  return XLSX.utils.encode_cell({ r, c })
}

function ensureCell(ws, r, c) {
  const cellRef = ref(r, c)
  if (!ws[cellRef]) ws[cellRef] = { t: 's', v: '' }
  return ws[cellRef]
}

function widthFor(header, rows, col) {
  let max = String(header ?? '').length
  rows.forEach((row) => {
    const v = row[col]
    const len = v == null ? 0 : String(v).length
    if (len > max) max = len
  })
  return Math.min(Math.max(max + 4, 14), 46)
}

/**
 * Builds a styled worksheet: a title + metadata block (merged to span the
 * full table width so labels/values aren't clipped by narrow columns), a
 * bold colored header row, bordered body rows (with VND columns
 * right-aligned and comma-formatted), and an optional highlighted total row.
 */
export function buildStyledSheet({ title, meta, headers, rows, totalRow, moneyCols = [], boldLabelRows = [] }) {
  const colCount = headers.length
  const data = []
  const merges = []
  if (title) data.push([title])
  if (meta) meta.forEach(([label, value]) => data.push([label, value]))
  if (title || meta) data.push([])
  const headerRow = data.length
  data.push(headers)
  const bodyStart = headerRow + 1
  rows.forEach((row) => data.push(row))
  let totalRowIndex = -1
  if (totalRow) {
    totalRowIndex = data.length
    data.push(totalRow)
  }

  const ws = XLSX.utils.aoa_to_sheet(data)

  if (title) {
    ensureCell(ws, 0, 0).s = { font: { bold: true, sz: 14, color: { rgb: BRAND } } }
    if (colCount > 1) merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } })
  }
  if (meta) {
    meta.forEach((_, i) => {
      const r = title ? 1 + i : i
      ensureCell(ws, r, 0).s = { font: { bold: true, color: { rgb: LABEL_COLOR } } }
      ensureCell(ws, r, 1).s = { font: { color: { rgb: '1E293B' } } }
      if (colCount > 2) merges.push({ s: { r, c: 1 }, e: { r, c: colCount - 1 } })
    })
  }

  headers.forEach((_, c) => {
    ensureCell(ws, headerRow, c).s = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
      fill: { fgColor: { rgb: BRAND } },
      border: THIN_BORDER,
      alignment: { vertical: 'center', horizontal: 'center', wrapText: true }
    }
  })

  rows.forEach((row, i) => {
    const r = bodyStart + i
    const isBoldRow = boldLabelRows.includes(row[0])
    headers.forEach((_, c) => {
      const cell = ensureCell(ws, r, c)
      const numeric = moneyCols.includes(c)
      cell.s = {
        font: isBoldRow ? { bold: true } : undefined,
        border: THIN_BORDER,
        alignment: { vertical: 'center', horizontal: numeric ? 'right' : 'left' }
      }
      if (numeric && typeof cell.v === 'number') cell.z = MONEY_FORMAT
    })
  })

  if (totalRowIndex >= 0) {
    headers.forEach((_, c) => {
      const cell = ensureCell(ws, totalRowIndex, c)
      const numeric = moneyCols.includes(c)
      cell.s = {
        font: { bold: true },
        fill: { fgColor: { rgb: TOTAL_FILL } },
        border: THIN_BORDER,
        alignment: { vertical: 'center', horizontal: numeric ? 'right' : 'left' }
      }
      if (numeric && typeof cell.v === 'number') cell.z = MONEY_FORMAT
    })
  }

  ws['!cols'] = headers.map((h, c) => ({ wch: widthFor(h, rows, c) }))
  if (merges.length > 0) ws['!merges'] = merges

  return ws
}

export { XLSX }
