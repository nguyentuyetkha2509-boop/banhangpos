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
    'Giá nhập gần nhất (VND)': p.costPrice || 0,
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
    'Giá nhập (VND)': m.costPrice || 0,
    'Giá bán từ lô này (VND)': m.sellPrice || 0,
    'Ghi chú': m.note || ''
  }))
  const wsRestock = XLSX.utils.json_to_sheet(restockRows)
  XLSX.utils.book_append_sheet(wb, wsRestock, 'Nhap kho')

  const shopName = settings?.shopName || 'BanHang POS'
  const shopSlug = slugify(shopName)
  const dateStamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `du-lieu-${shopSlug}-${dateStamp}.xlsx`)
}

export function exportReportToExcel({
  periodLabel,
  rangeLabel,
  periodOrders,
  soldByProduct,
  customerStats,
  customerProductRows,
  totals,
  settings
}) {
  const wb = XLSX.utils.book_new()

  const overviewRows = [
    { 'Chỉ tiêu': 'Kỳ báo cáo', 'Giá trị': `${periodLabel} - ${rangeLabel}` },
    { 'Chỉ tiêu': 'Doanh thu (VND)', 'Giá trị': totals.totalRevenue },
    { 'Chỉ tiêu': 'Giá vốn (VND)', 'Giá trị': totals.totalCost },
    { 'Chỉ tiêu': 'Lãi ước tính (VND)', 'Giá trị': totals.totalProfit },
    { 'Chỉ tiêu': 'Số hóa đơn', 'Giá trị': totals.orderCount },
    { 'Chỉ tiêu': 'Số sản phẩm đã bán', 'Giá trị': totals.totalItemsSold }
  ]
  const wsOverview = XLSX.utils.json_to_sheet(overviewRows)
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Tong quan')

  const customerRows = customerStats.map((c, idx) => ({
    'Xếp hạng': idx + 1,
    'Khách hàng': c.name,
    'Số lượng mua': c.qty,
    'Doanh thu (VND)': c.revenue,
    'Số hóa đơn': c.orderCount
  }))
  const wsCustomers = XLSX.utils.json_to_sheet(customerRows)
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'Khach hang')

  const customerProductSheetRows = (customerProductRows || []).map((r) => ({
    'Khách hàng': r.customerName,
    'Tên sản phẩm': r.name,
    'Số lượng mua': r.qty,
    'Doanh thu (VND)': r.revenue
  }))
  const wsCustomerProducts = XLSX.utils.json_to_sheet(customerProductSheetRows)
  XLSX.utils.book_append_sheet(wb, wsCustomerProducts, 'Hang ban theo khach')

  const productRows = soldByProduct.map((p) => ({
    'Tên sản phẩm': p.name,
    'Số lượng đã bán': p.qty,
    'Doanh thu (VND)': p.revenue
  }))
  const wsProducts = XLSX.utils.json_to_sheet(productRows)
  XLSX.utils.book_append_sheet(wb, wsProducts, 'San pham ban')

  const orderRows = periodOrders.map((o) => ({
    'Mã hóa đơn': `#${o.id.slice(-6).toUpperCase()}`,
    'Thời gian': formatDateTimeForSheet(o.createdAt),
    'Khách hàng': (o.customerName || '').trim() || 'Khách lẻ',
    'Số sản phẩm': o.items.reduce((sum, i) => sum + i.qty, 0),
    'Tổng tiền (VND)': o.total
  }))
  const wsOrders = XLSX.utils.json_to_sheet(orderRows)
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Chi tiet don hang')

  const shopName = settings?.shopName || 'BanHang POS'
  const shopSlug = slugify(shopName)
  const periodSlug = slugify(periodLabel)
  const dateStamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `bao-cao-${periodSlug}-${shopSlug}-${dateStamp}.xlsx`)
}
