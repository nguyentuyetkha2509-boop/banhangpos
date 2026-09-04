import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { DataProvider, useData } from './store/DataContext'
import BottomNav from './components/BottomNav'
import ReceiptModal from './components/ReceiptModal'
import SalesPage from './pages/SalesPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import ReportPage from './pages/ReportPage'

function AppShell() {
  const { printOrder, settings, closePrint } = useData()

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <main className="flex-1 overflow-y-auto pb-20">
        <Routes>
          <Route path="/" element={<SalesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/orders" element={<OrdersPage />} />
        </Routes>
      </main>
      <BottomNav />
      <ReceiptModal order={printOrder} settings={settings} onClose={closePrint} />
    </div>
  )
}

export default function App() {
  return (
    <DataProvider>
      <AppShell />
    </DataProvider>
  )
}
