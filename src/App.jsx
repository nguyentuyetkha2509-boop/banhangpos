import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { DataProvider } from './store/DataContext'
import BottomNav from './components/BottomNav'
import SalesPage from './pages/SalesPage'
import ProductsPage from './pages/ProductsPage'
import OrdersPage from './pages/OrdersPage'
import ReportPage from './pages/ReportPage'

export default function App() {
  return (
    <DataProvider>
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
      </div>
    </DataProvider>
  )
}
