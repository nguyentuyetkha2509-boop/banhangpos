import * as XLSX from 'xlsx-js-style'

const BRAND = '0F766E'
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
  return Math.min(Math.max(max + 2, 10), 42)
}

/**
 * Builds a styled worksheet: optional title + metadata block, a bold colored
 * header row, bordered body rows (with VND columns right-aligned and
 * comma-formatted), and an optional highlighted total row.
 */
export function buildStyledSheet({ title, meta, headers, rows, totalRow, moneyCols = [], boldLabelRows = [] }) {
  const data = []
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
  }
  if (meta) {
    meta.forEach((_, i) => {
      const r = title ? 1 + i : i
      ensureCell(ws, r, 0).s = { font: { bold: true, color: { rgb: LABEL_COLOR } } }
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

  return ws
}

export { XLSX }
