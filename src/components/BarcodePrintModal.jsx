import React, { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { generateBarcodeDataUrl } from '../lib/barcode'
import { formatVND } from '../lib/storage'

export default function BarcodePrintModal({ product, onClose }) {
  const [copiesInput, setCopiesInput] = useState('6')
  const copies = Math.max(1, Math.min(60, Number(copiesInput) || 1))

  const dataUrl = useMemo(() => {
    if (!product?.barcode) return null
    try {
      return generateBarcodeDataUrl(product.barcode)
    } catch {
      return null
    }
  }, [product])

  if (!product) return null

  if (!dataUrl) {
    return createPortal(
      <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onClose}>
        <div className="w-full max-w-md bg-white rounded-t-2xl p-4" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-red-500 mb-3">Không tạo được mã vạch từ "{product.barcode}".</p>
          <button onClick={onClose} className="w-full rounded-xl py-3 font-medium text-slate-600 bg-slate-100">
            Đóng
          </button>
        </div>
      </div>,
      document.body
    )
  }

  return createPortal(
    <div className="barcode-print-wrapper fixed inset-0 z-40 flex flex-col bg-white">
      <div className="no-print flex flex-col gap-2 p-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800">In mã vạch · {product.name}</h2>
          <button onClick={onClose} className="text-slate-400 text-sm">Đóng</button>
        </div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Số lượng tem</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            max="60"
            value={copiesInput}
            onChange={(e) => setCopiesInput(e.target.value)}
            onBlur={() => setCopiesInput(String(copies))}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-brand-700 text-white px-5 text-sm font-medium"
          >
            In
          </button>
        </div>
      </div>

      <div className="barcode-print-scroll flex-1 overflow-y-auto p-3">
        <div className="barcode-grid grid grid-cols-2 gap-3">
          {Array.from({ length: copies }).map((_, i) => (
            <div key={i} className="barcode-label border border-slate-300 rounded-lg p-2 flex flex-col items-center">
              <p className="text-xs font-semibold text-slate-800 truncate w-full text-center">{product.name}</p>
              <img src={dataUrl} alt="" className="w-full" />
              {product.price > 0 && <p className="text-sm font-bold text-slate-800">{formatVND(product.price)}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
