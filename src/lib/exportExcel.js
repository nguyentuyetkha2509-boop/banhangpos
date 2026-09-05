import { XLSX, buildStyledSheet } from './excelStyle'

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

export function exportDataToExcel({ products, orders, stockMovements, returns, settings }) {
  const wb = XLSX.utils.book_new()

  const wsProducts = buildStyledSheet({
    headers: ['Tên sản phẩm', 'Danh mục', 'Giá nhập gần nhất (VND)', 'Giá bán (VND)', 'Tồn kho', 'Mã vạch'],
    rows: products.map((p) => [p.name, p.category || '', p.costPrice || 0, p.price, p.stock, p.barcode || '']),
    moneyCols: [2, 3]
  })
  XLSX.utils.book_append_sheet(wb, wsProducts, 'San pham')

  const wsOrders = buildStyledSheet({
    headers: ['Mã hóa đơn', 'Thời gian', 'Số sản phẩm', 'Tổng tiền (VND)'],
    rows: orders.map((o) => [
      `#${o.id.slice(-6).toUpperCase()}`,
      formatDateTimeForSheet(o.createdAt),
      o.items.reduce((sum, i) => sum + i.qty, 0),
      o.total
    ]),
    moneyCols: [3]
  })
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Hoa don')

  const orderItemRows = []
  orders.forEach((o) => {
    o.items.forEach((item) => {
      orderItemRows.push([
        `#${o.id.slice(-6).toUpperCase()}`,
        formatDateTimeForSheet(o.createdAt),
        item.name,
        item.qty,
        item.price,
        item.qty * item.price
      ])
    })
  })
  const wsOrderItems = buildStyledSheet({
    headers: ['Mã hóa đơn', 'Thời gian', 'Tên sản phẩm', 'Số lượng', 'Đơn giá (VND)', 'Thành tiền (VND)'],
    rows: orderItemRows,
    moneyCols: [4, 5]
  })
  XLSX.utils.book_append_sheet(wb, wsOrderItems, 'Chi tiet hoa don')

  const wsRestock = buildStyledSheet({
    headers: ['Thời gian', 'Tên sản phẩm', 'Số lượng nhập', 'Giá nhập (VND)', 'Giá bán từ lô này (VND)', 'Ghi chú'],
    rows: stockMovements.map((m) => [
      formatDateTimeForSheet(m.createdAt),
      m.productName,
      m.qty,
      m.costPrice || 0,
      m.sellPrice || 0,
      m.note || ''
    ]),
    moneyCols: [3, 4]
  })
  XLSX.utils.book_append_sheet(wb, wsRestock, 'Nhap kho')

  const wsReturns = buildStyledSheet({
    headers: ['Thời gian', 'Tên sản phẩm', 'Khách hàng', 'Số lượng trả', 'Giá trị hoàn (VND)', 'Ghi chú'],
    rows: (returns || []).map((r) => [
      formatDateTimeForSheet(r.createdAt),
      r.productName,
      r.customerName,
      r.qty,
      r.refundAmount,
      r.note || ''
    ]),
    moneyCols: [4]
  })
  XLSX.utils.book_append_sheet(wb, wsReturns, 'Tra hang')

  const shopName = settings?.shopName || 'BanHang POS'
  const shopSlug = slugify(shopName)
  const dateStamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `du-lieu-${shopSlug}-${dateStamp}.xlsx`)
}

