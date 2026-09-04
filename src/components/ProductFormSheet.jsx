import React, { useEffect, useState } from 'react'
import { useData } from '../store/DataContext'

const EMPTY = { name: '', price: '', stock: '', category: '' }

export default function ProductFormSheet({ open, onClose, product }) {
  const { addProduct, updateProduct } = useData()
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (open) {
      setForm(
        product
          ? { name: product.name, price: product.price, stock: product.stock, category: product.category || '' }
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
      category: form.category.trim()
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
        <h2 className="font-bold text-slate-800 mb-3">{product ? 'Sua san pham' : 'Them san pham'}</h2>

        <label className="block text-xs font-medium text-slate-500 mb-1">Ten san pham</label>
        <input
          autoFocus
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="VD: Coca Cola lon"
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Gia ban (VND)</label>
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
            <label className="block text-xs font-medium text-slate-500 mb-1">Ton kho</label>
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

        <label className="block text-xs font-medium text-slate-500 mb-1">Danh muc (tuy chon)</label>
        <input
          value={form.category}
          onChange={(e) => handleChange('category', e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="VD: Nuoc giai khat"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl py-3 font-medium text-slate-600 bg-slate-100"
          >
            Huy
          </button>
          <button type="submit" className="flex-1 rounded-xl py-3 font-medium text-white bg-brand-700">
            Luu
          </button>
        </div>
      </form>
    </div>
  )
}
