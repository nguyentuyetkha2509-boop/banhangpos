import React, { useMemo, useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'
import { PrintIcon } from './Icons'

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Tiền mặt' },
  { key: 'transfer', label: 'Chuyển khoản' },
  { key: 'debt', label: 'Ghi nợ' }
]

export default function CartSheet({ open, onClose }) {
  const { cart, orders, returns, setCartQty, removeFromCart, checkout, requestPrint } = useData()
  const [successOrder, setSuccessOrder] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [discount, setDiscount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  const knownCustomers = useMemo(() => {
    const set = new Set()
    orders.forEach((o) => { if (o.customerName) set.add(o.customerName) })
    returns.forEach((r) => { if (r.customerName && r.customerName !== 'Khách lẻ') set.add(r.customerName) })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'))
  }, [orders, returns])

  const filteredCustomers = useMemo(() => {
    const q = customerName.trim().toLowerCase()
    if (!q) return knownCustomers
    return knownCustomers.filter((name) => name.toLowerCase().includes(q))
  }, [knownCustomers, customerName])

  if (!open) return null

  const subtotal = cart.reduce((sum, c) => sum + c.qty * c.price, 0)
  const discountValue = Math.min(Math.max(0, Number(discount) || 0), subtotal)
  const total = subtotal - discountValue
  const needsCustomerForDebt = paymentMethod === 'debt' && !customerName.trim()

  function handleCheckout() {
    if (needsCustomerForDebt) return
    const order = checkout(customerName, { discount: discountValue, paymentMethod })
    if (order) {
      setSuccessOrder(order)
      setCustomerName('')
      setDiscount('')
      setPaymentMethod('cash')
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
              className="mt-2 w-full flex items-center justify-center gap-1.5 bg-brand-50 text-brand-700 rounded-xl py-3 font-medium active:scale-[0.98] transition"
            >
              <PrintIcon className="h-5 w-5" />
              In hóa đơn
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
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1 min-w-0">
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setShowSuggestions(false)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    placeholder="VD: Chị Lan"
                  />
                  {showSuggestions && filteredCustomers.length > 0 && (
                    <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredCustomers.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setCustomerName(name)
                            setShowSuggestions(false)
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-700 active:bg-slate-50"
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setCustomerName('')}
                  className="shrink-0 rounded-lg bg-slate-100 text-slate-500 px-3 text-sm font-medium"
                >
                  Xóa
                </button>
              </div>

              <label className="block text-xs font-medium text-slate-500 mb-1">Hình thức thanh toán</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPaymentMethod(m.key)}
                    className={`rounded-lg py-2 text-xs font-medium transition ${
                      paymentMethod === m.key
                        ? 'bg-brand-700 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {needsCustomerForDebt && (
                <p className="text-xs text-red-500 -mt-2 mb-3">Cần nhập tên khách hàng để ghi nợ</p>
              )}

              <label className="block text-xs font-medium text-slate-500 mb-1">Giảm giá (VND, tùy chọn)</label>
              <input
                type="number"
                min="0"
                max={subtotal}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />

              {discountValue > 0 && (
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="text-slate-400">Tạm tính</span>
                  <span className="text-slate-500">{formatVND(subtotal)}</span>
                </div>
              )}
              {discountValue > 0 && (
                <div className="flex items-center justify-between mb-1 text-sm">
                  <span className="text-slate-400">Giảm giá</span>
                  <span className="text-red-500">−{formatVND(discountValue)}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 text-sm">Tổng cộng</span>
                <span className="font-bold text-lg text-slate-800">{formatVND(total)}</span>
              </div>
              <button
                disabled={cart.length === 0 || needsCustomerForDebt}
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
