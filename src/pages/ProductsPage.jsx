import React, { useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'
import ProductFormSheet from '../components/ProductFormSheet'
import RestockSheet from '../components/RestockSheet'
import ReturnSheet from '../components/ReturnSheet'
import { RestockIcon, ReturnIcon, PlusIcon, BoxIcon } from '../components/Icons'

export default function ProductsPage() {
  const { products, deleteProduct, stockMovements } = useData()
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showRestock, setShowRestock] = useState(false)
  const [showReturn, setShowReturn] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

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
          className="flex-1 flex items-center justify-center gap-1.5 bg-brand-50 text-brand-700 text-sm font-medium rounded-lg px-3 py-2.5 active:scale-[0.97] transition"
        >
          <RestockIcon className="h-5 w-5" />
          Nhập kho
        </button>
        <button
          onClick={() => setShowReturn(true)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 text-sm font-medium rounded-lg px-3 py-2.5 active:scale-[0.97] transition"
        >
          <ReturnIcon className="h-5 w-5" />
          Trả hàng
        </button>
      </div>
      <div className="mb-3">
        <button
          onClick={openNew}
          className="w-full flex items-center justify-center gap-1.5 bg-brand-700 text-white text-sm font-medium rounded-lg px-3 py-2.5 active:scale-[0.97] transition"
        >
          <PlusIcon className="h-5 w-5" />
          Thêm sản phẩm
        </button>
      </div>

      <div className="space-y-2">
        {products.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">Chưa có sản phẩm nào</p>
        )}
        {products.map((p) => {
          const isExpanded = expandedId === p.id
          const productMovements = stockMovements.filter((m) => m.productId === p.id)
          return (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-3 flex items-center justify-between">
                <button onClick={() => setExpandedId(isExpanded ? null : p.id)} className="min-w-0 flex-1 text-left flex items-center gap-2.5">
                  <div className="w-11 h-11 shrink-0 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <BoxIcon className="h-5 w-5 text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-800 truncate">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.category || 'Không phân loại'} · Tồn: {p.stock}</p>
                    <p className="text-brand-700 font-bold text-sm mt-0.5">{formatVND(p.price)}</p>
                    {p.barcode && <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{p.barcode}</p>}
                  </div>
                </button>
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
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
                  <h3 className="text-xs font-semibold text-slate-500 mb-1.5">Lịch sử nhập kho</h3>
                  {productMovements.length === 0 ? (
                    <p className="text-xs text-slate-400 py-1">Chưa có lượt nhập kho nào</p>
                  ) : (
                    <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {productMovements.map((m) => (
                        <li key={m.id} className="rounded-lg bg-white border border-slate-100 px-2.5 py-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500">
                              {new Date(m.createdAt).toLocaleString('vi-VN')}
                            </span>
                            <span className="text-xs font-semibold text-emerald-600">+{m.qty}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Giá nhập: {m.costPrice ? formatVND(m.costPrice) : '—'}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ProductFormSheet open={showForm} onClose={() => setShowForm(false)} product={editing} />
      <RestockSheet open={showRestock} onClose={() => setShowRestock(false)} />
      <ReturnSheet open={showReturn} onClose={() => setShowReturn(false)} />
    </div>
  )
}
