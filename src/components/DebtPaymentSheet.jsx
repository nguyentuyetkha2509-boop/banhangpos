import React, { useEffect, useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'

export default function DebtPaymentSheet({ open, onClose, customerName, balance }) {
  const { addDebtPayment } = useData()
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setAmount('')
      setNote('')
    }
  }, [open])

  if (!open) return null

  function handleSubmit(e) {
    e.preventDefault()
    if (!amount || Number(amount) <= 0) return
    addDebtPayment(customerName, amount, note)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-t-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-slate-800 mb-1">Thu nợ</h2>
        <p className="text-sm text-slate-500 mb-3">
          {customerName} · Đang nợ: <span className="font-semibold text-amber-600">{formatVND(balance)}</span>
        </p>

        <label className="block text-xs font-medium text-slate-500 mb-1">Số tiền thu (VND)</label>
        <div className="flex gap-2 mb-3">
          <input
            autoFocus
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="0"
          />
          <button
            type="button"
            onClick={() => setAmount(String(balance))}
            className="shrink-0 rounded-lg bg-brand-50 text-brand-700 px-3 text-sm font-medium"
          >
            Thu đủ
          </button>
        </div>

        <label className="block text-xs font-medium text-slate-500 mb-1">Ghi chú (tùy chọn)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="VD: Trả một phần"
        />

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl py-3 font-medium text-slate-600 bg-slate-100">
            Hủy
          </button>
          <button type="submit" className="flex-1 rounded-xl py-3 font-medium text-white bg-brand-700">
            Ghi nhận
          </button>
        </div>
      </form>
    </div>
  )
}
