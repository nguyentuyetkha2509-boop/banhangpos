import { formatVND } from './storage'

const DEFAULT_SHOP_NAME = 'Bán Hàng POS'

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

function buildReceiptHtml(order, settings) {
  const shopName = settings?.shopName
  const shopAddress = settings?.shopAddress
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
<title>Hóa đơn ${order.id}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    width: 300px;
    margin: 0 auto;
    padding: 16px 12px;
    color: #111;
  }
  .back-bar {
    width: 100%;
    max-width: 300px;
    margin: 0 auto 12px;
  }
  .back-btn {
    font-family: Arial, sans-serif;
    font-size: 14px;
    font-weight: 600;
    color: #0f766e;
    background: #f0fdfa;
    border: none;
    border-radius: 8px;
    padding: 10px 14px;
    cursor: pointer;
  }
  .back-btn:active { opacity: 0.8; }
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
  @page {
    margin: 0;
  }
  @media print {
    body { width: 100%; }
    .back-bar { display: none; }
  }
</style>
</head>
<body>
  <div class="back-bar">
    <button class="back-btn" onclick="window.close()">← Quay lại</button>
  </div>
  <div class="center">
    <p class="shop-name">${escapeHtml(shopName || DEFAULT_SHOP_NAME)}</p>
    ${shopAddress ? `<p class="meta">${escapeHtml(shopAddress)}</p>` : ''}
    <p class="meta">Hóa đơn bán hàng</p>
  </div>
  <hr />
  <p class="meta">Mã hóa đơn: #${order.id.slice(-6).toUpperCase()}</p>
  <p class="meta">Thời gian: ${formatDateTime(order.createdAt)}</p>
  <hr />
  <table>
    ${rows}
    <tr class="total-row">
      <td>Tổng cộng</td>
      <td class="item-total">${formatVND(order.total)}</td>
    </tr>
  </table>
  <hr />
  <p class="footer center">Cảm ơn quý khách!</p>
</body>
</html>`
}

export function printReceipt(order, settings) {
  const receiptWindow = window.open('', '_blank', 'width=380,height=640')
  if (!receiptWindow) {
    alert('Trình duyệt đang chặn cửa sổ in. Vui lòng cho phép popup rồi thử lại.')
    return
  }
  receiptWindow.document.open()
  receiptWindow.document.write(buildReceiptHtml(order, settings))
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
