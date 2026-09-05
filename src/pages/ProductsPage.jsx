import React, { useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'
import ProductFormSheet from '../components/ProductFormSheet'
import RestockSheet from '../components/RestockSheet'
import ReturnSheet from '../components/ReturnSheet'

export default function ProductsPage() {
  const { products, deleteProduct } = useData()
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showRestock, setShowRestock] = useState(false)
  const [showReturn, setShowReturn] = useState(false)

  function openNew() {
    setEditing(null)
    setShowForm(true)
  }

  function openEdit(product) {
    setEditing(product)
    setShowForm(true)
  }

  function handleDelete(product) {
    if (confirm(`Xóa sản phẩm "${product.name}"?`)) {
      deleteProduct(product.id)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-slate-800">Sản phẩm ({products.length})</h1>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => setShowRestock(true)}
          className="flex-1 bg-brand-50 text-brand-700 text-sm font-medium rounded-lg px-3 py-2 active:scale-[0.97] transition"
        >
          📥 Nhập kho
        </button>
        <button
          onClick={() => setShowReturn(true)}
          className="flex-1 bg-red-50 text-red-600 text-sm font-medium rounded-lg px-3 py-2 active:scale-[0.97] transition"
        >
          ↩️ Trả hàng
        </button>
      </div>
      <div className="mb-3">
        <button
          onClick={openNew}
          className="w-full bg-brand-700 text-white text-sm font-medium rounded-lg px-3 py-2 active:scale-[0.97] transition"
        >
          + Thêm sản phẩm
        </button>
      </div>

      <div className="space-y-2">
        {products.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">Chưa có sản phẩm nào</p>
        )}
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between shadow-sm">
            <div className="min-w-0">
              <p className="font-medium text-sm text-slate-800 truncate">{p.name}</p>
              <p className="text-xs text-slate-400">{p.category || 'Không phân loại'} · Tồn: {p.stock}</p>
              <p className="text-brand-700 font-bold text-sm mt-0.5">
                {formatVND(p.price)}
                {p.costPrice > 0 && (
                  <span className="text-slate-400 font-normal text-xs ml-1.5">
                    (nhập {formatVND(p.costPrice)})
                  </span>
                )}
              </p>
              {p.barcode && <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{p.barcode}</p>}
            </div>
            <div className="flex gap-1.5 shrink-0 ml-2">
              <button
                onClick={() => openEdit(p)}
                className="text-xs font-medium text-slate-600 bg-slate-100 rounded-lg px-3 py-1.5"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDelete(p)}
                className="text-xs font-medium text-red-500 bg-red-50 rounded-lg px-3 py-1.5"
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>

      <ProductFormSheet open={showForm} onClose={() => setShowForm(false)} product={editing} />
      <RestockSheet open={showRestock} onClose={() => setShowRestock(false)} />
      <ReturnSheet open={showReturn} onClose={() => setShowReturn(false)} />
    </div>
  )
}
