import React, { useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'
import { printReceipt } from '../lib/receipt'

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

export default function OrdersPage() {
  const { orders, settings } = useData()
  const [openId, setOpenId] = useState(null)

  const todayTotal = orders
    .filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total, 0)

  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Lịch sử hóa đơn</h1>
      <p className="text-sm text-slate-500 mb-3">
        Hôm nay: <span className="font-semibold text-brand-700">{formatVND(todayTotal)}</span> · {orders.length} hóa đơn
      </p>

      <div className="space-y-2">
        {orders.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">Chưa có hóa đơn nào</p>
        )}
        {orders.map((o) => {
          const isOpen = openId === o.id
          const itemCount = o.items.reduce((s, i) => s + i.qty, 0)
          return (
            <div key={o.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setOpenId(isOpen ? null : o.id)}
                className="w-full flex items-center justify-between px-3 py-3"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800">#{o.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-slate-400">{formatTime(o.createdAt)} · {itemCount} sản phẩm</p>
                </div>
                <span className="font-bold text-brand-700">{formatVND(o.total)}</span>
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 px-3 py-2 divide-y divide-slate-50">
                  {o.items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-slate-600 truncate mr-2">{item.name} x{item.qty}</span>
                      <span className="text-slate-800 font-medium shrink-0">{formatVND(item.price * item.qty)}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <button
                      onClick={() => printReceipt(o, settings)}
                      className="w-full bg-brand-50 text-brand-700 text-sm font-medium rounded-lg py-2 active:scale-[0.98] transition"
                    >
                      🖨️ In lại hóa đơn
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
