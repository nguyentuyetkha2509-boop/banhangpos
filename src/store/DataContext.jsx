import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore'
import { db, OWNER_EMAIL } from '../lib/firebase'
import { useAuth } from './AuthContext'
import { loadData, saveData, makeId } from '../lib/storage'
import { DATA_COLLECTIONS, emptyLegacyArrays, hasLegacyArrays, sortRecords } from '../lib/shopData'

const DEFAULT_PRODUCTS = [
  { id: makeId(), name: 'Coca Cola lon', price: 12000, costPrice: 0, stock: 48, category: 'Nước giải khát', barcode: '8934588123451' },
  { id: makeId(), name: 'Mì tôm Hảo Hảo', price: 4500, costPrice: 0, stock: 100, category: 'Thực phẩm', barcode: '8934588123468' },
  { id: makeId(), name: 'Bánh mì sandwich', price: 20000, costPrice: 0, stock: 15, category: 'Đồ ăn', barcode: '' },
  { id: makeId(), name: 'Nước suối Lavie 500ml', price: 6000, costPrice: 0, stock: 60, category: 'Nước giải khát', barcode: '8934588123475' },
  { id: makeId(), name: 'Cà phê sữa đá', price: 18000, costPrice: 0, stock: 30, category: 'Đồ uống', barcode: '' }
]

const DEFAULT_SETTINGS = { shopName: 'Bán Hàng POS', shopAddress: '' }

// Firestore gioi han 500 thao tac/batch
const BATCH_LIMIT = 400

const DataContext = createContext(null)

