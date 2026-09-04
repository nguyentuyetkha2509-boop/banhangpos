import { formatVND } from './storage'

const DEFAULT_SHOP_NAME = 'Bán Hàng POS'
const WIDTH = 380
const PADDING = 20
const LINE_HEIGHT = 24
const SCALE = 2

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function renderReceiptToBlob(order, settings) {
  const shopName = settings?.shopName || DEFAULT_SHOP_NAME
  const shopAddress = settings?.shopAddress

  let lineCount = 0
  lineCount += 1 // ten cua hang
  if (shopAddress) lineCount += 1
  lineCount += 1 // "Hoa don ban hang"
  lineCount += 1 // dashed
  lineCount += 2 // ma hoa don + thoi gian
  lineCount += 1 // dashed
  lineCount += order.items.length * 2
  lineCount += 1 // tong cong
  lineCount += 1 // dashed
  lineCount += 1 // cam on

  const height = PADDING * 2 + lineCount * LINE_HEIGHT

  const canvas = document.createElement('canvas')
  canvas.width = WIDTH * SCALE
  canvas.height = height * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, WIDTH, height)
  ctx.textBaseline = 'top'

  let y = PADDING

  function centerText(text, font, color = '#111111') {
    ctx.font = font
    ctx.fillStyle = color
    const w = ctx.measureText(text).width
    ctx.fillText(text, (WIDTH - w) / 2, y)
    y += LINE_HEIGHT
  }

  function leftText(text, font = '13px "Courier New", monospace', color = '#333333') {
    ctx.font = font
    ctx.fillStyle = color
    ctx.fillText(text, PADDING, y)
    y += LINE_HEIGHT
  }

  function dashedLine() {
    ctx.strokeStyle = '#999999'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(PADDING, y + 10)
    ctx.lineTo(WIDTH - PADDING, y + 10)
    ctx.stroke()
    ctx.setLineDash([])
    y += LINE_HEIGHT
  }

  function itemRow(name, detail, total) {
    ctx.font = '14px "Courier New", monospace'
    ctx.fillStyle = '#111111'
    ctx.fillText(name, PADDING, y)
    y += LINE_HEIGHT
    ctx.font = '13px "Courier New", monospace'
    ctx.fillStyle = '#444444'
    ctx.fillText(detail, PADDING, y)
    ctx.fillStyle = '#111111'
    const w = ctx.measureText(total).width
    ctx.fillText(total, WIDTH - PADDING - w, y)
    y += LINE_HEIGHT
  }

  centerText(shopName, 'bold 20px "Courier New", monospace')
  if (shopAddress) centerText(shopAddress, '13px "Courier New", monospace', '#333333')
  centerText('Hóa đơn bán hàng', '13px "Courier New", monospace', '#333333')
  dashedLine()
  leftText(`Mã hóa đơn: #${order.id.slice(-6).toUpperCase()}`)
  leftText(`Thời gian: ${formatDateTime(order.createdAt)}`)
  dashedLine()

  order.items.forEach((item) => {
    itemRow(item.name, `${item.qty} x ${formatVND(item.price)}`, formatVND(item.qty * item.price))
  })

  ctx.font = 'bold 16px "Courier New", monospace'
  ctx.fillStyle = '#111111'
  ctx.fillText('Tổng cộng', PADDING, y)
  const totalText = formatVND(order.total)
  const totalW = ctx.measureText(totalText).width
  ctx.fillText(totalText, WIDTH - PADDING - totalW, y)
  y += LINE_HEIGHT

  dashedLine()
  centerText('Cảm ơn quý khách!', '13px "Courier New", monospace', '#333333')

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png')
  })
}
