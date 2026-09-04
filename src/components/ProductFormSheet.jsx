import React, { Suspense, lazy, useEffect, useState } from 'react'
import { useData } from '../store/DataContext'

const BarcodeScannerModal = lazy(() => import('./BarcodeScannerModal'))

const EMPTY = { name: '', price: '', stock: '', category: '', barcode: '' }

export default function ProductFormSheet({ open, onClose, product }) {
  const { addProduct, updateProduct } = useData()
  const [form, setForm] = useState(EMPTY)
  const [scannerOpen, setScannerOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setForm(
        product
          ? {
              name: product.name,
              price: product.price,
              stock: product.stock,
              category: product.category || '',
              barcode: product.barcode || ''
            }
          : EMPTY
      )
    }
  }, [open, product])

  if (!open) return null

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || form.price === '' || form.stock === '') return
    const payload = {
      name: form.name.trim(),
      price: Math.max(0, Number(form.price) || 0),
      stock: Math.max(0, Number(form.stock) || 0),
      category: form.category.trim(),
      barcode: form.barcode.trim()
    }
    if (product) {
      updateProduct(product.id, payload)
    } else {
      addProduct(payload)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-t-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-slate-800 mb-3">{product ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>

        <label className="block text-xs font-medium text-slate-500 mb-1">Tên sản phẩm</label>
        <input
          autoFocus
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="VD: Coca Cola lon"
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Giá bán (VND)</label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tồn kho</label>
            <input
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => handleChange('stock', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="0"
            />
          </div>
        </div>

        <label className="block text-xs font-medium text-slate-500 mb-1">Danh mục (tùy chọn)</label>
        <input
          value={form.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="VD: Nước giải khát"
        />

        <label className="block text-xs font-medium text-slate-500 mb-1">Mã vạch (tùy chọn)</label>
        <div className="flex gap-2 mb-4">
          <input
            value={form.barcode}
            onChange={(e) => handleChange('barcode', e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="VD: 8934588123451"
          />
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            aria-label="Quét mã vạch"
            className="shrink-0 rounded-lg bg-brand-50 text-brand-700 px-3 text-sm font-medium"
          >
            📷 Quét
          </button>
        </div>

        <div className="flex gap-2">
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
      </form>

      {scannerOpen && (
        <Suspense fallback={null}>
          <BarcodeScannerModal
            open={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onDetected={(code) => {
              setScannerOpen(false)
              handleChange('barcode', code)
            }}
          />
        </Suspense>
      )}
    </div>
  )
}
