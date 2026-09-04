import { formatVND } from './storage'

const SHOP_NAME = 'BanHang POS'

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function buildReceiptHtml(order) {
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td colspan="2" class="item-name">${escapeHtml(item.name)}</td>
        </tr>
        <tr>
          <td class="item-detail">${item.qty} x ${formatVND(item.price)}</td>
          <td class="item-total">${formatVND(item.qty * item.price)}</td>
        </tr>`
    )
    .join('')

  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<title>Hoa don ${order.id}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    width: 300px;
    margin: 0 auto;
    padding: 16px 12px;
    color: #111;
  }
  .center { text-align: center; }
  .shop-name { font-size: 18px; font-weight: 700; margin: 0 0 2px; }
  .meta { font-size: 12px; color: #333; margin: 2px 0; }
  hr { border: none; border-top: 1px dashed #999; margin: 10px 0; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .item-name { padding-top: 6px; }
  .item-detail { color: #444; }
  .item-total { text-align: right; }
  .total-row td { padding-top: 10px; font-size: 15px; font-weight: 700; }
  .total-row .item-total { text-align: right; }
  .footer { margin-top: 16px; font-size: 12px; }
  @media print {
    body { width: 100%; }
  }
</style>
</head>
<body>
  <div class="center">
    <p class="shop-name">${escapeHtml(SHOP_NAME)}</p>
    <p class="meta">Hoa don ban hang</p>
  </div>
  <hr />
  <p class="meta">Ma hoa don: #${order.id.slice(-6).toUpperCase()}</p>
  <p class="meta">Thoi gian: ${formatDateTime(order.createdAt)}</p>
  <hr />
  <table>
    ${rows}
    <tr class="total-row">
      <td>Tong cong</td>
      <td class="item-total">${formatVND(order.total)}</td>
    </tr>
  </table>
  <hr />
  <p class="footer center">Cam on quy khach!</p>
</body>
</html>`
}

export function printReceipt(order) {
  const receiptWindow = window.open('', '_blank', 'width=380,height=640')
  if (!receiptWindow) {
    alert('Trinh duyet dang chan cua so in. Vui long cho phep popup roi thu lai.')
    return
  }
  receiptWindow.document.open()
  receiptWindow.document.write(buildReceiptHtml(order))
  receiptWindow.document.close()
  receiptWindow.focus()

  const triggerPrint = () => {
    receiptWindow.print()
  }
  if (receiptWindow.document.readyState === 'complete') {
    triggerPrint()
  } else {
    receiptWindow.onload = triggerPrint
  }
}
