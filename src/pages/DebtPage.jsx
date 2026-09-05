import React, { useMemo, useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'
import DebtPaymentSheet from '../components/DebtPaymentSheet'

const PAYMENT_LABELS = { cash: 'Tiền mặt', transfer: 'Chuyển khoản' }

function customerKeyOf(name) {
  return (name || '').trim() || 'Khách lẻ'
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export default function DebtPage() {
  const { orders, debtPayments, settings } = useData()
  const [expanded, setExpanded] = useState(null)
  const [payingCustomer, setPayingCustomer] = useState(null)
  const [exporting, setExporting] = useState(false)

  const debtCustomers = useMemo(() => {
    const map = new Map()
    orders.forEach((o) => {
      if (o.cancelled || o.paymentMethod !== 'debt') return
      const key = customerKeyOf(o.customerName)
      const cur = map.get(key) || { name: key, owed: 0, paid: 0, debtOrders: [] }
      cur.owed += o.total
      cur.debtOrders.push(o)
      map.set(key, cur)
    })
    debtPayments.forEach((p) => {
      const key = customerKeyOf(p.customerName)
      const cur = map.get(key) || { name: key, owed: 0, paid: 0, debtOrders: [] }
      cur.paid += p.amount
      map.set(key, cur)
    })
    return Array.from(map.values())
      .map((c) => ({
        ...c,
        balance: c.owed - c.paid,
        payments: debtPayments.filter((p) => customerKeyOf(p.customerName) === c.name)
      }))
      .sort((a, b) => b.balance - a.balance)
  }, [orders, debtPayments])

  const totalOutstanding = debtCustomers.reduce((sum, c) => sum + Math.max(0, c.balance), 0)

  async function handleExport() {
    setExporting(true)
    try {
      const { exportDebtsToExcel } = await import('../lib/exportExcel')
      exportDebtsToExcel({ debtCustomers, settings })
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-4 pb-6">
      <h1 className="text-xl font-bold text-slate-800 mb-1">Công nợ</h1>
      <p className="text-sm text-slate-500 mb-3">
        Tổng đang nợ: <span className="font-semibold text-amber-600">{formatVND(totalOutstanding)}</span>
      </p>

      <button
        onClick={handleExport}
        disabled={exporting || debtCustomers.length === 0}
        className="w-full bg-brand-50 text-brand-700 text-sm font-medium rounded-lg py-2.5 mb-3 disabled:opacity-40 active:scale-[0.98] transition"
      >
        {exporting ? 'Đang xuất...' : '📊 Xuất Excel công nợ'}
      </button>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {debtCustomers.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-10">Chưa có khách nào mua ghi nợ</p>
        )}
        {debtCustomers.map((c, idx) => {
          const isExpanded = expanded === c.name
          const paidOff = c.balance <= 0
          return (
            <div key={c.name} className={idx > 0 ? 'border-t border-slate-100' : ''}>
              <button
                onClick={() => setExpanded(isExpanded ? null : c.name)}
                className="w-full flex items-center justify-between px-3 py-3"
              >
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {c.name}
                    {paidOff && (
                      <span className="ml-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 rounded-full px-1.5 py-0.5">
                        Đã trả hết
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{c.debtOrders.length} hóa đơn ghi nợ</p>
                </div>
                <span className={`font-bold shrink-0 ${paidOff ? 'text-slate-400' : 'text-amber-600'}`}>
                  {formatVND(Math.max(0, c.balance))}
                </span>
              </button>
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50 px-3 py-2">
                  <h3 className="text-xs font-semibold text-slate-500 mb-1.5">Hóa đơn ghi nợ</h3>
                  <ul className="space-y-1.5 mb-3">
                    {c.debtOrders.map((o) => (
                      <li key={o.id} className="flex items-center justify-between text-sm bg-white rounded-lg border border-slate-100 px-2.5 py-1.5">
                        <span className="text-slate-500 text-xs">#{o.id.slice(-6).toUpperCase()} · {formatDateTime(o.createdAt)}</span>
                        <span className="font-medium text-slate-800">{formatVND(o.total)}</span>
                      </li>
                    ))}
                  </ul>
                  {c.payments.length > 0 && (
                    <>
                      <h3 className="text-xs font-semibold text-slate-500 mb-1.5">Đã thu</h3>
                      <ul className="space-y-1.5 mb-3">
                        {c.payments.map((p) => (
                          <li key={p.id} className="flex items-center justify-between text-sm bg-white rounded-lg border border-slate-100 px-2.5 py-1.5">
                            <span className="text-slate-500 text-xs">
                              {formatDateTime(p.createdAt)} · {PAYMENT_LABELS[p.paymentMethod] || 'Tiền mặt'}
                              {p.note ? ` · ${p.note}` : ''}
                            </span>
                            <span className="font-medium text-emerald-600">+{formatVND(p.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {!paidOff && (
                    <button
                      onClick={() => setPayingCustomer(c)}
                      className="w-full bg-brand-700 text-white text-sm font-medium rounded-lg py-2.5 active:scale-[0.98] transition"
                    >
                      💰 Thu nợ
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <DebtPaymentSheet
        open={Boolean(payingCustomer)}
        onClose={() => setPayingCustomer(null)}
        customerName={payingCustomer?.name}
        balance={payingCustomer?.balance}
      />
    </div>
  )
}
