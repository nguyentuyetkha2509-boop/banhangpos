import React, { useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'
import { printReceipt } from '../lib/receipt'

export default function CartSheet({ open, onClose }) {
  const { cart, setCartQty, removeFromCart, checkout, settings } = useData()
  const [successOrder, setSuccessOrder] = useState(null)

  if (!open) return null

  const total = cart.reduce((sum, c) => sum + c.qty * c.price, 0)

  function handleCheckout() {
    const order = checkout()
    if (order) setSuccessOrder(order)
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
            <p className="font-bold text-lg text-slate-800">Thanh toan thanh cong</p>
            <p className="text-slate-500 text-sm">Tong tien: <span className="font-semibold text-slate-800">{formatVND(successOrder.total)}</span></p>
            <button
              onClick={() => printReceipt(successOrder, settings.shopName)}
              className="mt-2 w-full bg-brand-50 text-brand-700 rounded-xl py-3 font-medium active:scale-[0.98] transition"
            >
              🖨️ In hoa don
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
              <h2 className="font-bold text-slate-800">Gio hang</h2>
              <button onClick={onClose} className="text-slate-400 text-sm">Dong</button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 divide-y divide-slate-100">
              {cart.length === 0 && <p className="text-center text-sm text-slate-400 py-8">Gio hang trong</p>}
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
                      Xoa
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 text-sm">Tong cong</span>
                <span className="font-bold text-lg text-slate-800">{formatVND(total)}</span>
              </div>
              <button
                disabled={cart.length === 0}
                onClick={handleCheckout}
                className="w-full bg-brand-700 text-white rounded-xl py-3 font-medium disabled:opacity-40 active:scale-[0.98] transition"
              >
                Thanh toan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
