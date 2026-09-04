import React, { createContext, useContext, useEffect, useState } from 'react'
import { loadData, saveData, makeId } from '../lib/storage'

const DEFAULT_PRODUCTS = [
  { id: makeId(), name: 'Coca Cola lon', price: 12000, stock: 48, category: 'Nước giải khát', barcode: '8934588123451' },
  { id: makeId(), name: 'Mì tôm Hảo Hảo', price: 4500, stock: 100, category: 'Thực phẩm', barcode: '8934588123468' },
  { id: makeId(), name: 'Bánh mì sandwich', price: 20000, stock: 15, category: 'Đồ ăn', barcode: '' },
  { id: makeId(), name: 'Nước suối Lavie 500ml', price: 6000, stock: 60, category: 'Nước giải khát', barcode: '8934588123475' },
  { id: makeId(), name: 'Cà phê sữa đá', price: 18000, stock: 30, category: 'Đồ uống', barcode: '' }
]

const DEFAULT_SETTINGS = { shopName: 'Bán Hàng POS', shopAddress: '' }

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [products, setProducts] = useState(() => loadData('products', DEFAULT_PRODUCTS))
  const [cart, setCart] = useState(() => loadData('cart', []))
  const [orders, setOrders] = useState(() => loadData('orders', []))
  const [stockMovements, setStockMovements] = useState(() => loadData('stockMovements', []))
  const [settings, setSettings] = useState(() => loadData('settings', DEFAULT_SETTINGS))

  useEffect(() => saveData('products', products), [products])
  useEffect(() => saveData('cart', cart), [cart])
  useEffect(() => saveData('orders', orders), [orders])
  useEffect(() => saveData('stockMovements', stockMovements), [stockMovements])
  useEffect(() => saveData('settings', settings), [settings])

  function updateSettings(patch) {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  function addProduct(product) {
    setProducts((prev) => [...prev, { ...product, id: makeId() }])
  }

  function updateProduct(id, patch) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function deleteProduct(id) {
    setProducts((prev) => prev.filter((p) => p.id !== id))
    setCart((prev) => prev.filter((c) => c.productId !== id))
  }

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === product.id)
      const inCartQty = existing ? existing.qty : 0
      if (inCartQty >= product.stock) return prev
      if (existing) {
        return prev.map((c) => (c.productId === product.id ? { ...c, qty: c.qty + 1 } : c))
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, qty: 1 }]
    })
  }

  function setCartQty(productId, qty) {
    setCart((prev) => {
      if (qty <= 0) return prev.filter((c) => c.productId !== productId)
      const product = products.find((p) => p.id === productId)
      const maxQty = product ? product.stock : qty
      return prev.map((c) => (c.productId === productId ? { ...c, qty: Math.min(qty, maxQty) } : c))
    })
  }

  function removeFromCart(productId) {
    setCart((prev) => prev.filter((c) => c.productId !== productId))
  }

  function restockProduct(productId, qty, note) {
    const addQty = Math.max(0, Number(qty) || 0)
    if (addQty <= 0) return
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: p.stock + addQty } : p))
    )
    setStockMovements((prev) => [
      { id: makeId(), productId, productName: product.name, qty: addQty, note: note.trim(), createdAt: new Date().toISOString() },
      ...prev
    ])
  }

  function findProductByBarcode(code) {
    const trimmed = code.trim()
    if (!trimmed) return null
    return products.find((p) => p.barcode && p.barcode === trimmed) || null
  }

  function clearCart() {
    setCart([])
  }

  function checkout() {
    if (cart.length === 0) return null
    const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0)
    const order = { id: makeId(), items: cart, total, createdAt: new Date().toISOString() }
    setOrders((prev) => [order, ...prev])
    setProducts((prev) =>
      prev.map((p) => {
        const item = cart.find((c) => c.productId === p.id)
        return item ? { ...p, stock: Math.max(0, p.stock - item.qty) } : p
      })
    )
    clearCart()
    return order
  }

  const value = {
    products,
    cart,
    orders,
    stockMovements,
    settings,
    addProduct,
    updateProduct,
    deleteProduct,
    addToCart,
    setCartQty,
    removeFromCart,
    clearCart,
    checkout,
    findProductByBarcode,
    restockProduct,
    updateSettings
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData phải được dùng bên trong DataProvider')
  return ctx
}
