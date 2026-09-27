const DEFAULT_SHOP_NAME = 'Bán Hàng POS'

export function formatNumber(n) {
  return Math.round(n || 0).toLocaleString('vi-VN')
}

export function formatNoteDate(iso) {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function buildDeliveryNote(order, settings, recipient) {
  const items = order.items.map((item, idx) => ({
    stt: idx + 1,
    name: item.name,
    qty: item.qty,
    price: item.price,
    total: item.qty * item.price
  }))
  const subtotal = items.reduce((sum, i) => sum + i.total, 0)
  const discount = order.discount || 0
  const discountPercent = subtotal > 0 && discount > 0 ? Math.round((discount / subtotal) * 1000) / 10 : 0
  return {
    code: `HD${order.id.slice(-6).toUpperCase()}`,
    date: formatNoteDate(order.createdAt),
    shopName: settings?.shopName || DEFAULT_SHOP_NAME,
    shopAddress: settings?.shopAddress || '',
    shopPhone: settings?.shopPhone || '',
    bankInfo: settings?.bankInfo || '',
    recipientName: recipient.name || 'Khách lẻ',
    recipientAddress: recipient.address || '',
    recipientPhone: recipient.phone || '',
    note: recipient.note || '',
    items,
    subtotal,
    discount,
    discountPercent,
    total: order.total
  }
}

const W = 1000
const PAD = 40
const SCALE = 2
const COLS = [
  { key: 'stt', label: 'STT', width: 60, align: 'center' },
  { key: 'name', label: 'Tên hàng', width: 330, align: 'left' },
  { key: 'qty', label: 'Số lượng', width: 110, align: 'center' },
  { key: 'price', label: 'Đơn giá', width: 130, align: 'right' },
  { key: 'total', label: 'Thành tiền', width: 150, align: 'right' },
  { key: 'extra', label: 'Ghi chú', width: 140, align: 'left' }
]
const FONT = 'Arial, "Helvetica Neue", sans-serif'

function wrapText(ctx, text, maxWidth) {
  const words = String(text).split(' ')
  const lines = []
  let line = ''
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = test
    }
  })
  if (line) lines.push(line)
  return lines.length ? lines : ['']
}

export function renderDeliveryNoteToBlob(note) {
  const measure = document.createElement('canvas').getContext('2d')
  measure.font = `15px ${FONT}`
  const rows = note.items.map((item) => ({ item, lines: wrapText(measure, item.name, COLS[1].width - 16) }))
  const rowHeights = rows.map((r) => Math.max(34, r.lines.length * 20 + 14))

  const infoLines = 2 + (note.shopAddress ? 1 : 0) + (note.bankInfo ? 1 : 0) + 3
  const tableHeight = 36 + rowHeights.reduce((a, b) => a + b, 0)
  const totalsHeight = (note.discount > 0 ? 3 : 1) * 32
  const height = PAD + 90 + infoLines * 26 + 20 + tableHeight + 16 + totalsHeight + (note.note ? 60 : 30) + 120 + PAD

  const canvas = document.createElement('canvas')
  canvas.width = W * SCALE
  canvas.height = height * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, height)
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#111111'

  function text(str, x, y, { size = 15, bold = false, align = 'left', color = '#111111' } = {}) {
    ctx.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`
    ctx.fillStyle = color
    ctx.textAlign = align
    ctx.fillText(str, x, y)
  }

  let y = PAD + 18
  text('BIÊN BẢN GIAO NHẬN HÀNG', W / 2, y, { size: 26, bold: true, align: 'center' })
  y += 34
  text(`${note.code}        Ngày ${note.date}`, W / 2, y, { size: 15, align: 'center', color: '#333333' })
  y += 44

  text(`${note.shopName.toUpperCase()}`, PAD, y, { bold: true })
  if (note.shopPhone) {
    ctx.font = `bold 15px ${FONT}`
    const w = ctx.measureText(note.shopName.toUpperCase()).width
    text(`   SĐT: ${note.shopPhone}`, PAD + w, y)
  }
  y += 26
  if (note.shopAddress) {
    text(`Địa chỉ: ${note.shopAddress}`, PAD, y)
    y += 26
  }
  if (note.bankInfo) {
    text(`Tài khoản: ${note.bankInfo}`, PAD, y)
    y += 26
  }
  y += 10
  text('Bên nhận hàng: ', PAD, y, { bold: true })
  ctx.font = `bold 15px ${FONT}`
  text(note.recipientName, PAD + ctx.measureText('Bên nhận hàng: ').width, y)
  y += 26
  text(`Địa chỉ: ${note.recipientAddress}`, PAD, y)
  y += 26
  text(`Điện thoại: ${note.recipientPhone}`, PAD, y)
  y += 30

  const tableX = PAD
  const tableW = COLS.reduce((s, c) => s + c.width, 0)
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 1

  function cellX(col, colX) {
    if (col.align === 'center') return colX + col.width / 2
    if (col.align === 'right') return colX + col.width - 8
    return colX + 8
  }

  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(tableX, y, tableW, 36)
  let colX = tableX
  COLS.forEach((col) => {
    text(col.label, colX + col.width / 2, y + 18, { bold: true, align: 'center' })
    colX += col.width
  })
  ctx.strokeRect(tableX, y, tableW, 36)
  let rowY = y + 36

  rows.forEach(({ item, lines }, idx) => {
    const h = rowHeights[idx]
    colX = tableX
    COLS.forEach((col) => {
      ctx.strokeRect(colX, rowY, col.width, h)
      if (col.key === 'name') {
        lines.forEach((line, i) => text(line, cellX(col, colX), rowY + 17 + i * 20))
      } else if (col.key !== 'extra') {
        const value = col.key === 'price' || col.key === 'total' ? formatNumber(item[col.key]) : String(item[col.key])
        text(value, cellX(col, colX), rowY + h / 2, { align: col.align })
      }
      colX += col.width
    })
    rowY += h
  })

  y = rowY + 28
  const labelX = tableX + COLS[0].width + COLS[1].width + COLS[2].width + COLS[3].width - 8
  const valueX = labelX + COLS[4].width
  if (note.discount > 0) {
    text('Cộng tiền hàng', labelX, y, { bold: true, align: 'right' })
    text(formatNumber(note.subtotal), valueX, y, { bold: true, align: 'right' })
    y += 32
    text(`Chiết khấu (giảm giá) hóa đơn${note.discountPercent ? ` (${note.discountPercent}%)` : ''}`, labelX, y, {
      bold: true,
      align: 'right'
    })
    text(formatNumber(note.discount), valueX, y, { bold: true, align: 'right' })
    y += 32
  }
  text('Tổng tiền thanh toán', labelX, y, { bold: true, align: 'right' })
  text(formatNumber(note.total), valueX, y, { bold: true, align: 'right' })
  y += 36

  text(`Ghi chú: ${note.note}`, PAD, y, { bold: true })
  y += note.note ? 60 : 30

  const sigW = (W - PAD * 2) / 3
  ;['THỦ KHO', 'NGƯỜI GIAO HÀNG', 'NGƯỜI NHẬN HÀNG'].forEach((label, i) => {
    text(label, PAD + sigW * i + sigW / 2, y, { align: 'center' })
    text('(Ký, ghi rõ họ tên)', PAD + sigW * i + sigW / 2, y + 22, { size: 13, align: 'center', color: '#666666' })
  })

  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'))
}
