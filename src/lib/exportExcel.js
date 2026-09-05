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

const PAYMENT_LABELS = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', debt: 'Ghi nợ' }

function customerKeyOf(name) {
  return (name || '').trim() || 'Khách lẻ'
}

export function exportDataToExcel({ products, orders, stockMovements, returns, debtPayments, settings }) {
  const wb = XLSX.utils.book_new()
  const shopName = settings?.shopName || 'BanHang POS'
  const now = new Date().toLocaleString('vi-VN')
  const meta = [
    ['Cửa hàng:', shopName],
    ['Ngày xuất:', now]
  ]

  const wsProducts = buildStyledSheet({
    title: 'Danh sách sản phẩm',
    meta,
    headers: ['Tên sản phẩm', 'Danh mục', 'Giá nhập gần nhất (VND)', 'Giá bán (VND)', 'Tồn kho', 'Mã vạch'],
    rows: products.map((p) => [p.name, p.category || '', p.costPrice || 0, p.price, p.stock, p.barcode || '']),
    moneyCols: [2, 3]
  })
  XLSX.utils.book_append_sheet(wb, wsProducts, 'San pham')

  const wsOrders = buildStyledSheet({
    title: 'Danh sách hóa đơn',
    meta,
    headers: ['Mã hóa đơn', 'Thời gian', 'Khách hàng', 'Số sản phẩm', 'Giảm giá (VND)', 'Tổng tiền (VND)', 'Thanh toán', 'Trạng thái'],
    rows: orders.map((o) => [
      `#${o.id.slice(-6).toUpperCase()}`,
      formatDateTimeForSheet(o.createdAt),
      customerKeyOf(o.customerName),
      o.items.reduce((sum, i) => sum + i.qty, 0),
      o.discount || 0,
      o.total,
      PAYMENT_LABELS[o.paymentMethod] || 'Tiền mặt',
      o.cancelled ? 'Đã hủy' : 'Bình thường'
    ]),
    moneyCols: [4, 5]
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
    title: 'Chi tiết hóa đơn',
    meta,
    headers: ['Mã hóa đơn', 'Thời gian', 'Tên sản phẩm', 'Số lượng', 'Đơn giá (VND)', 'Thành tiền (VND)'],
    rows: orderItemRows,
    moneyCols: [4, 5]
  })
  XLSX.utils.book_append_sheet(wb, wsOrderItems, 'Chi tiet hoa don')

  const wsRestock = buildStyledSheet({
    title: 'Lịch sử nhập kho',
    meta,
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
    title: 'Lịch sử trả hàng',
    meta,
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

  const debtMap = new Map()
  orders.forEach((o) => {
    if (o.cancelled || o.paymentMethod !== 'debt') return
    const key = customerKeyOf(o.customerName)
    const cur = debtMap.get(key) || { owed: 0, paid: 0 }
    cur.owed += o.total
    debtMap.set(key, cur)
  })
  ;(debtPayments || []).forEach((p) => {
    const key = customerKeyOf(p.customerName)
    const cur = debtMap.get(key) || { owed: 0, paid: 0 }
    cur.paid += p.amount
    debtMap.set(key, cur)
  })
  const wsDebts = buildStyledSheet({
    title: 'Công nợ khách hàng',
    meta,
    headers: ['Khách hàng', 'Đã mua ghi nợ (VND)', 'Đã thu (VND)', 'Còn nợ (VND)'],
    rows: Array.from(debtMap.entries()).map(([name, d]) => [name, d.owed, d.paid, d.owed - d.paid]),
    moneyCols: [1, 2, 3]
  })
  XLSX.utils.book_append_sheet(wb, wsDebts, 'Cong no')

  const wsDebtPayments = buildStyledSheet({
    title: 'Lịch sử thu nợ',
    meta,
    headers: ['Thời gian', 'Khách hàng', 'Số tiền thu (VND)', 'Hình thức', 'Ghi chú'],
    rows: (debtPayments || []).map((p) => [
      formatDateTimeForSheet(p.createdAt),
      p.customerName,
      p.amount,
      PAYMENT_LABELS[p.paymentMethod] || 'Tiền mặt',
      p.note || ''
    ]),
    moneyCols: [2]
  })
  XLSX.utils.book_append_sheet(wb, wsDebtPayments, 'Thu no')

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
  const shopName = settings?.shopName || 'BanHang POS'
  const meta = [
    ['Cửa hàng:', shopName],
    ['Kỳ báo cáo:', `${periodLabel} - ${rangeLabel}`]
  ]

  const wsOverview = buildStyledSheet({
    title: 'Tổng quan báo cáo',
    meta,
    headers: ['Chỉ tiêu', 'Giá trị'],
    rows: [
      ['Doanh thu (VND)', totals.grossRevenue],
      ['Tổng giảm giá (VND)', totals.totalDiscount || 0],
      ['Số lượng trả hàng', totals.totalReturnQty],
      ['Giá trị trả hàng (VND)', totals.totalReturnValue],
      ['Doanh thu thuần (VND)', totals.netRevenue],
      ['Giá vốn (VND)', totals.totalCost],
      ['Lãi ước tính (VND)', totals.totalProfit],
      ['Số hóa đơn', totals.orderCount],
      ['Số sản phẩm đã bán', totals.totalItemsSold],
      ['Tiền mặt (VND)', totals.paymentTotals?.cash || 0],
      ['Chuyển khoản (VND)', totals.paymentTotals?.transfer || 0],
      ['Ghi nợ - bán trong kỳ (VND)', totals.paymentTotals?.debt || 0],
      ['Thu nợ - tiền mặt (VND)', totals.debtCollectedTotals?.cash || 0],
      ['Thu nợ - chuyển khoản (VND)', totals.debtCollectedTotals?.transfer || 0]
    ],
    moneyCols: [1],
    boldLabelRows: ['Doanh thu thuần (VND)', 'Lãi ước tính (VND)']
  })
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Tong quan')

  const wsCustomers = buildStyledSheet({
    title: 'Khách mua hàng',
    meta,
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
    title: 'Hàng bán theo khách',
    meta,
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
    title: 'Sản phẩm đã bán',
    meta,
    headers: ['Tên sản phẩm', 'Số lượng đã bán', 'Doanh thu (VND)'],
    rows: soldByProduct.map((p) => [p.name, p.qty, p.revenue]),
    moneyCols: [2]
  })
  XLSX.utils.book_append_sheet(wb, wsProducts, 'San pham ban')

  const wsOrders = buildStyledSheet({
    title: 'Chi tiết hóa đơn',
    meta,
    headers: ['Mã hóa đơn', 'Thời gian', 'Khách hàng', 'Số sản phẩm', 'Giảm giá (VND)', 'Tổng tiền (VND)', 'Thanh toán'],
    rows: periodOrders.map((o) => [
      `#${o.id.slice(-6).toUpperCase()}`,
      formatDateTimeForSheet(o.createdAt),
      customerKeyOf(o.customerName),
      o.items.reduce((sum, i) => sum + i.qty, 0),
      o.discount || 0,
      o.total,
      PAYMENT_LABELS[o.paymentMethod] || 'Tiền mặt'
    ]),
    moneyCols: [4, 5]
  })
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Chi tiet don hang')

  const wsReturns = buildStyledSheet({
    title: 'Trả hàng trong kỳ',
    meta,
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
  const meta = [
    ['Cửa hàng:', shopName],
    ['Khách hàng:', customerName],
    ['Kỳ báo cáo:', `${periodLabel} - ${rangeLabel}`],
    ['Ngày lập:', new Date().toLocaleString('vi-VN')]
  ]

  const wsMain = buildStyledSheet({
    title: 'Báo cáo hàng bán theo khách',
    meta,
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
    title: 'Chi tiết hóa đơn',
    meta,
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

export function exportDebtsToExcel({ debtCustomers, settings }) {
  const wb = XLSX.utils.book_new()
  const shopName = settings?.shopName || 'BanHang POS'
  const now = new Date().toLocaleString('vi-VN')
  const meta = [
    ['Cửa hàng:', shopName],
    ['Ngày xuất:', now]
  ]

  const totalOwed = debtCustomers.reduce((sum, c) => sum + c.owed, 0)
  const totalPaid = debtCustomers.reduce((sum, c) => sum + c.paid, 0)
  const totalBalance = debtCustomers.reduce((sum, c) => sum + Math.max(0, c.balance), 0)

  const wsSummary = buildStyledSheet({
    title: 'Công nợ khách hàng',
    meta,
    headers: ['Khách hàng', 'Đã mua ghi nợ (VND)', 'Đã thu (VND)', 'Còn nợ (VND)'],
    rows: debtCustomers.map((c) => [c.name, c.owed, c.paid, Math.max(0, c.balance)]),
    totalRow: ['Tổng cộng', totalOwed, totalPaid, totalBalance],
    moneyCols: [1, 2, 3]
  })
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Cong no')

  const orderRows = []
  debtCustomers.forEach((c) => {
    c.debtOrders.forEach((o) => {
      orderRows.push([c.name, `#${o.id.slice(-6).toUpperCase()}`, formatDateTimeForSheet(o.createdAt), o.total])
    })
  })
  const wsOrders = buildStyledSheet({
    title: 'Hóa đơn ghi nợ',
    meta,
    headers: ['Khách hàng', 'Mã hóa đơn', 'Thời gian', 'Số tiền (VND)'],
    rows: orderRows,
    moneyCols: [3]
  })
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Hoa don ghi no')

  const paymentRows = []
  debtCustomers.forEach((c) => {
    c.payments.forEach((p) => {
      paymentRows.push([
        c.name,
        formatDateTimeForSheet(p.createdAt),
        p.amount,
        PAYMENT_LABELS[p.paymentMethod] || 'Tiền mặt',
        p.note || ''
      ])
    })
  })
  const wsPayments = buildStyledSheet({
    title: 'Lịch sử thu nợ',
    meta,
    headers: ['Khách hàng', 'Thời gian', 'Số tiền thu (VND)', 'Hình thức', 'Ghi chú'],
    rows: paymentRows,
    moneyCols: [2]
  })
  XLSX.utils.book_append_sheet(wb, wsPayments, 'Thu no')

  const shopSlug = slugify(shopName)
  const dateStamp = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(wb, `cong-no-${shopSlug}-${dateStamp}.xlsx`)
}
