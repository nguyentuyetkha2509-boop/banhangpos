import React, { useMemo, useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'
import { PERIODS, getRange, shiftRef, formatRangeLabel, toDateInputValue } from '../lib/reportRange'
import { ExportIcon } from '../components/Icons'

const LOW_STOCK_THRESHOLD = 5

function customerKeyOf(name) {
  return (name || '').trim() || 'Khách lẻ'
}

export default function ReportPage() {
  const { orders, returns, products, debtPayments, settings } = useData()
  const [period, setPeriod] = useState('day')
  const [refDate, setRefDate] = useState(() => new Date())
  const [exporting, setExporting] = useState(false)
  const [exportingCustomer, setExportingCustomer] = useState(null)
  const [expandedCustomer, setExpandedCustomer] = useState(null)

  const [rangeStart, rangeEnd] = useMemo(() => getRange(period, refDate), [period, refDate])
  const rangeLabel = useMemo(() => formatRangeLabel(period, refDate), [period, refDate])
  const periodMeta = PERIODS.find((p) => p.key === period)

  const inRange = (iso) => {
    const t = new Date(iso).getTime()
    return t >= rangeStart.getTime() && t <= rangeEnd.getTime()
  }

  const activeOrders = useMemo(() => orders.filter((o) => !o.cancelled), [orders])
  const periodOrders = useMemo(() => activeOrders.filter((o) => inRange(o.createdAt)), [activeOrders, rangeStart, rangeEnd])
  const periodReturns = useMemo(() => returns.filter((r) => inRange(r.createdAt)), [returns, rangeStart, rangeEnd])
  const periodDebtPayments = useMemo(
    () => debtPayments.filter((p) => inRange(p.createdAt)),
    [debtPayments, rangeStart, rangeEnd]
  )

  function returnCostPriceOf(r) {
    // Cac luot tra hang tao truoc khi tinh nang nay co khong luu san gia von -
    // dung gia nhap hien tai cua san pham de uoc luong thay vi coi nhu bang 0
    if (r.costPrice) return r.costPrice
    return products.find((p) => p.id === r.productId)?.costPrice || 0
  }

  const grossRevenue = periodOrders.reduce((sum, o) => sum + o.total, 0)
  const totalItemsSold = periodOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0),
    0
  )
  const grossCost = periodOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.qty * (i.costPrice || 0), 0),
    0
  )
  const totalReturnQty = periodReturns.reduce((sum, r) => sum + r.qty, 0)
  const totalReturnValue = periodReturns.reduce((sum, r) => sum + r.refundAmount, 0)
  const totalReturnCost = periodReturns.reduce((sum, r) => sum + r.qty * returnCostPriceOf(r), 0)
  const netRevenue = grossRevenue - totalReturnValue
  const totalCost = grossCost - totalReturnCost
  const totalProfit = netRevenue - totalCost
  const totalDiscount = periodOrders.reduce((sum, o) => sum + (o.discount || 0), 0)

  const paymentTotals = useMemo(() => {
    const map = { cash: 0, transfer: 0, debt: 0 }
    periodOrders.forEach((o) => {
      const key = o.paymentMethod || 'cash'
      map[key] = (map[key] || 0) + o.total
    })
    return map
  }, [periodOrders])

  const debtCollectedTotals = useMemo(() => {
    const map = { cash: 0, transfer: 0 }
    periodDebtPayments.forEach((p) => {
      const key = p.paymentMethod || 'cash'
      map[key] = (map[key] || 0) + p.amount
    })
    return map
  }, [periodDebtPayments])

  const soldByProduct = useMemo(() => {
    const map = new Map()
    periodOrders.forEach((o) => {
      o.items.forEach((item) => {
        const cur = map.get(item.productId) || { name: item.name, qty: 0, revenue: 0 }
        cur.qty += item.qty
        cur.revenue += item.qty * item.price
        map.set(item.productId, cur)
      })
    })
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }, [periodOrders])

  const returnByCustomer = useMemo(() => {
    const map = new Map()
    periodReturns.forEach((r) => {
      const key = customerKeyOf(r.customerName)
      const cur = map.get(key) || { qty: 0, value: 0 }
      cur.qty += r.qty
      cur.value += r.refundAmount
      map.set(key, cur)
    })
    return map
  }, [periodReturns])

  const returnProductByCustomer = useMemo(() => {
    const map = new Map()
    periodReturns.forEach((r) => {
      const key = customerKeyOf(r.customerName)
      const prodMap = map.get(key) || new Map()
      const cur = prodMap.get(r.productId) || { name: r.productName, qty: 0, value: 0 }
      cur.qty += r.qty
      cur.value += r.refundAmount
      prodMap.set(r.productId, cur)
      map.set(key, prodMap)
    })
    return map
  }, [periodReturns])

  const customerStats = useMemo(() => {
    const map = new Map()
    periodOrders.forEach((o) => {
      const key = customerKeyOf(o.customerName)
      const qty = o.items.reduce((s, i) => s + i.qty, 0)
      const cur = map.get(key) || { name: key, qty: 0, revenue: 0, orderCount: 0 }
      cur.qty += qty
      cur.revenue += o.total
      cur.orderCount += 1
      map.set(key, cur)
    })
    returnByCustomer.forEach((_, key) => {
      if (!map.has(key)) map.set(key, { name: key, qty: 0, revenue: 0, orderCount: 0 })
    })
    return Array.from(map.values())
      .map((c) => {
        const ret = returnByCustomer.get(c.name) || { qty: 0, value: 0 }
        return {
          ...c,
          returnQty: ret.qty,
          returnValue: ret.value,
          netQty: c.qty - ret.qty,
          netRevenue: c.revenue - ret.value
        }
      })
      .sort((a, b) => b.netRevenue - a.netRevenue)
  }, [periodOrders, returnByCustomer])

  const customerProductMap = useMemo(() => {
    const map = new Map()
    periodOrders.forEach((o) => {
      const key = customerKeyOf(o.customerName)
      const prodMap = map.get(key) || new Map()
      o.items.forEach((item) => {
        const cur = prodMap.get(item.productId) || { name: item.name, qty: 0, revenue: 0 }
        cur.qty += item.qty
        cur.revenue += item.qty * item.price
        prodMap.set(item.productId, cur)
      })
      map.set(key, prodMap)
    })
    returnProductByCustomer.forEach((retProdMap, key) => {
      const prodMap = map.get(key) || new Map()
      retProdMap.forEach((ret, productId) => {
        const cur = prodMap.get(productId) || { name: ret.name, qty: 0, revenue: 0 }
        prodMap.set(productId, cur)
      })
      map.set(key, prodMap)
    })
    return map
  }, [periodOrders, returnProductByCustomer])

  const customerProductRows = useMemo(() => {
    const rows = []
    customerStats.forEach((c) => {
      const prodMap = customerProductMap.get(c.name)
      if (!prodMap) return
      const retProdMap = returnProductByCustomer.get(c.name)
      const items = Array.from(prodMap.entries())
        .map(([productId, item]) => {
          const ret = retProdMap?.get(productId) || { qty: 0, value: 0 }
          return {
            name: item.name,
            qty: item.qty,
            revenue: item.revenue,
            returnQty: ret.qty,
            returnValue: ret.value,
            netRevenue: item.revenue - ret.value
          }
        })
        .sort((a, b) => b.netRevenue - a.netRevenue)
      items.forEach((item) => rows.push({ customerName: c.name, ...item }))
    })
    return rows
  }, [customerStats, customerProductMap, returnProductByCustomer])

  const canGoNext = useMemo(() => {
    const nextRefDate = shiftRef(period, refDate, 1)
    const [nextStart] = getRange(period, nextRefDate)
    return nextStart.getTime() <= Date.now()
  }, [period, refDate])

  function goPrev() {
    setRefDate((d) => shiftRef(period, d, -1))
  }

  function goNext() {
    setRefDate((d) => shiftRef(period, d, 1))
  }

  async function handleExportReport() {
    setExporting(true)
    try {
      const { exportReportToExcel } = await import('../lib/exportExcel')
      exportReportToExcel({
        periodLabel: periodMeta.label,
        rangeLabel,
        periodOrders,
        periodReturns,
        soldByProduct,
        customerStats,
        customerProductRows,
        totals: {
          grossRevenue,
          totalDiscount,
          totalReturnQty,
          totalReturnValue,
          netRevenue,
          totalCost,
          totalProfit,
          totalItemsSold,
          orderCount: periodOrders.length,
          paymentTotals,
          debtCollectedTotals
        },
        settings
      })
    } finally {
      setExporting(false)
    }
  }

  async function handleExportCustomer(c) {
    setExportingCustomer(c.name)
    try {
      const { exportCustomerToExcel } = await import('../lib/exportExcel')
      const customerOrders = periodOrders.filter((o) => customerKeyOf(o.customerName) === c.name)
      const productRows = customerProductRows.filter((r) => r.customerName === c.name)
      exportCustomerToExcel({
        customerName: c.name,
        periodLabel: periodMeta.label,
        rangeLabel,
        customerStat: c,
        productRows,
        customerOrders,
        settings
      })
    } finally {
      setExportingCustomer(null)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-6">
      <h1 className="text-xl font-bold text-slate-800 mb-3">Báo cáo</h1>

      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-lg py-2 text-sm font-medium transition ${
              period === p.key ? 'bg-brand-700 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={goPrev}
          aria-label="Kỳ trước"
          className="shrink-0 h-9 w-9 rounded-lg bg-white border border-slate-200 text-slate-500 font-bold"
        >
          ‹
        </button>
        <div className="flex-1 text-center bg-white rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-700 truncate px-2">
          {period === 'day' ? (
            <input
              type="date"
              value={toDateInputValue(refDate)}
              max={toDateInputValue(new Date())}
              onChange={(e) => setRefDate(new Date(e.target.value))}
              className="w-full text-center focus:outline-none"
            />
          ) : (
            rangeLabel
          )}
        </div>
        <button
          onClick={goNext}
          disabled={!canGoNext}
          aria-label="Kỳ sau"
          className="shrink-0 h-9 w-9 rounded-lg bg-white border border-slate-200 text-slate-500 font-bold disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-xs text-slate-400">Doanh thu thuần</p>
          <p className="text-lg font-bold text-brand-700 mt-0.5">{formatVND(netRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-xs text-slate-400">Số hóa đơn</p>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{periodOrders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-xs text-slate-400">Số sản phẩm đã bán</p>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{totalItemsSold}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-xs text-slate-400">Lãi ước tính</p>
          <p className="text-lg font-bold text-emerald-600 mt-0.5">{formatVND(totalProfit)}</p>
        </div>
        {totalReturnQty > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm col-span-2">
            <p className="text-xs text-slate-400">Trả hàng</p>
            <p className="text-lg font-bold text-red-500 mt-0.5">
              −{totalReturnQty} sp · −{formatVND(totalReturnValue)}
            </p>
          </div>
        )}
        {totalDiscount > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm col-span-2">
            <p className="text-xs text-slate-400">Tổng giảm giá</p>
            <p className="text-lg font-bold text-red-500 mt-0.5">−{formatVND(totalDiscount)}</p>
          </div>
        )}
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5 mb-4">
        Doanh thu thuần đã trừ giá trị trả hàng. Lãi ước tính tính theo giá nhập gần nhất của mỗi sản phẩm tại thời
        điểm bán. Hóa đơn đã hủy không được tính vào báo cáo.
      </p>

      {periodOrders.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500">Theo hình thức thanh toán</p>
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-sm">
            <span className="text-slate-600">Tiền mặt</span>
            <span className="font-medium text-slate-800">{formatVND(paymentTotals.cash)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-sm border-t border-slate-50">
            <span className="text-slate-600">Chuyển khoản</span>
            <span className="font-medium text-slate-800">{formatVND(paymentTotals.transfer)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-sm border-t border-slate-50">
            <span className="text-slate-600">Ghi nợ (bán trong kỳ)</span>
            <span className="font-medium text-amber-600">{formatVND(paymentTotals.debt)}</span>
          </div>
        </div>
      )}

      {periodDebtPayments.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-xs font-semibold text-slate-500">Thu nợ trong kỳ</p>
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-sm">
            <span className="text-slate-600">Tiền mặt</span>
            <span className="font-medium text-emerald-600">+{formatVND(debtCollectedTotals.cash)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-sm border-t border-slate-50">
            <span className="text-slate-600">Chuyển khoản</span>
            <span className="font-medium text-emerald-600">+{formatVND(debtCollectedTotals.transfer)}</span>
          </div>
          <p className="px-3 pb-2 text-[11px] text-slate-400">
            Tiền thu nợ không tính vào doanh thu (đã tính khi bán ghi nợ), nhưng vẫn là tiền mặt/chuyển khoản thực nhận trong kỳ.
          </p>
        </div>
      )}

      <button
        onClick={handleExportReport}
        disabled={exporting || periodOrders.length === 0}
        className="w-full flex items-center justify-center gap-1.5 bg-brand-50 text-brand-700 text-sm font-medium rounded-lg py-2.5 mb-6 disabled:opacity-40 active:scale-[0.98] transition"
      >
        {exporting ? null : <ExportIcon className="h-5 w-5" />}
        {exporting ? 'Đang xuất...' : `Xuất báo cáo ${periodMeta.label.toLowerCase()} này ra Excel`}
      </button>

      <h2 className="font-bold text-slate-800 mb-2">Khách mua hàng</h2>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        {customerStats.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-6">Chưa có khách mua trong kỳ này</p>
        )}
        {customerStats.map((c, idx) => {
          const isTop = idx === 0 && customerStats.length > 1
          const isBottom = idx === customerStats.length - 1 && customerStats.length > 1
          const isExpanded = expandedCustomer === c.name
          const prodMap = customerProductMap.get(c.name)
          const productList = prodMap
            ? Array.from(prodMap.entries())
                .map(([productId, item]) => {
                  const ret = returnProductByCustomer.get(c.name)?.get(productId) || { qty: 0, value: 0 }
                  return { ...item, returnQty: ret.qty, returnValue: ret.value, netRevenue: item.revenue - ret.value }
                })
                .sort((a, b) => b.netRevenue - a.netRevenue)
            : []
          return (
            <div key={c.name} className={idx > 0 ? 'border-t border-slate-100' : ''}>
              <button
                onClick={() => setExpandedCustomer(isExpanded ? null : c.name)}
                className="w-full flex items-center justify-between px-3 py-2.5"
              >
                <div className="min-w-0 text-left">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {c.name}
                    {isTop && (
                      <span className="ml-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-1.5 py-0.5">
                        Mua nhiều nhất
                      </span>
                    )}
                    {isBottom && (
                      <span className="ml-1.5 text-[10px] font-semibold text-amber-600 bg-amber-50 rounded-full px-1.5 py-0.5">
                        Mua ít nhất
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">
                    {c.orderCount} hóa đơn · {c.qty} sp
                    {c.returnQty > 0 ? ` · trả ${c.returnQty}` : ''}
                  </p>
                </div>
                <span className="font-semibold text-sm text-slate-800 shrink-0">{formatVND(c.netRevenue)}</span>
              </button>
              {isExpanded && (
                <div className="bg-slate-50 px-3 py-2">
                  <div className="divide-y divide-slate-100">
                    {productList.map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                        <span className="text-slate-600 truncate mr-2">
                          {item.name} x{item.qty}
                          {item.returnQty > 0 ? ` (trả ${item.returnQty})` : ''}
                        </span>
                        {item.returnValue > 0 ? (
                          <span className="text-right shrink-0">
                            <span className="text-slate-800 font-medium">{formatVND(item.netRevenue)}</span>
                            <span className="block text-[11px] text-red-500">
                              {formatVND(item.revenue)} − {formatVND(item.returnValue)}
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-800 font-medium shrink-0">{formatVND(item.revenue)}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleExportCustomer(c)}
                    disabled={exportingCustomer === c.name}
                    className="w-full mt-2 flex items-center justify-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded-lg py-2 disabled:opacity-40 active:scale-[0.98] transition"
                  >
                    {exportingCustomer === c.name ? null : <ExportIcon className="h-4 w-4" />}
                    {exportingCustomer === c.name ? 'Đang xuất...' : `Xuất file riêng cho ${c.name}`}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {periodReturns.length > 0 && (
        <>
          <h2 className="font-bold text-slate-800 mb-2">Trả hàng trong kỳ</h2>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
            {periodReturns.map((r, idx) => (
              <div
                key={r.id}
                className={`flex items-center justify-between px-3 py-2.5 ${idx > 0 ? 'border-t border-slate-100' : ''}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{r.productName}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(r.createdAt).toLocaleString('vi-VN')} · {r.customerName}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-sm text-red-500">−{r.qty}</p>
                  <p className="text-xs text-slate-400">{formatVND(r.refundAmount)}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="font-bold text-slate-800 mb-2">Sản phẩm đã bán trong kỳ</h2>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        {soldByProduct.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-6">Chưa có đơn hàng nào trong kỳ này</p>
        )}
        {soldByProduct.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center justify-between px-3 py-2.5 ${idx > 0 ? 'border-t border-slate-100' : ''}`}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
              <p className="text-xs text-slate-400">Đã bán: {item.qty}</p>
            </div>
            <span className="font-semibold text-sm text-slate-800 shrink-0">{formatVND(item.revenue)}</span>
          </div>
        ))}
      </div>

      <h2 className="font-bold text-slate-800 mb-2">Tồn kho hiện tại</h2>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {products.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-6">Chưa có sản phẩm nào</p>
        )}
        {products.map((p, idx) => {
          const low = p.stock <= LOW_STOCK_THRESHOLD
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between px-3 py-2.5 ${idx > 0 ? 'border-t border-slate-100' : ''}`}
            >
              <p className="text-sm text-slate-700 truncate">{p.name}</p>
              <span className={`text-sm font-semibold shrink-0 ${low ? 'text-red-500' : 'text-slate-800'}`}>
                Còn {p.stock}
                {low ? ' · Sắp hết' : ''}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
