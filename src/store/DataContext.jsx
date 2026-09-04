import React, { createContext, useContext, useEffect, useState } from 'react'
import { loadData, saveData, makeId } from '../lib/storage'

const DEFAULT_PRODUCTS = [
  { id: makeId(), name: 'Coca Cola lon', price: 12000, stock: 48, category: 'Nuoc giai khat' },
  { id: makeId(), name: 'Mi tom Hao Hao', price: 4500, stock: 100, category: 'Thuc pham' },
  { id: makeId(), name: 'Banh mi sandwich', price: 20000, stock: 15, category: 'Do an' },
  { id: makeId(), name: 'Nuoc suoi Lavie 500ml', price: 6000, stock: 60, category: 'Nuoc giai khat' },
  { id: makeId(), name: 'Ca phe sua da', price: 18000, stock: 30, category: 'Do uong' }
]

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [products, setProducts] = useState(() => loadData('products', DEFAULT_PRODUCTS))
  const [cart, setCart] = useState(() => loadData('cart', []))
  const [orders, setOrders] = useState(() => loadData('orders', []))

  useEffect(() => saveData('products', products), [products])
  useEffect(() => saveData('cart', cart), [cart])
  useEffect(() => saveData('orders', orders), [orders])

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
    addProduct,
    updateProduct,
    deleteProduct,
    addToCart,
    setCartQty,
    removeFromCart,
    clearCart,
    checkout
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData phai duoc dung ben trong DataProvider')
  return ctx
}
