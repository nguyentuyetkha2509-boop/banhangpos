import React, { Suspense, lazy, useEffect, useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'
import { ScanIcon } from './Icons'

const BarcodeScannerModal = lazy(() => import('./BarcodeScannerModal'))

const REASONS = ['Vỡ/hỏng', 'Hết hạn', 'Mất', 'Khác']

export default function ShrinkageSheet({ open, onClose, product }) {
  const { products, addShrinkage, deleteShrinkage, findProductByBarcode, shrinkages } = useData()
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState(REASONS[0])
  const [note, setNote] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanMsg, setScanMsg] = useState('')

  useEffect(() => {
    if (open) {
      const initialId = product?.id || products[0]?.id || ''
      setProductId(initialId)
      setQty('')
      setReason(REASONS[0])
      setNote('')
      setScanMsg('')
    }
  }, [open, product, products])

  if (!open) return null

  const selected = products.find((p) => p.id === productId)

  function handleDetected(code) {
    setScannerOpen(false)
    const found = findProductByBarcode(code)
    if (found) {
      setProductId(found.id)
      setScanMsg(`Đã chọn: ${found.name}`)
    } else {
      setScanMsg(`Không tìm thấy sản phẩm với mã ${code}`)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const lostQty = Number(qty)
    if (!productId || !lostQty || lostQty <= 0) return
    addShrinkage(productId, lostQty, reason, note)
    onClose()
  }

  function handleDelete(id) {
    if (confirm('Xóa lượt ghi nhận hao hụt này? Tồn kho sẽ được cộng lại tương ứng.')) {
      deleteShrinkage(id)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md max-h-[88vh] overflow-y-auto bg-white rounded-t-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-slate-800 mb-3">Ghi nhận hao hụt</h2>

        <label className="block text-xs font-medium text-slate-500 mb-1">Sản phẩm</label>
        <div className="flex gap-2 mb-1">
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.isPromotion ? ' · Khuyến mãi' : ''} (đang có {p.stock})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            aria-label="Quét mã vạch"
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-brand-50 text-brand-700 px-3 text-sm font-medium"
          >
            <ScanIcon className="h-5 w-5" />
            Quét
          </button>
        </div>
        {scanMsg && <p className="text-xs text-slate-500 mb-2">{scanMsg}</p>}

        <label className="block text-xs font-medium text-slate-500 mb-1 mt-2">Số lượng bị mất/hỏng</label>
        <input
          type="number"
          min="1"
          max={selected?.stock}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="VD: 2"
        />

        <label className="block text-xs font-medium text-slate-500 mb-1">Lý do</label>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                reason === r ? 'bg-red-500 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {selected && qty && Number(qty) > 0 && (
          <p className="text-xs text-slate-500 mb-3">
            Tồn sau khi trừ: <span className="font-semibold text-red-500">{Math.max(0, selected.stock - Number(qty))}</span>{' '}
            · Giá trị thiệt hại:{' '}
            <span className="font-semibold text-red-500">{formatVND((selected.costPrice || 0) * Number(qty))}</span>
          </p>
        )}
        <p className="text-[14px] text-slate-400 -mt-1 mb-3">
          Giá trị thiệt hại tính theo giá nhập gần nhất, sẽ được trừ vào lãi ước tính trong Báo cáo.
        </p>

        <label className="block text-xs font-medium text-slate-500 mb-1">Ghi chú (tùy chọn)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="VD: Rơi vỡ lúc bày hàng"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl py-3 font-medium text-slate-600 bg-slate-100"
          >
            Hủy
          </button>
          <button type="submit" className="flex-1 rounded-xl py-3 font-medium text-white bg-red-500">
            Ghi nhận hao hụt
          </button>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-semibold text-slate-500 mb-2">Lịch sử hao hụt gần đây</h3>
          {shrinkages.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">Chưa có lượt ghi nhận nào</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {shrinkages.slice(0, 20).map((s) => (
                <li key={s.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-slate-700">{s.productName}</span>
                    <span className="shrink-0 flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-red-500">−{s.qty}</span>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className="text-[14px] font-medium text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5"
                      >
                        Xóa
                      </button>
                    </span>
                  </div>
                  <div className="mt-0.5 text-[14px] text-slate-400">
                    {new Date(s.createdAt).toLocaleString('vi-VN')} · {s.reason}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">Giá trị thiệt hại: {formatVND(s.value || 0)}</div>
                  {s.note && <div className="mt-0.5 text-xs text-slate-500">Ghi chú: {s.note}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </form>

      {scannerOpen && (
        <Suspense fallback={null}>
          <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleDetected} />
        </Suspense>
      )}
    </div>
  )
}
