import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { useData } from '../store/DataContext'
import { ImageIcon, ScanIcon } from './Icons'

const BarcodeScannerModal = lazy(() => import('./BarcodeScannerModal'))

const EMPTY = { name: '', category: '', barcode: '', image: '', price: '', isPromotion: false }

function resizeImageToDataUrl(file, maxSize = 240, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ProductFormSheet({ open, onClose, product }) {
  const { products, addProduct, updateProduct } = useData()
  const [form, setForm] = useState(EMPTY)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [imageBusy, setImageBusy] = useState(false)
  const [showNameSuggestions, setShowNameSuggestions] = useState(false)
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)

  const knownNames = useMemo(() => {
    const set = new Set()
    products.forEach((p) => { if (p.name) set.add(p.name) })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'))
  }, [products])

  const knownCategories = useMemo(() => {
    const set = new Set()
    products.forEach((p) => { if (p.category) set.add(p.category) })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'))
  }, [products])

  const filteredNames = useMemo(() => {
    const q = form.name.trim().toLowerCase()
    if (!q) return knownNames
    return knownNames.filter((n) => n.toLowerCase().includes(q))
  }, [knownNames, form.name])

  const filteredCategories = useMemo(() => {
    const q = form.category.trim().toLowerCase()
    if (!q) return knownCategories
    return knownCategories.filter((c) => c.toLowerCase().includes(q))
  }, [knownCategories, form.category])

  useEffect(() => {
    if (open) {
      setForm(
        product
          ? {
              name: product.name,
              category: product.category || '',
              barcode: product.barcode || '',
              image: product.image || '',
              price: product.price ?? '',
              isPromotion: Boolean(product.isPromotion)
            }
          : EMPTY
      )
    }
  }, [open, product])

  if (!open) return null

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleImagePick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImageBusy(true)
    try {
      const dataUrl = await resizeImageToDataUrl(file)
      handleChange('image', dataUrl)
    } catch {
      alert('Không đọc được ảnh này, thử ảnh khác nhé.')
    } finally {
      setImageBusy(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      barcode: form.barcode.trim(),
      image: form.image || '',
      isPromotion: form.isPromotion
    }
    if (product) {
      updateProduct(product.id, { ...payload, price: Math.max(0, Number(form.price) || 0) })
    } else {
      addProduct({ ...payload, price: 0, stock: 0, costPrice: 0 })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md max-h-[88vh] overflow-y-auto bg-white rounded-t-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-slate-800 mb-3">{product ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>

        <label className="block text-xs font-medium text-slate-500 mb-1">Tên sản phẩm</label>
        <div className="relative mb-3">
          <input
            autoFocus
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onFocus={() => setShowNameSuggestions(true)}
            onBlur={() => setShowNameSuggestions(false)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="VD: Coca Cola lon"
          />
          {showNameSuggestions && filteredNames.length > 0 && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {filteredNames.map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    handleChange('name', n)
                    setShowNameSuggestions(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 active:bg-slate-50"
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="block text-xs font-medium text-slate-500 mb-1">Hình ảnh sản phẩm (tùy chọn)</label>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-16 h-16 shrink-0 rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
            {form.image ? (
              <img src={form.image} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="h-7 w-7 text-slate-300" />
            )}
          </div>
          <label className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-brand-50 text-brand-700 text-sm font-medium py-2.5 text-center cursor-pointer">
            {imageBusy ? null : <ImageIcon className="h-5 w-5" />}
            {imageBusy ? 'Đang xử lý...' : form.image ? 'Đổi ảnh khác' : 'Chọn ảnh'}
            <input type="file" accept="image/*" onChange={handleImagePick} className="hidden" disabled={imageBusy} />
          </label>
          {form.image && (
            <button
              type="button"
              onClick={() => handleChange('image', '')}
              className="shrink-0 rounded-lg bg-slate-100 text-slate-500 px-3 py-2.5 text-sm"
            >
              Xóa
            </button>
          )}
        </div>

        {product && (
          <>
            <label className="block text-xs font-medium text-slate-500 mb-1">Giá bán (VND)</label>
            <input
              type="number"
              min="0"
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="0"
            />
          </>
        )}

        <label className="block text-xs font-medium text-slate-500 mb-1">Danh mục (tùy chọn)</label>
        <div className="relative mb-3">
          <input
            value={form.category}
            onChange={(e) => handleChange('category', e.target.value)}
            onFocus={() => setShowCategorySuggestions(true)}
            onBlur={() => setShowCategorySuggestions(false)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            placeholder="VD: Nước giải khát"
          />
          {showCategorySuggestions && filteredCategories.length > 0 && (
            <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {filteredCategories.map((c) => (
                <button
                  key={c}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    handleChange('category', c)
                    setShowCategorySuggestions(false)
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 active:bg-slate-50"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="block text-xs font-medium text-slate-500 mb-1">Mã vạch (tùy chọn)</label>
        <div className="flex gap-2 mb-1">
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
            className="shrink-0 flex items-center gap-1.5 rounded-lg bg-brand-50 text-brand-700 px-3 text-sm font-medium"
          >
            <ScanIcon className="h-5 w-5" />
            Quét
          </button>
        </div>

        <button
          type="button"
          onClick={() => handleChange('isPromotion', !form.isPromotion)}
          className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 mb-1 border transition ${
            form.isPromotion ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'
          }`}
        >
          <span className={`text-sm font-medium ${form.isPromotion ? 'text-amber-700' : 'text-slate-600'}`}>
            Sản phẩm khuyến mãi
          </span>
          <span
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              form.isPromotion ? 'bg-amber-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                form.isPromotion ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </span>
        </button>

        {!product && (
          <p className="text-[14px] text-slate-400 mt-1 mb-4">
            Số lượng tồn và giá bán sẽ được cập nhật ở mục "Nhập kho" sau khi lưu sản phẩm này.
          </p>
        )}
        {product && <div className="mb-4" />}

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
