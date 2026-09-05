import * as XLSX from 'xlsx'

function formatDateTimeForSheet(iso) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function exportDataToExcel({ products, orders, stockMovements, settings }) {
  const wb = XLSX.utils.book_new()

  const productRows = products.map((p) => ({
    'Tên sản phẩm': p.name,
    'Danh mục': p.category || '',
    'Giá bán (VND)': p.price,
    'Tồn kho': p.stock,
    'Mã vạch': p.barcode || ''
  }))
  const wsProducts = XLSX.utils.json_to_sheet(productRows)
  XLSX.utils.book_append_sheet(wb, wsProducts, 'San pham')

  const orderRows = orders.map((o) => ({
    'Mã hóa đơn': `#${o.id.slice(-6).toUpperCase()}`,
    'Thời gian': formatDateTimeForSheet(o.createdAt),
    'Số sản phẩm': o.items.reduce((sum, i) => sum + i.qty, 0),
    'Tổng tiền (VND)': o.total
  }))
  const wsOrders = XLSX.utils.json_to_sheet(orderRows)
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Hoa don')

  const orderItemRows = []
  orders.forEach((o) => {
    o.items.forEach((item) => {
      orderItemRows.push({
        'Mã hóa đơn': `#${o.id.slice(-6).toUpperCase()}`,
        'Thời gian': formatDateTimeForSheet(o.createdAt),
        'Tên sản phẩm': item.name,
        'Số lượng': item.qty,
        'Đơn giá (VND)': item.price,
        'Thành tiền (VND)': item.qty * item.price
      })
    })
  })
  const wsOrderItems = XLSX.utils.json_to_sheet(orderItemRows)
  XLSX.utils.book_append_sheet(wb, wsOrderItems, 'Chi tiet hoa don')

  const restockRows = stockMovements.map((m) => ({
    'Thời gian': formatDateTimeForSheet(m.createdAt),
    'Tên sản phẩm': m.productName,
    'Số lượng nhập': m.qty,
    'Ghi chú': m.note || ''
  }))
  const wsRestock = XLSX.utils.json_to_sheet(restockRows)
  XLSX.utils.book_append_sheet(wb, wsRestock, 'Nhap kho')

  const shopName = settings?.shopName || 'BanHang POS'
  const shopSlug = slugify(shopName)
  const dateStamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `du-lieu-${shopSlug}-${dateStamp}.xlsx`)
}
