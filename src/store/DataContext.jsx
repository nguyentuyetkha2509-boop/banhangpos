import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from './AuthContext'
import { loadData, saveData, makeId } from '../lib/storage'

const DEFAULT_PRODUCTS = [
  { id: makeId(), name: 'Coca Cola lon', price: 12000, costPrice: 0, stock: 48, category: 'Nước giải khát', barcode: '8934588123451' },
  { id: makeId(), name: 'Mì tôm Hảo Hảo', price: 4500, costPrice: 0, stock: 100, category: 'Thực phẩm', barcode: '8934588123468' },
  { id: makeId(), name: 'Bánh mì sandwich', price: 20000, costPrice: 0, stock: 15, category: 'Đồ ăn', barcode: '' },
  { id: makeId(), name: 'Nước suối Lavie 500ml', price: 6000, costPrice: 0, stock: 60, category: 'Nước giải khát', barcode: '8934588123475' },
  { id: makeId(), name: 'Cà phê sữa đá', price: 18000, costPrice: 0, stock: 30, category: 'Đồ uống', barcode: '' }
]

const DEFAULT_SETTINGS = { shopName: 'Bán Hàng POS', shopAddress: '' }

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const { user } = useAuth()
  const uid = user.uid
  const docRef = useMemo(() => doc(db, 'shops', uid), [uid])
  const lastRemoteRef = useRef({})

  const [ready, setReady] = useState(false)
  const [syncError, setSyncError] = useState(null)
  const [products, setProducts] = useState(DEFAULT_PRODUCTS)
  const [orders, setOrders] = useState([])
  const [stockMovements, setStockMovements] = useState([])
  const [returns, setReturns] = useState([])
  const [debtPayments, setDebtPayments] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [cart, setCart] = useState(() => loadData('cart', []))
  const [printOrder, setPrintOrder] = useState(null)

  useEffect(() => {
    setReady(false)
    setSyncError(null)
    const unsub = onSnapshot(
      docRef,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          lastRemoteRef.current = data
          setProducts(data.products ?? DEFAULT_PRODUCTS)
          setOrders(data.orders ?? [])
          setStockMovements(data.stockMovements ?? [])
          setReturns(data.returns ?? [])
          setDebtPayments(data.debtPayments ?? [])
          setSettings(data.settings ?? DEFAULT_SETTINGS)
          setReady(true)
        } else {
          // Tai khoan moi: dua vao du lieu san co trong may (neu co, tu ban truoc khi
          // dung tai khoan dam may) thay vi xoa mat, khong thi dung mac dinh
          const initial = {
            products: loadData('products', DEFAULT_PRODUCTS),
            orders: loadData('orders', []),
            stockMovements: loadData('stockMovements', []),
            returns: loadData('returns', []),
            debtPayments: loadData('debtPayments', []),
            settings: loadData('settings', DEFAULT_SETTINGS)
          }
          lastRemoteRef.current = initial
          setProducts(initial.products)
          setOrders(initial.orders)
          setStockMovements(initial.stockMovements)
          setReturns(initial.returns)
          setDebtPayments(initial.debtPayments)
          setSettings(initial.settings)
          setReady(true)
          try {
            await setDoc(docRef, initial)
          } catch (err) {
            setSyncError(err.message)
          }
        }
      },
      (err) => {
        setSyncError(err.message)
      }
    )
    return unsub
  }, [docRef])

  useEffect(() => saveData('cart', cart), [cart])

  useEffect(() => {
    if (!ready || products === lastRemoteRef.current.products) return
    setDoc(docRef, { products }, { merge: true })
  }, [ready, products, docRef])

  useEffect(() => {
    if (!ready || orders === lastRemoteRef.current.orders) return
    setDoc(docRef, { orders }, { merge: true })
  }, [ready, orders, docRef])

  useEffect(() => {
    if (!ready || stockMovements === lastRemoteRef.current.stockMovements) return
    setDoc(docRef, { stockMovements }, { merge: true })
  }, [ready, stockMovements, docRef])

  useEffect(() => {
    if (!ready || returns === lastRemoteRef.current.returns) return
    setDoc(docRef, { returns }, { merge: true })
  }, [ready, returns, docRef])

  useEffect(() => {
    if (!ready || debtPayments === lastRemoteRef.current.debtPayments) return
    setDoc(docRef, { debtPayments }, { merge: true })
  }, [ready, debtPayments, docRef])

  useEffect(() => {
    if (!ready || settings === lastRemoteRef.current.settings) return
    setDoc(docRef, { settings }, { merge: true })
  }, [ready, settings, docRef])

  function updateSettings(patch) {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  function requestPrint(order) {
    setPrintOrder(order)
  }

  function closePrint() {
    setPrintOrder(null)
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
      return [
        ...prev,
        { productId: product.id, name: product.name, price: product.price, costPrice: product.costPrice || 0, qty: 1 }
      ]
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

  function restockProduct(productId, qty, note, costPrice, sellPrice) {
    const addQty = Math.max(0, Number(qty) || 0)
    if (addQty <= 0) return
    const product = products.find((p) => p.id === productId)
    if (!product) return
    const resolvedCost = costPrice === '' || costPrice == null ? product.costPrice || 0 : Math.max(0, Number(costPrice) || 0)
    const resolvedSell = sellPrice === '' || sellPrice == null ? product.price : Math.max(0, Number(sellPrice) || 0)
    setProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, stock: p.stock + addQty, costPrice: resolvedCost, price: resolvedSell } : p
      )
    )
    setStockMovements((prev) => [
      {
        id: makeId(),
        productId,
        productName: product.name,
        qty: addQty,
        costPrice: resolvedCost,
        sellPrice: resolvedSell,
        note: note.trim(),
        createdAt: new Date().toISOString()
      },
      ...prev
    ])
  }

  function addReturn(productId, qty, customerName, unitPrice, note, costPrice, orderId) {
    const returnQty = Math.max(0, Number(qty) || 0)
    if (returnQty <= 0) return
    const product = products.find((p) => p.id === productId)
    if (!product) return
    const price = unitPrice === '' || unitPrice == null ? product.price : Math.max(0, Number(unitPrice) || 0)
    const cost = costPrice === '' || costPrice == null ? product.costPrice || 0 : Math.max(0, Number(costPrice) || 0)
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, stock: p.stock + returnQty } : p)))
    setReturns((prev) => [
      {
        id: makeId(),
        productId,
        productName: product.name,
        customerName: (customerName || '').trim() || 'Khách lẻ',
        qty: returnQty,
        unitPrice: price,
        costPrice: cost,
        refundAmount: price * returnQty,
        note: (note || '').trim(),
        orderId: orderId || null,
        createdAt: new Date().toISOString()
      },
      ...prev
    ])
  }

  function resetAllData() {
    setProducts([])
    setOrders([])
    setStockMovements([])
    setReturns([])
    setDebtPayments([])
    setCart([])
  }

  function addDebtPayment(customerName, amount, note, paymentMethod = 'cash') {
    const value = Math.max(0, Number(amount) || 0)
    const name = (customerName || '').trim()
    if (!name || value <= 0) return
    setDebtPayments((prev) => [
      {
        id: makeId(),
        customerName: name,
        amount: value,
        paymentMethod,
        note: (note || '').trim(),
        createdAt: new Date().toISOString()
      },
      ...prev
    ])
  }

  function cancelOrder(orderId) {
    const order = orders.find((o) => o.id === orderId)
    if (!order || order.cancelled) return
    const hasReturns = returns.some((r) => r.orderId === orderId)
    if (hasReturns) {
      alert('Hóa đơn này đã có trả hàng, không thể hủy. Vui lòng liên hệ hỗ trợ nếu cần điều chỉnh.')
      return
    }
    setProducts((prev) =>
      prev.map((p) => {
        const item = order.items.find((c) => c.productId === p.id)
        return item ? { ...p, stock: p.stock + item.qty } : p
      })
    )
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, cancelled: true } : o)))
  }

  function findProductByBarcode(code) {
    const trimmed = code.trim()
    if (!trimmed) return null
    return products.find((p) => p.barcode && p.barcode === trimmed) || null
  }

  function clearCart() {
    setCart([])
  }

  function checkout(customerName, options = {}) {
    if (cart.length === 0) return null
    const { discount = 0, paymentMethod = 'cash' } = options
    const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0)
    const clampedDiscount = Math.min(Math.max(0, Number(discount) || 0), subtotal)
    const total = subtotal - clampedDiscount
    const order = {
      id: makeId(),
      items: cart,
      subtotal,
      discount: clampedDiscount,
      total,
      paymentMethod,
      customerName: (customerName || '').trim(),
      createdAt: new Date().toISOString()
    }
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
    ready,
    syncError,
    products,
    cart,
    orders,
    stockMovements,
    returns,
    debtPayments,
    settings,
    printOrder,
    requestPrint,
    closePrint,
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
    addReturn,
    addDebtPayment,
    cancelOrder,
    updateSettings,
    resetAllData
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData phải được dùng bên trong DataProvider')
  return ctx
}
