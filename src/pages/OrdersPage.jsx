import React, { useMemo, useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'
import ReturnSheet from '../components/ReturnSheet'

const PAYMENT_LABELS = { cash: 'Tiền mặt', transfer: 'Chuyển khoản', debt: 'Ghi nợ' }

function formatTime(iso) {
  const d = new Date(iso)
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

export default function OrdersPage() {
  const { orders, returns, requestPrint, cancelOrder } = useData()
  const [openId, setOpenId] = useState(null)
  const [returnOrder, setReturnOrder] = useState(null)
  const [query, setQuery] = useState('')

  const todayTotal = orders
    .filter((o) => !o.cancelled && new Date(o.createdAt).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total, 0)

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orders
    return orders.filter(
      (o) =>
        o.id.slice(-6).toLowerCase().includes(q) ||
        (o.customerName || '').toLowerCase().includes(q)
    )
  }, [orders, query])

  function handleCancel(order) {
    if (confirm(`Hủy hóa đơn #${order.id.slice(-6).toUpperCase()}? Sản phẩm sẽ được cộng lại vào tồn kho.`)) {
      cancelOrder(order.id)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Lịch sử hóa đơn</h1>
      <p className="text-sm text-slate-500 mb-3">
        Hôm nay: <span className="font-semibold text-brand-700">{formatVND(todayTotal)}</span> · {orders.length} hóa đơn
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm theo tên khách hoặc mã hóa đơn..."
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
      />

      <div className="space-y-2">
        {filteredOrders.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">
            {orders.length === 0 ? 'Chưa có hóa đơn nào' : 'Không tìm thấy hóa đơn nào'}
          </p>
        )}
        {filteredOrders.map((o) => {
          const isOpen = openId === o.id
          const itemCount = o.items.reduce((s, i) => s + i.qty, 0)
          const hasReturns = returns.some((r) => r.orderId === o.id)
          return (
            <div
              key={o.id}
              className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                o.cancelled ? 'border-slate-200 opacity-60' : 'border-slate-200'
              }`}
            >
              <button
                onClick={() => setOpenId(isOpen ? null : o.id)}
                className="w-full flex items-center justify-between px-3 py-3"
              >
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-800">
                    #{o.id.slice(-6).toUpperCase()}
                    {o.cancelled && (
                      <span className="ml-1.5 text-[10px] font-semibold text-slate-500 bg-slate-100 rounded-full px-1.5 py-0.5">
                        Đã hủy
                      </span>
                    )}
                    {!o.cancelled && o.paymentMethod && o.paymentMethod !== 'cash' && (
                      <span
                        className={`ml-1.5 text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${
                          o.paymentMethod === 'debt' ? 'text-amber-600 bg-amber-50' : 'text-sky-600 bg-sky-50'
                        }`}
                      >
                        {PAYMENT_LABELS[o.paymentMethod]}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatTime(o.createdAt)} · {itemCount} sản phẩm
                    {o.customerName ? ` · ${o.customerName}` : ''}
                  </p>
                </div>
                <span className={`font-bold ${o.cancelled ? 'text-slate-400 line-through' : 'text-brand-700'}`}>
                  {formatVND(o.total)}
                </span>
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 px-3 py-2 divide-y divide-slate-50">
                  {o.items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-slate-600 truncate mr-2">{item.name} x{item.qty}</span>
                      <span className="text-slate-800 font-medium shrink-0">{formatVND(item.price * item.qty)}</span>
                    </div>
                  ))}
                  {o.discount > 0 && (
                    <div className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-slate-500">Giảm giá</span>
                      <span className="text-red-500 font-medium shrink-0">−{formatVND(o.discount)}</span>
                    </div>
                  )}
                  {!o.cancelled && (
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => requestPrint(o)}
                        className="flex-1 bg-brand-50 text-brand-700 text-sm font-medium rounded-lg py-2 active:scale-[0.98] transition"
                      >
                        🖨️ In lại hóa đơn
                      </button>
                      <button
                        onClick={() => setReturnOrder(o)}
                        className="flex-1 bg-red-50 text-red-600 text-sm font-medium rounded-lg py-2 active:scale-[0.98] transition"
                      >
                        ↩️ Trả hàng
                      </button>
                    </div>
                  )}
                  {!o.cancelled && !hasReturns && (
                    <div className="pt-2">
                      <button
                        onClick={() => handleCancel(o)}
                        className="w-full text-slate-400 text-xs font-medium py-1.5 active:scale-[0.98] transition"
                      >
                        Hủy hóa đơn
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ReturnSheet open={Boolean(returnOrder)} onClose={() => setReturnOrder(null)} order={returnOrder} />
    </div>
  )
}
