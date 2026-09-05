import React from 'react'
import { NavLink } from 'react-router-dom'
import { CartIcon, BoxIcon, ChartIcon, ReceiptIcon, WalletIcon } from './Icons'

const items = [
  { to: '/', label: 'Bán hàng', Icon: CartIcon },
  { to: '/products', label: 'Sản phẩm', Icon: BoxIcon },
  { to: '/report', label: 'Báo cáo', Icon: ChartIcon },
  { to: '/orders', label: 'Hóa đơn', Icon: ReceiptIcon },
  { to: '/debts', label: 'Công nợ', Icon: WalletIcon }
]

export default function BottomNav() {
  return (
    <nav className="no-print fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-100 shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
      <div className="max-w-md mx-auto grid grid-cols-5 px-1 py-2">
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex flex-col items-center justify-center gap-1 py-1 active:scale-95 transition-transform"
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex items-center justify-center h-12 w-12 rounded-2xl transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  <Icon className="h-7 w-7" />
                </span>
                <span
                  className={`text-[12px] leading-none whitespace-nowrap ${
                    isActive ? 'font-bold text-brand-700' : 'font-medium text-slate-400'
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
