import React from 'react'
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', label: 'Bán hàng', icon: '🛒' },
  { to: '/products', label: 'Sản phẩm', icon: '📦' },
  { to: '/report', label: 'Báo cáo', icon: '📊' },
  { to: '/orders', label: 'Hóa đơn', icon: '🧾' }
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto grid grid-cols-4">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2.5 text-xs font-medium ${
                isActive ? 'text-brand-700' : 'text-slate-400'
              }`
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
