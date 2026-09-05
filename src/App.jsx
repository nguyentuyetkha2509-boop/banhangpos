import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './store/AuthContext'
import { DataProvider, useData } from './store/DataContext'
import AuthGate from './components/AuthGate'
import BottomNav from './components/BottomNav'
import ReceiptModal from './components/ReceiptModal'
import SalesPage from './pages/SalesPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import ReportPage from './pages/ReportPage'

function AppShell() {
  const { ready, printOrder, settings, closePrint } = useData()

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>
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
