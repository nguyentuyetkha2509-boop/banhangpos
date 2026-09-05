import React, { Suspense, lazy, useMemo, useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'
import CartSheet from '../components/CartSheet'
import SettingsSheet from '../components/SettingsSheet'
import { usePendingApprovalsCount } from '../store/usePendingApprovals'
import { SettingsIcon, ScanIcon, CartIcon, BoxIcon } from '../components/Icons'

const BarcodeScannerModal = lazy(() => import('../components/BarcodeScannerModal'))

export default function SalesPage() {
  const { products, cart, addToCart, findProductByBarcode, settings } = useData()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState('')
  const pendingApprovals = usePendingApprovalsCount()

  const categories = useMemo(() => {
    const set = new Set()
    products.forEach((p) => { if (p.category) set.add(p.category) })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'))
  }, [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.toLowerCase().includes(q))
      const matchesCategory = !category || p.category === category
      return matchesQuery && matchesCategory
    })
  }, [products, query, category])

  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0)
  const cartTotal = cart.reduce((sum, c) => sum + c.qty * c.price, 0)

  function cartQtyOf(productId) {
    return cart.find((c) => c.productId === productId)?.qty ?? 0
  }

  function showToast(message) {
    setToast(message)
    setTimeout(() => setToast(''), 2200)
  }

  function handleSearchKeyDown(e) {
    if (e.key !== 'Enter') return
    const product = findProductByBarcode(query)
    if (product) {
      addToCart(product)
      setQuery('')
      showToast(`Đã thêm: ${product.name}`)
    }
  }

  function handleDetected(code) {
    setScannerOpen(false)
    const product = findProductByBarcode(code)
    if (product) {
      addToCart(product)
      showToast(`Đã thêm: ${product.name}`)
    } else {
      showToast(`Không tìm thấy sản phẩm với mã ${code}`)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Bán hàng</h1>
          <p className="text-xs text-slate-400">{settings.shopName}</p>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Cài đặt cửa hàng"
          className="relative shrink-0 rounded-2xl bg-white border border-slate-200 h-12 w-12 flex items-center justify-center shadow-sm active:scale-[0.95] transition"
        >
          <SettingsIcon className="h-6 w-6 text-slate-500" />
          {pendingApprovals > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[11px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
              {pendingApprovals}
            </span>
          )}
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Tìm tên hoặc quét mã vạch..."
          className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
        <button
          onClick={() => setScannerOpen(true)}
          aria-label="Quét mã vạch"
          className="shrink-0 rounded-xl bg-brand-700 text-white h-11 w-12 flex items-center justify-center shadow-sm active:scale-[0.97] transition"
        >
          <ScanIcon className="h-6 w-6" />
        </button>
      </div>

      {toast && (
        <p className="mt-2 rounded-lg bg-slate-800 text-white text-xs px-3 py-2 text-center">{toast}</p>
      )}

      {categories.length > 0 && (
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-1 -mx-4 px-4">
          <button
            onClick={() => setCategory('')}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              category === '' ? 'bg-brand-700 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            Tất cả
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                category === c ? 'bg-brand-700 text-white' : 'bg-white border border-slate-200 text-slate-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-4">
        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-sm text-slate-400 py-10">Không tìm thấy sản phẩm</p>
        )}
        {filtered.map((p) => {
          const inCart = cartQtyOf(p.id)
          const outOfStock = p.stock <= 0
          return (
            <button
              key={p.id}
              disabled={outOfStock || inCart >= p.stock}
              onClick={() => addToCart(p)}
              className="relative text-left bg-white rounded-xl border border-slate-200 p-3 shadow-sm active:scale-[0.97] transition disabled:opacity-50 disabled:active:scale-100"
            >
              {inCart > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow">
                  {inCart}
                </span>
              )}
              <div className="w-full aspect-square rounded-lg border border-slate-100 bg-slate-50 overflow-hidden mb-2 flex items-center justify-center">
                {p.image ? (
                  <img src={p.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <BoxIcon className="h-7 w-7 text-slate-300" />
                )}
              </div>
              <p className="font-medium text-sm text-slate-800 line-clamp-2 min-h-[2.5rem]">{p.name}</p>
              <p className="text-brand-700 font-bold mt-1">{formatVND(p.price)}</p>
              <p className={`text-xs mt-0.5 ${outOfStock ? 'text-red-500' : 'text-slate-400'}`}>
                {outOfStock ? 'Hết hàng' : `Còn ${p.stock}`}
              </p>
            </button>
          )
        })}
      </div>

      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-brand-700 text-white rounded-xl px-4 py-3 shadow-lg flex items-center justify-between active:scale-[0.98] transition"
        >
          <span className="font-medium text-sm flex items-center gap-1.5">
            <CartIcon className="h-5 w-5" />
            {cartCount} sản phẩm
          </span>
          <span className="font-bold">{formatVND(cartTotal)}</span>
        </button>
      )}

      <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
      <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {scannerOpen && (
        <Suspense fallback={null}>
          <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleDetected} />
        </Suspense>
      )}
    </div>
  )
}
