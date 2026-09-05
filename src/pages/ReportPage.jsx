import React, { useMemo, useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'
import { PERIODS, getRange, shiftRef, formatRangeLabel, toDateInputValue } from '../lib/reportRange'

const LOW_STOCK_THRESHOLD = 5

export default function ReportPage() {
  const { orders, products, settings } = useData()
  const [period, setPeriod] = useState('day')
  const [refDate, setRefDate] = useState(() => new Date())
  const [exporting, setExporting] = useState(false)

  const [rangeStart, rangeEnd] = useMemo(() => getRange(period, refDate), [period, refDate])
  const rangeLabel = useMemo(() => formatRangeLabel(period, refDate), [period, refDate])
  const periodMeta = PERIODS.find((p) => p.key === period)

  const periodOrders = useMemo(
    () =>
      orders.filter((o) => {
        const t = new Date(o.createdAt).getTime()
        return t >= rangeStart.getTime() && t <= rangeEnd.getTime()
      }),
    [orders, rangeStart, rangeEnd]
  )

  const totalRevenue = periodOrders.reduce((sum, o) => sum + o.total, 0)
  const totalItemsSold = periodOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0),
    0
  )
  const totalCost = periodOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.qty * (i.costPrice || 0), 0),
    0
  )
  const totalProfit = totalRevenue - totalCost

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

  const customerStats = useMemo(() => {
    const map = new Map()
    periodOrders.forEach((o) => {
      const key = (o.customerName || '').trim() || 'Khách lẻ'
      const qty = o.items.reduce((s, i) => s + i.qty, 0)
      const cur = map.get(key) || { name: key, qty: 0, revenue: 0, orderCount: 0 }
      cur.qty += qty
      cur.revenue += o.total
      cur.orderCount += 1
      map.set(key, cur)
    })
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty)
  }, [periodOrders])

  const customerProductMap = useMemo(() => {
    const map = new Map()
    periodOrders.forEach((o) => {
      const key = (o.customerName || '').trim() || 'Khách lẻ'
      const prodMap = map.get(key) || new Map()
      o.items.forEach((item) => {
        const cur = prodMap.get(item.productId) || { name: item.name, qty: 0, revenue: 0 }
        cur.qty += item.qty
        cur.revenue += item.qty * item.price
        prodMap.set(item.productId, cur)
      })
      map.set(key, prodMap)
    })
    return map
  }, [periodOrders])

  const customerProductRows = useMemo(() => {
    const rows = []
    customerStats.forEach((c) => {
      const prodMap = customerProductMap.get(c.name)
      const items = prodMap ? Array.from(prodMap.values()).sort((a, b) => b.revenue - a.revenue) : []
      items.forEach((item) => rows.push({ customerName: c.name, ...item }))
    })
    return rows
  }, [customerStats, customerProductMap])

  const [expandedCustomer, setExpandedCustomer] = useState(null)

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
        soldByProduct,
        customerStats,
        customerProductRows,
        totals: { totalRevenue, totalCost, totalProfit, totalItemsSold, orderCount: periodOrders.length },
        settings
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-6">
      <h1 className="text-xl font-bold text-slate-800 mb-3">Báo cáo</h1>

      <div className="grid grid-cols-4 gap-1.5 mb-3">
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
          <p className="text-xs text-slate-400">Doanh thu</p>
          <p className="text-lg font-bold text-brand-700 mt-0.5">{formatVND(totalRevenue)}</p>
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
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5 mb-4">
        Lãi ước tính tính theo giá nhập gần nhất của mỗi sản phẩm tại thời điểm bán.
      </p>

      <button
        onClick={handleExportReport}
        disabled={exporting || periodOrders.length === 0}
        className="w-full bg-brand-50 text-brand-700 text-sm font-medium rounded-lg py-2.5 mb-6 disabled:opacity-40 active:scale-[0.98] transition"
      >
        {exporting ? 'Đang xuất...' : `📊 Xuất báo cáo ${periodMeta.label.toLowerCase()} này ra Excel`}
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
          const products = customerProductMap.get(c.name)
          const productList = products ? Array.from(products.values()).sort((a, b) => b.revenue - a.revenue) : []
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
                    {c.orderCount} hóa đơn · {formatVND(c.revenue)}
                  </p>
                </div>
                <span className="font-semibold text-sm text-slate-800 shrink-0">{c.qty} sp</span>
              </button>
              {isExpanded && (
                <div className="bg-slate-50 px-3 py-2 divide-y divide-slate-100">
                  {productList.map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-slate-600 truncate mr-2">{item.name} x{item.qty}</span>
                      <span className="text-slate-800 font-medium shrink-0">{formatVND(item.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

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
