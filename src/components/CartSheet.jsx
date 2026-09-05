import React, { useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'

export default function CartSheet({ open, onClose }) {
  const { cart, setCartQty, removeFromCart, checkout, requestPrint } = useData()
  const [successOrder, setSuccessOrder] = useState(null)
  const [customerName, setCustomerName] = useState('')

  if (!open) return null

  const total = cart.reduce((sum, c) => sum + c.qty * c.price, 0)

  function handleCheckout() {
    const order = checkout(customerName)
    if (order) {
      setSuccessOrder(order)
      setCustomerName('')
    }
  }

  function handleDone() {
    setSuccessOrder(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {successOrder ? (
          <div className="p-6 flex flex-col items-center text-center gap-3">
            <div className="h-14 w-14 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl">✓</div>
            <p className="font-bold text-lg text-slate-800">Thanh toán thành công</p>
            <p className="text-slate-500 text-sm">Tổng tiền: <span className="font-semibold text-slate-800">{formatVND(successOrder.total)}</span></p>
            <button
              onClick={() => requestPrint(successOrder)}
              className="mt-2 w-full bg-brand-50 text-brand-700 rounded-xl py-3 font-medium active:scale-[0.98] transition"
            >
              🖨️ In hóa đơn
            </button>
            <button
              onClick={handleDone}
              className="w-full bg-brand-700 text-white rounded-xl py-3 font-medium active:scale-[0.98] transition"
            >
              Xong
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Giỏ hàng</h2>
              <button onClick={onClose} className="text-slate-400 text-sm">Đóng</button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 divide-y divide-slate-100">
              {cart.length === 0 && <p className="text-center text-sm text-slate-400 py-8">Giỏ hàng trống</p>}
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between py-3 gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">{formatVND(item.price)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setCartQty(item.productId, item.qty - 1)}
                      className="h-7 w-7 rounded-full bg-slate-100 text-slate-600 font-bold"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm font-medium">{item.qty}</span>
                    <button
                      onClick={() => setCartQty(item.productId, item.qty + 1)}
                      className="h-7 w-7 rounded-full bg-slate-100 text-slate-600 font-bold"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-400 text-xs ml-1"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100">
              <label className="block text-xs font-medium text-slate-500 mb-1">Tên khách hàng (tùy chọn)</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="VD: Chị Lan"
              />
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 text-sm">Tổng cộng</span>
                <span className="font-bold text-lg text-slate-800">{formatVND(total)}</span>
              </div>
              <button
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="w-full bg-brand-700 text-white rounded-xl py-3 font-medium disabled:opacity-40 active:scale-[0.98] transition"
              >
                Thanh toán
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
