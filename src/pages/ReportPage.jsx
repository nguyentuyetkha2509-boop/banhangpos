import React, { useMemo, useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'

function toDateInputValue(date) {
  const d = new Date(date)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const TODAY = toDateInputValue(new Date())
const LOW_STOCK_THRESHOLD = 5

export default function ReportPage() {
  const { orders, products } = useData()
  const [selectedDate, setSelectedDate] = useState(TODAY)

  const dayOrders = useMemo(
    () => orders.filter((o) => toDateInputValue(o.createdAt) === selectedDate),
    [orders, selectedDate]
  )

  const totalRevenue = dayOrders.reduce((sum, o) => sum + o.total, 0)
  const totalItemsSold = dayOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, i) => s + i.qty, 0),
    0
  )

  const soldByProduct = useMemo(() => {
    const map = new Map()
    dayOrders.forEach((o) => {
      o.items.forEach((item) => {
        const cur = map.get(item.productId) || { name: item.name, qty: 0, revenue: 0 }
        cur.qty += item.qty
        cur.revenue += item.qty * item.price
        map.set(item.productId, cur)
      })
    })
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }, [dayOrders])

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-6">
      <h1 className="text-xl font-bold text-slate-800 mb-3">
        Báo cáo {selectedDate === TODAY ? 'hôm nay' : ''}
      </h1>

      <input
        type="date"
        value={selectedDate}
        max={TODAY}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-400"
      />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-xs text-slate-400">Doanh thu</p>
          <p className="text-lg font-bold text-brand-700 mt-0.5">{formatVND(totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <p className="text-xs text-slate-400">Số hóa đơn</p>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{dayOrders.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm col-span-2">
          <p className="text-xs text-slate-400">Số sản phẩm đã bán</p>
          <p className="text-lg font-bold text-slate-800 mt-0.5">{totalItemsSold}</p>
        </div>
      </div>

      <h2 className="font-bold text-slate-800 mb-2">Sản phẩm đã bán trong ngày</h2>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        {soldByProduct.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-6">Chưa có đơn hàng nào trong ngày này</p>
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