export function exportReportToExcel({
  periodLabel,
  rangeLabel,
  periodOrders,
  periodReturns,
  soldByProduct,
  customerStats,
  customerProductRows,
  totals,
  settings
}) {
  const wb = XLSX.utils.book_new()

  const wsOverview = buildStyledSheet({
    title: 'Tổng quan báo cáo',
    meta: [
      ['Cửa hàng:', settings?.shopName || 'BanHang POS'],
      ['Kỳ báo cáo:', `${periodLabel} - ${rangeLabel}`]
    ],
    headers: ['Chỉ tiêu', 'Giá trị'],
    rows: [
      ['Doanh thu (VND)', totals.grossRevenue],
      ['Số lượng trả hàng', totals.totalReturnQty],
      ['Giá trị trả hàng (VND)', totals.totalReturnValue],
      ['Doanh thu thuần (VND)', totals.netRevenue],
      ['Giá vốn (VND)', totals.totalCost],
      ['Lãi ước tính (VND)', totals.totalProfit],
      ['Số hóa đơn', totals.orderCount],
      ['Số sản phẩm đã bán', totals.totalItemsSold]
    ],
    moneyCols: [1],
    boldLabelRows: ['Doanh thu thuần (VND)', 'Lãi ước tính (VND)']
  })
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Tong quan')

  const wsCustomers = buildStyledSheet({
    headers: ['Xếp hạng', 'Khách hàng', 'SL mua', 'Doanh thu (VND)', 'SL Trả', 'Giá trị trả (VND)', 'Doanh thu thuần (VND)', 'Số hóa đơn'],
    rows: customerStats.map((c, idx) => [
      idx + 1,
      c.name,
      c.qty,
      c.revenue,
      c.returnQty,
      c.returnValue,
      c.netRevenue,
      c.orderCount
    ]),
    moneyCols: [3, 5, 6]
  })
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'Khach hang')

  const wsCustomerProducts = buildStyledSheet({
    headers: ['Khách hàng', 'Tên hàng', 'SL mua', 'Doanh thu (VND)', 'SL Trả', 'Giá trị trả (VND)', 'Doanh thu thuần (VND)'],
    rows: (customerProductRows || []).map((r) => [
      r.customerName,
      r.name,
      r.qty,
      r.revenue,
      r.returnQty,
      r.returnValue,
      r.netRevenue
    ]),
    moneyCols: [3, 5, 6]
  })
  XLSX.utils.book_append_sheet(wb, wsCustomerProducts, 'Hang ban theo khach')

  const wsProducts = buildStyledSheet({
    headers: ['Tên sản phẩm', 'Số lượng đã bán', 'Doanh thu (VND)'],
    rows: soldByProduct.map((p) => [p.name, p.qty, p.revenue]),
    moneyCols: [2]
  })
  XLSX.utils.book_append_sheet(wb, wsProducts, 'San pham ban')

  const wsOrders = buildStyledSheet({
    headers: ['Mã hóa đơn', 'Thời gian', 'Khách hàng', 'Số sản phẩm', 'Tổng tiền (VND)'],
    rows: periodOrders.map((o) => [
      `#${o.id.slice(-6).toUpperCase()}`,
      formatDateTimeForSheet(o.createdAt),
      (o.customerName || '').trim() || 'Khách lẻ',
      o.items.reduce((sum, i) => sum + i.qty, 0),
      o.total
    ]),
    moneyCols: [4]
  })
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Chi tiet don hang')

  const wsReturns = buildStyledSheet({
    headers: ['Thời gian', 'Tên sản phẩm', 'Khách hàng', 'Số lượng trả', 'Giá trị hoàn (VND)', 'Ghi chú'],
    rows: (periodReturns || []).map((r) => [
      formatDateTimeForSheet(r.createdAt),
      r.productName,
      r.customerName,
      r.qty,
      r.refundAmount,
      r.note || ''
    ]),
    moneyCols: [4]
  })
  XLSX.utils.book_append_sheet(wb, wsReturns, 'Tra hang')

  const shopName = settings?.shopName || 'BanHang POS'
  const shopSlug = slugify(shopName)
  const periodSlug = slugify(periodLabel)
  const dateStamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `bao-cao-${periodSlug}-${shopSlug}-${dateStamp}.xlsx`)
}

export function exportCustomerToExcel({
  customerName,
  periodLabel,
  rangeLabel,
  customerStat,
  productRows,
  customerOrders,
  settings
}) {
  const wb = XLSX.utils.book_new()
  const shopName = settings?.shopName || 'BanHang POS'

  const wsMain = buildStyledSheet({
    title: 'Báo cáo hàng bán theo khách',
    meta: [
      ['Cửa hàng:', shopName],
      ['Ngày lập:', new Date().toLocaleString('vi-VN')],
      ['Kỳ báo cáo:', `${periodLabel} - ${rangeLabel}`],
      ['Khách hàng:', customerName]
    ],
    headers: ['Tên hàng', 'SL mua', 'Doanh thu (VND)', 'SL Trả', 'Giá trị trả (VND)', 'Doanh thu thuần (VND)'],
    rows: (productRows || []).map((r) => [r.name, r.qty, r.revenue, r.returnQty, r.returnValue, r.netRevenue]),
    totalRow: [
      'Tổng cộng',
      customerStat.qty,
      customerStat.revenue,
      customerStat.returnQty,
      customerStat.returnValue,
      customerStat.netRevenue
    ],
    moneyCols: [2, 4, 5]
  })
  XLSX.utils.book_append_sheet(wb, wsMain, 'Ban hang theo khach')

  const wsOrders = buildStyledSheet({
    headers: ['Mã hóa đơn', 'Thời gian', 'Số sản phẩm', 'Tổng tiền (VND)'],
    rows: (customerOrders || []).map((o) => [
      `#${o.id.slice(-6).toUpperCase()}`,
      formatDateTimeForSheet(o.createdAt),
      o.items.reduce((sum, i) => sum + i.qty, 0),
      o.total
    ]),
    moneyCols: [3]
  })
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Chi tiet hoa don')

  const shopSlug = slugify(shopName)
  const customerSlug = slugify(customerName)
  const periodSlug = slugify(periodLabel)
  const dateStamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `khach-hang-${customerSlug}-${periodSlug}-${shopSlug}-${dateStamp}.xlsx`)
}
