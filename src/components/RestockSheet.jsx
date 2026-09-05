import React, { Suspense, lazy, useEffect, useState } from 'react'
import { useData } from '../store/DataContext'
import { ScanIcon } from './Icons'

const BarcodeScannerModal = lazy(() => import('./BarcodeScannerModal'))

export default function RestockSheet({ open, onClose, product }) {
  const { products, restockProduct, findProductByBarcode, stockMovements } = useData()
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [sellPrice, setSellPrice] = useState('')
  const [note, setNote] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanMsg, setScanMsg] = useState('')

  useEffect(() => {
    if (open) {
      const initialId = product?.id || products[0]?.id || ''
      const initialProduct = products.find((p) => p.id === initialId)
      setProductId(initialId)
      setQty('')
      setCostPrice(initialProduct?.costPrice ? String(initialProduct.costPrice) : '')
      setSellPrice(initialProduct?.price ? String(initialProduct.price) : '')
      setNote('')
      setScanMsg('')
    }
  }, [open, product, products])

  if (!open) return null

  const selected = products.find((p) => p.id === productId)

  function handleProductChange(id) {
    setProductId(id)
    const p = products.find((item) => item.id === id)
    setCostPrice(p?.costPrice ? String(p.costPrice) : '')
    setSellPrice(p?.price ? String(p.price) : '')
  }

  function handleDetected(code) {
    setScannerOpen(false)
    const found = findProductByBarcode(code)
    if (found) {
      handleProductChange(found.id)
      setScanMsg(`Đã chọn: ${found.name}`)
    } else {
      setScanMsg(`Không tìm thấy sản phẩm với mã ${code}`)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    const addQty = Number(qty)
    if (!productId || !addQty || addQty <= 0) return
    restockProduct(productId, addQty, note, costPrice, sellPrice)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md max-h-[88vh] overflow-y-auto bg-white rounded-t-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-slate-800 mb-3">Nhập kho</h2>

        <label className="block text-xs font-medium text-slate-500 mb-1">Sản phẩm</label>
        <div className="flex gap-2 mb-1">
          <select
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (đang có {p.stock})
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

        <label className="block text-xs font-medium text-slate-500 mb-1 mt-2">Số lượng nhập thêm</label>
        <input
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

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Giá nhập lần này (VND)</label>
            <input
              type="number"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="VD: 8000"
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
              placeholder="VD: 12000"
            />
          </div>
        </div>
        <p className="text-[12px] text-slate-400 -mt-2 mb-3">
          Bỏ trống để giữ nguyên giá hiện tại. Giá bán mới sẽ áp dụng cho toàn bộ tồn kho sản phẩm này.
        </p>

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

        <div className="mt-5 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-semibold text-slate-500 mb-2">Lịch sử nhập kho gần đây</h3>
          {stockMovements.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">Chưa có lượt nhập kho nào</p>
          ) : (
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {stockMovements.slice(0, 20).map((m) => (
                <li key={m.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-slate-700">{m.productName}</span>
                    <span className="shrink-0 text-sm font-semibold text-emerald-600">+{m.qty}</span>
                  </div>
                  <div className="mt-0.5 text-[12px] text-slate-400">
                    {new Date(m.createdAt).toLocaleString('vi-VN')}
                  </div>
                  {(m.costPrice > 0 || m.sellPrice > 0) && (
                    <div className="mt-0.5 text-xs text-slate-500">
                      Giá nhập: {m.costPrice ? m.costPrice.toLocaleString('vi-VN') : '—'} · Giá bán:{' '}
                      {m.sellPrice ? m.sellPrice.toLocaleString('vi-VN') : '—'}
                    </div>
                  )}
                  {m.note && <div className="mt-0.5 text-xs text-slate-500">Ghi chú: {m.note}</div>}
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