// Luu tru co 2 che do:
// - 'v2': moi ban ghi (san pham, hoa don...) la 1 document rieng trong subcollection
//   shops/{uid}/{ten}, tranh gioi han 1MB/document cua Firestore va chi ghi phan thay doi.
// - 'legacy': toan bo du lieu nam trong mang cua document shops/{uid} (cach cu). Chi dung
//   khi Firestore rules chua cho phep subcollection, de app khong bi hong.
export function DataProvider({ children }) {
  const { user } = useAuth()
  const uid = user.uid
  const docRef = useMemo(() => doc(db, 'shops', uid), [uid])
  const lastRemoteRef = useRef({})
  const modeRef = useRef(null)
  const migratingRef = useRef(false)
  const lastSyncedRef = useRef({})

  const [ready, setReady] = useState(false)
  const [approved, setApproved] = useState(true)
  const [syncError, setSyncError] = useState(null)
  const [storageMode, setStorageMode] = useState(null)
  const [loadedCollections, setLoadedCollections] = useState({})
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [stockMovements, setStockMovements] = useState([])
  const [returns, setReturns] = useState([])
  const [shrinkages, setShrinkages] = useState([])
  const [debtPayments, setDebtPayments] = useState([])
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [cart, setCart] = useState(() => loadData('cart', []))
  const [printOrder, setPrintOrder] = useState(null)

  const records = { products, orders, stockMovements, returns, shrinkages, debtPayments }
  const settersRef = useRef({})
  settersRef.current = {
    products: setProducts,
    orders: setOrders,
    stockMovements: setStockMovements,
    returns: setReturns,
    shrinkages: setShrinkages,
    debtPayments: setDebtPayments
  }

  useEffect(() => {
    let active = true
    setReady(false)
    setSyncError(null)
    setStorageMode(null)
    setLoadedCollections({})
    modeRef.current = null
    migratingRef.current = false
    lastSyncedRef.current = {}

    function switchMode(mode) {
      modeRef.current = mode
      setStorageMode(mode)
    }

    function applyLegacy(data) {
      setProducts(data.products ?? DEFAULT_PRODUCTS)
      setOrders(data.orders ?? [])
      setStockMovements(data.stockMovements ?? [])
      setReturns(data.returns ?? [])
      setShrinkages(data.shrinkages ?? [])
      setDebtPayments(data.debtPayments ?? [])
      setReady(true)
    }

    async function canUseSubcollections() {
      try {
        await getDocs(query(collection(docRef, 'products'), limit(1)))
        return true
      } catch {
        return false
      }
    }

    async function migrateLegacy(data) {
      const ops = []
      DATA_COLLECTIONS.forEach((name) => {
        if (!Array.isArray(data[name])) return
        data[name].forEach((item, idx) => {
          if (!item) return
          const id = item.id || makeId()
          const payload = { ...item, id }
          if (name === 'products' && payload.position == null) payload.position = idx
          ops.push([name, id, payload])
        })
      })
      for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db)
        ops.slice(i, i + BATCH_LIMIT).forEach(([name, id, payload]) => batch.set(doc(docRef, name, id), payload))
        await batch.commit()
      }
      // Chi don mang cu sau khi da ghi xong toan bo sang subcollection
      await updateDoc(docRef, { storageVersion: 2, ...emptyLegacyArrays() })
    }

    const unsub = onSnapshot(
      docRef,
      async (snap) => {
        if (!active) return

        if (!snap.exists()) {
          if (modeRef.current) return
          const base = {
            settings: loadData('settings', DEFAULT_SETTINGS),
            approved: user.email === OWNER_EMAIL,
            accountEmail: user.email
          }
          const v2 = await canUseSubcollections()
          if (!active) return
          setSettings(base.settings)
          setApproved(base.approved)
          if (v2) {
            lastRemoteRef.current = base
            switchMode('v2')
            try {
              await setDoc(docRef, { ...base, storageVersion: 2, ...emptyLegacyArrays() })
            } catch (err) {
              setSyncError(err.message)
            }
          } else {
            const initial = { ...base, products: DEFAULT_PRODUCTS, orders: [], stockMovements: [], returns: [], shrinkages: [], debtPayments: [] }
            lastRemoteRef.current = initial
            switchMode('legacy')
            applyLegacy(initial)
            try {
              await setDoc(docRef, initial)
            } catch (err) {
              setSyncError(err.message)
            }
          }
          return
        }

        const data = snap.data()
        lastRemoteRef.current = data
        setSettings(data.settings ?? DEFAULT_SETTINGS)
        setApproved(data.approved !== false)

        if (modeRef.current === 'legacy') {
          applyLegacy(data)
          return
        }

        if (hasLegacyArrays(data)) {
          if (migratingRef.current) return
          migratingRef.current = true
          const v2 = modeRef.current === 'v2' || (await canUseSubcollections())
          let migrated = false
          if (v2 && active) {
            try {
              await migrateLegacy(data)
              migrated = true
            } catch {
              migrated = false
            }
          }
          migratingRef.current = false
          if (!active) return
          if (!migrated && modeRef.current !== 'v2') {
            switchMode('legacy')
            applyLegacy(data)
            return
          }
        }

        if (modeRef.current !== 'v2') switchMode('v2')
      },
      (err) => setSyncError(err.message)
    )
    return () => {
      active = false
      unsub()
    }
  }, [docRef])

  useEffect(() => {
    if (storageMode !== 'v2') return
    const unsubs = DATA_COLLECTIONS.map((name) =>
      onSnapshot(
        collection(docRef, name),
        (snap) => {
          const list = sortRecords(
            name,
            snap.docs.map((d) => ({ id: d.id, ...d.data() }))
          )
          lastSyncedRef.current[name] = list
          settersRef.current[name](list)
          setLoadedCollections((prev) => (prev[name] ? prev : { ...prev, [name]: true }))
        },
        (err) => setSyncError(err.message)
      )
    )
    return () => unsubs.forEach((unsub) => unsub())
  }, [storageMode, docRef])

  useEffect(() => {
    if (storageMode === 'v2' && DATA_COLLECTIONS.every((name) => loadedCollections[name])) setReady(true)
  }, [storageMode, loadedCollections])

  // Che do v2: so sanh voi lan dong bo truoc, chi ghi cac ban ghi them/sua/xoa
  useEffect(() => {
    if (storageMode !== 'v2') return
    DATA_COLLECTIONS.forEach((name) => {
      if (!loadedCollections[name]) return
      const next = records[name]
      const prev = lastSyncedRef.current[name] || []
      if (next === prev) return
      lastSyncedRef.current[name] = next
      const prevById = new Map(prev.map((r) => [r.id, r]))
      const nextIds = new Set()
      const ops = []
      next.forEach((r) => {
        nextIds.add(r.id)
        if (prevById.get(r.id) !== r) ops.push(['set', r])
      })
      prev.forEach((r) => {
        if (!nextIds.has(r.id)) ops.push(['delete', r])
      })
      for (let i = 0; i < ops.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db)
        ops.slice(i, i + BATCH_LIMIT).forEach(([op, r]) => {
          const ref = doc(docRef, name, r.id)
          if (op === 'set') batch.set(ref, r)
          else batch.delete(ref)
        })
        batch.commit().catch((err) => setSyncError(err.message))
      }
    })
  }, [storageMode, loadedCollections, products, orders, stockMovements, returns, shrinkages, debtPayments, docRef])

  useEffect(() => saveData('cart', cart), [cart])

  // Che do legacy: ghi ca mang vao document chinh nhu truoc day
  useEffect(() => {
    if (storageMode !== 'legacy' || !ready) return
    const patch = {}
    DATA_COLLECTIONS.forEach((name) => {
      if (records[name] !== lastRemoteRef.current[name]) patch[name] = records[name]
    })
    if (Object.keys(patch).length > 0) setDoc(docRef, patch, { merge: true })
  }, [storageMode, ready, products, orders, stockMovements, returns, shrinkages, debtPayments, docRef])

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
    setProducts((prev) => [...prev, { ...product, id: makeId(), position: Date.now() }])
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
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          originalPrice: product.price,
          costPrice: product.costPrice || 0,
          qty: 1
        }
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

  function setCartItemPrice(productId, price) {
    const newPrice = Math.max(0, Number(price) || 0)
    setCart((prev) => prev.map((c) => (c.productId === productId ? { ...c, price: newPrice } : c)))
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

  function updateStockMovement(movementId, { qty, costPrice, sellPrice, note }) {
    const movement = stockMovements.find((m) => m.id === movementId)
    if (!movement) return
    const newQty = Math.max(0, Number(qty) || 0)
    if (newQty <= 0) return
    const delta = newQty - movement.qty
    const resolvedCost = costPrice === '' || costPrice == null ? movement.costPrice || 0 : Math.max(0, Number(costPrice) || 0)
    const resolvedSell = sellPrice === '' || sellPrice == null ? movement.sellPrice || 0 : Math.max(0, Number(sellPrice) || 0)
    const isLatestForProduct = stockMovements.find((m) => m.productId === movement.productId)?.id === movementId
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== movement.productId) return p
        const next = { ...p, stock: Math.max(0, p.stock + delta) }
        if (isLatestForProduct) {
          next.costPrice = resolvedCost
          next.price = resolvedSell
        }
        return next
      })
    )
    setStockMovements((prev) =>
      prev.map((m) =>
        m.id === movementId
          ? { ...m, qty: newQty, costPrice: resolvedCost, sellPrice: resolvedSell, note: (note || '').trim() }
          : m
      )
    )
  }

  function deleteStockMovement(movementId) {
    const movement = stockMovements.find((m) => m.id === movementId)
    if (!movement) return
    setProducts((prev) =>
      prev.map((p) => (p.id === movement.productId ? { ...p, stock: Math.max(0, p.stock - movement.qty) } : p))
    )
    setStockMovements((prev) => prev.filter((m) => m.id !== movementId))
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

  function addShrinkage(productId, qty, reason, note) {
    const lostQty = Math.max(0, Number(qty) || 0)
    if (lostQty <= 0) return
    const product = products.find((p) => p.id === productId)
    if (!product) return
    const cost = product.costPrice || 0
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: Math.max(0, p.stock - lostQty) } : p))
    )
    setShrinkages((prev) => [
      {
        id: makeId(),
        productId,
        productName: product.name,
        qty: lostQty,
        costPrice: cost,
        value: cost * lostQty,
        reason: reason || 'Khác',
        note: (note || '').trim(),
        createdAt: new Date().toISOString()
      },
      ...prev
    ])
  }

  function deleteShrinkage(shrinkageId) {
    const shrinkage = shrinkages.find((s) => s.id === shrinkageId)
    if (!shrinkage) return
    setProducts((prev) =>
      prev.map((p) => (p.id === shrinkage.productId ? { ...p, stock: p.stock + shrinkage.qty } : p))
    )
    setShrinkages((prev) => prev.filter((s) => s.id !== shrinkageId))
  }

  function resetAllData() {
    setProducts([])
    setOrders([])
    setStockMovements([])
    setReturns([])
    setShrinkages([])
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
    approved,
    syncError,
    products,
    cart,
    orders,
    stockMovements,
    returns,
    shrinkages,
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
    setCartItemPrice,
    removeFromCart,
    clearCart,
    checkout,
    findProductByBarcode,
    restockProduct,
    updateStockMovement,
    deleteStockMovement,
    addReturn,
    addShrinkage,
    deleteShrinkage,
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
