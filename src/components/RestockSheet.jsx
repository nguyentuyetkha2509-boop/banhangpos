import React, { useEffect, useState } from 'react'
import { useData } from '../store/DataContext'

export default function RestockSheet({ open, onClose, product }) {
  const { products, restockProduct } = useData()
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setProductId(product?.id || products[0]?.id || '')
      setQty('')
      setNote('')
    }
  }, [open, product, products])

  if (!open) return null

  const selected = products.find((p) => p.id === productId)

  function handleSubmit(e) {
    e.preventDefault()
    const addQty = Number(qty)
    if (!productId || !addQty || addQty <= 0) return
    restockProduct(productId, addQty, note)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-t-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-slate-800 mb-3">Nhập kho</h2>

        <label className="block text-xs font-medium text-slate-500 mb-1">Sản phẩm</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (đang có {p.stock})
            </option>
          ))}
        </select>

        <label className="block text-xs font-medium text-slate-500 mb-1">Số lượng nhập thêm</label>
        <input
          autoFocus
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="VD: 50"
        />

        {selected && qty && Number(qty) > 0 && (
          <p className="text-xs text-slate-500 mb-3">
            Tồn sau khi nhập: <span className="font-semibold text-brand-700">{selected.stock + Number(qty)}</span>
          </p>
        )}

        <label className="block text-xs font-medium text-slate-500 mb-1">Ghi chú (tùy chọn)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="VD: Nhập từ nhà cung cấp A"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl py-3 font-medium text-slate-600 bg-slate-100"
          >
            Hủy
          </button>
          <button type="submit" className="flex-1 rounded-xl py-3 font-medium text-white bg-brand-700">
            Nhập kho
          </button>
        </div>
      </form>
    </div>
  )
}
