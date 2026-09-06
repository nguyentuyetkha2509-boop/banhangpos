import React, { useEffect, useState } from 'react'
import { useData } from '../store/DataContext'

export default function EditStockMovementSheet({ open, onClose, movement }) {
  const { updateStockMovement, deleteStockMovement } = useData()
  const [qty, setQty] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open && movement) {
      setQty(String(movement.qty ?? ''))
      setCostPrice(movement.costPrice ? String(movement.costPrice) : '')
      setSellPrice(movement.sellPrice ? String(movement.sellPrice) : '')
      setNote(movement.note || '')
    }
  }, [open, movement])

  if (!open || !movement) return null

  function handleSubmit(e) {
    e.preventDefault()
    const newQty = Number(qty)
    if (!newQty || newQty <= 0) return
    updateStockMovement(movement.id, { qty: newQty, costPrice, sellPrice, note })
    onClose()
  }

  function handleDelete() {
    if (confirm(`Xóa lượt nhập kho này (${movement.productName}, +${movement.qty})? Tồn kho sẽ được trừ lại tương ứng.`)) {
      deleteStockMovement(movement.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md max-h-[88vh] overflow-y-auto bg-white rounded-t-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-slate-800 mb-1">Sửa lượt nhập kho</h2>
        <p className="text-xs text-slate-400 mb-3">{movement.productName}</p>

        <label className="block text-xs font-medium text-slate-500 mb-1">Số lượng đã nhập</label>
        <input
          type="number"
          min="1"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Giá nhập (VND)</label>
            <input
              type="number"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Giá bán từ lô này (VND)</label>
            <input
              type="number"
              min="0"
              value={sellPrice}
              onChange={(e) => setSellPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>
        <p className="text-[14px] text-slate-400 -mt-2 mb-3">
          Nếu đây là lượt nhập gần nhất của sản phẩm, giá nhập/giá bán sửa ở đây sẽ áp dụng lại cho tồn kho hiện tại.
        </p>

        <label className="block text-xs font-medium text-slate-500 mb-1">Ghi chú (tùy chọn)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-400"
        />

        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl py-3 font-medium text-slate-600 bg-slate-100"
          >
            Hủy
          </button>
          <button type="submit" className="flex-1 rounded-xl py-3 font-medium text-white bg-brand-700">
            Lưu
          </button>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          className="w-full rounded-xl py-2.5 font-medium text-red-500 bg-red-50"
        >
          Xóa lượt nhập này
        </button>
      </form>
    </div>
  )
}
