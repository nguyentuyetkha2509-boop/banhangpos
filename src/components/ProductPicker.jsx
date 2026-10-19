import React, { useMemo, useState } from 'react'
import { normalizeText } from '../lib/stockImport'

// Chon san pham co o tim kiem (go ten hoac ma vach) thay cho o chon cuon dai
export default function ProductPicker({ products, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = products.find((p) => p.id === value)

  const filtered = useMemo(() => {
    const words = normalizeText(query).split(' ').filter(Boolean)
    if (words.length === 0) return products
    return products.filter((p) => {
      const text = `${normalizeText(p.name)} ${(p.barcode || '').toLowerCase()}`
      return words.every((w) => text.includes(w))
    })
  }, [products, query])

  function pick(id) {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  function label(p) {
    return `${p.name}${p.isPromotion ? ' · Khuyến mãi' : ''} (đang có ${p.stock})`
  }

  return (
    <div className="flex-1 min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
      >
        <span className="block truncate">{selected ? label(selected) : 'Chọn sản phẩm'}</span>
      </button>
      {open && (
        <div className="mt-1 rounded-lg border border-slate-200 bg-white shadow-sm">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Gõ tên hoặc mã vạch để tìm..."
            className="w-full rounded-t-lg border-b border-slate-100 px-3 py-2 text-sm focus:outline-none"
          />
          <ul className="max-h-56 overflow-y-auto">
            {filtered.length === 0 && <li className="px-3 py-3 text-sm text-slate-400">Không tìm thấy sản phẩm</li>}
            {filtered.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => pick(p.id)}
                  className={`w-full text-left px-3 py-2 text-sm border-b border-slate-50 ${
                    p.id === value ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-700'
                  }`}
                >
                  {label(p)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
