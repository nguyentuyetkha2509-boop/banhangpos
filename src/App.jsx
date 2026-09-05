import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/AuthContext'
import { DataProvider, useData } from './store/DataContext'
import AuthGate from './components/AuthGate'
import BottomNav from './components/BottomNav'
import ReceiptModal from './components/ReceiptModal'
import SalesPage from './pages/SalesPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import ReportPage from './pages/ReportPage'
import DebtPage from './pages/DebtPage'

function AppShell() {
  const { ready, syncError, printOrder, settings, closePrint } = useData()
  const { signOut } = useAuth()
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (ready) {
      setSlow(false)
      return
    }
    const timer = setTimeout(() => setSlow(true), 8000)
    return () => clearTimeout(timer)
  }, [ready])

  if (syncError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="text-center max-w-xs">
          <p className="text-sm text-red-500 mb-1">Không tải được dữ liệu</p>
          <p className="text-xs text-slate-400 mb-4">{syncError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-brand-700 text-white rounded-xl py-2.5 font-medium mb-2"
          >
            Thử lại
          </button>
          <button onClick={signOut} className="w-full bg-slate-100 text-slate-600 rounded-xl py-2.5 font-medium">
            Đăng xuất
          </button>
        </div>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <p className="text-sm text-slate-400 mb-3">Đang tải dữ liệu...</p>
          {slow && (
            <>
              <p className="text-xs text-slate-400 mb-3">
                Đang lâu hơn bình thường, kiểm tra lại kết nối mạng của bạn.
              </p>
              <button onClick={signOut} className="text-xs text-brand-700 font-medium">
                Đăng xuất và thử lại
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <div className="app-main-content flex flex-col flex-1">
        <main className="flex-1 overflow-y-auto pb-20">
          <Routes>
            <Route path="/" element={<SalesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/report" element={<ReportPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/debts" element={<DebtPage />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
      <ReceiptModal order={printOrder} settings={settings} onClose={closePrint} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate>
        <DataProvider>
          <AppShell />
        </DataProvider>
      </AuthGate>
    </AuthProvider>
  )
}
