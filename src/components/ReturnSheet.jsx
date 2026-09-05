import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'
import { ScanIcon } from './Icons'

const BarcodeScannerModal = lazy(() => import('./BarcodeScannerModal'))

export default function ReturnSheet({ open, onClose, product, order }) {
  const { products, orders, addReturn, findProductByBarcode, returns } = useData()
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [costPriceInput, setCostPriceInput] = useState('')
  const [note, setNote] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scanMsg, setScanMsg] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const fromOrder = Boolean(order)
  const orderItems = order?.items || []

  const knownCustomers = useMemo(() => {
    const set = new Set()
    orders.forEach((o) => { if (o.customerName) set.add(o.customerName) })
    returns.forEach((r) => { if (r.customerName && r.customerName !== 'Khách lẻ') set.add(r.customerName) })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'))
  }, [orders, returns])

  const filteredCustomers = useMemo(() => {
    const q = customerName.trim().toLowerCase()
    if (!q) return knownCustomers
    return knownCustomers.filter((name) => name.toLowerCase().includes(q))
  }, [knownCustomers, customerName])

  function alreadyReturnedQty(pid) {
    if (!order) return 0
    return returns
      .filter((r) => r.orderId === order.id && r.productId === pid)
      .reduce((sum, r) => sum + r.qty, 0)
  }

  useEffect(() => {
    if (!open) return
    if (fromOrder) {
      const initialItem = orderItems[0]
      setProductId(initialItem?.productId || '')
      setUnitPrice(initialItem?.price ? String(initialItem.price) : '')
      setCustomerName((order.customerName || '').trim() || 'Khách lẻ')
    } else {
      const initialId = product?.id || products[0]?.id || ''
      const initialProduct = products.find((p) => p.id === initialId)
      setProductId(initialId)
      setUnitPrice(initialProduct?.price ? String(initialProduct.price) : '')
      setCostPriceInput(initialProduct?.costPrice ? String(initialProduct.costPrice) : '')
      setCustomerName('')
    }
    setQty('')
    setNote('')
    setScanMsg('')
  }, [open, product, products, order])

  if (!open) return null

  const selected = fromOrder
    ? orderItems.find((i) => i.productId === productId)
    : products.find((p) => p.id === productId)
  const maxReturnable = fromOrder && selected ? selected.qty - alreadyReturnedQty(selected.productId) : null

  function handleProductChange(id) {
    setProductId(id)
    if (fromOrder) {
      const item = orderItems.find((i) => i.productId === id)
      setUnitPrice(item?.price ? String(item.price) : '')
    } else {
      const p = products.find((item) => item.id === id)
      setUnitPrice(p?.price ? String(p.price) : '')
      setCostPriceInput(p?.costPrice ? String(p.costPrice) : '')
    }
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
    let returnQty = Number(qty)
    if (!productId || !returnQty || returnQty <= 0) return
    if (fromOrder && maxReturnable != null) {
      if (maxReturnable <= 0) return
      returnQty = Math.min(returnQty, maxReturnable)
    }
    const costPrice = fromOrder ? selected?.costPrice : costPriceInput
    const orderId = fromOrder ? order.id : undefined
    addReturn(productId, returnQty, customerName, unitPrice, note, costPrice, orderId)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md max-h-[88vh] overflow-y-auto bg-white rounded-t-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-slate-800 mb-3">
          Trả hàng {fromOrder && <span className="text-slate-400 font-normal text-sm">· HĐ #{order.id.slice(-6).toUpperCase()}</span>}
        </h2>

        <label className="block text-xs font-medium text-slate-500 mb-1">Sản phẩm</label>
        <div className="flex gap-2 mb-1">
          <select
            value={productId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="flex-1 min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {fromOrder
              ? orderItems.map((i) => (
                  <option key={i.productId} value={i.productId}>
                    {i.name} (đã mua {i.qty})
                  </option>
                ))
              : products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (đang có {p.stock})
                  </option>
                ))}
          </select>
          {!fromOrder && (
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              aria-label="Quét mã vạch"
              className="shrink-0 flex items-center gap-1.5 rounded-lg bg-brand-50 text-brand-700 px-3 text-sm font-medium"
            >
              <ScanIcon className="h-5 w-5" />
              Quét
            </button>
          )}
        </div>
        {scanMsg && <p className="text-xs text-slate-500 mb-2">{scanMsg}</p>}
        {fromOrder && maxReturnable != null && (
          <p className="text-xs text-slate-400 mb-2">Đã trả trước đó: {selected.qty - maxReturnable}/{selected.qty}</p>
        )}

        <label className="block text-xs font-medium text-slate-500 mb-1 mt-2">Tên khách hàng (tùy chọn)</label>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1 min-w-0">
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
              disabled={fromOrder}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="VD: Chị Lan"
            />
            {!fromOrder && showSuggestions && filteredCustomers.length > 0 && (
              <div className="absolute z-10 left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredCustomers.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      setCustomerName(name)
                      setShowSuggestions(false)
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 active:bg-slate-50"
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {!fromOrder && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setCustomerName('')}
              className="shrink-0 rounded-lg bg-slate-100 text-slate-500 px-3 text-sm font-medium"
            >
              Xóa
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Số lượng trả</label>
            <input
              type="number"
              min="1"
              max={maxReturnable ?? undefined}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="VD: 2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Đơn giá hoàn (VND)</label>
            <input
              type="number"
              min="0"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
              placeholder="VD: 12000"
            />
          </div>
          {!fromOrder && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Giá vốn (VND)</label>
              <input
                type="number"
                min="0"
                value={costPriceInput}
                onChange={(e) => setCostPriceInput(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                placeholder="VD: 10000"
              />
            </div>
          )}
        </div>
        {!fromOrder && (
          <p className="text-[11px] text-slate-400 -mt-2 mb-3">
            Tự lấy giá nhập hiện tại của sản phẩm, có thể sửa lại nếu khác lúc bán. Dùng để tính đúng lãi.
          </p>
        )}

        {!fromOrder && selected && qty && Number(qty) > 0 && (
          <p className="text-xs text-slate-500 mb-3">
            Tồn sau khi trả: <span className="font-semibold text-brand-700">{selected.stock + Number(qty)}</span> · Hoàn
            tiền: <span className="font-semibold text-brand-700">{formatVND(Number(qty) * Number(unitPrice || 0))}</span>
          </p>
        )}
        {fromOrder && qty && Number(qty) > 0 && (
          <p className="text-xs text-slate-500 mb-3">
            Hoàn tiền: <span className="font-semibold text-brand-700">{formatVND(Number(qty) * Number(unitPrice || 0))}</span>
          </p>
        )}

        <label className="block text-xs font-medium text-slate-500 mb-1">Ghi chú (tùy chọn)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="VD: Sản phẩm bị lỗi"
        />

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl py-3 font-medium text-slate-600 bg-slate-100"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={fromOrder && maxReturnable != null && maxReturnable <= 0}
            className="flex-1 rounded-xl py-3 font-medium text-white bg-brand-700 disabled:opacity-40"
          >
            Trả hàng
          </button>
        </div>

        {!fromOrder && (
          <div className="mt-5 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-500 mb-2">Lịch sử trả hàng gần đây</h3>
            {returns.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">Chưa có lượt trả hàng nào</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {returns.slice(0, 20).map((r) => (
                  <li key={r.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-slate-700">{r.productName}</span>
                      <span className="shrink-0 text-sm font-semibold text-red-500">−{r.qty}</span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400">
                      {new Date(r.createdAt).toLocaleString('vi-VN')} · {r.customerName}
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      Hoàn tiền: {formatVND(r.refundAmount)} · Giá vốn: {formatVND(r.costPrice || 0)}/sp
                    </div>
                    {r.note && <div className="mt-0.5 text-xs text-slate-500">Ghi chú: {r.note}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </form>

      {scannerOpen && (
        <Suspense fallback={null}>
          <BarcodeScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} onDetected={handleDetected} />
        </Suspense>
      )}
    </div>
  )
}
