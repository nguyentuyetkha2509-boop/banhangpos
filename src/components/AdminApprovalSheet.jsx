import React, { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { formatVND } from '../lib/storage'
import { ExportIcon } from './Icons'

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AdminApprovalSheet({ open, onClose }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [exportingId, setExportingId] = useState(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const unsub = onSnapshot(
      collection(db, 'shops'),
      (snap) => {
        setAccounts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [open])

  const sorted = useMemo(() => {
    return [...accounts].sort((a, b) => {
      if (a.approved === false && b.approved !== false) return -1
      if (a.approved !== false && b.approved === false) return 1
      return (a.accountEmail || '').localeCompare(b.accountEmail || '')
    })
  }, [accounts])

  if (!open) return null

  async function handleApprove(uid) {
    setApprovingId(uid)
    try {
      await setDoc(doc(db, 'shops', uid), { approved: true }, { merge: true })
    } catch {
      alert('Duyệt thất bại, kiểm tra lại kết nối mạng và thử lại.')
    } finally {
      setApprovingId(null)
    }
  }

  async function handleExport(acc) {
    setExportingId(acc.id)
    try {
      const { exportDataToExcel } = await import('../lib/exportExcel')
      exportDataToExcel({
        products: acc.products || [],
        orders: acc.orders || [],
        stockMovements: acc.stockMovements || [],
        returns: acc.returns || [],
        debtPayments: acc.debtPayments || [],
        settings: acc.settings || {}
      })
    } finally {
      setExportingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Quản lý tài khoản</h2>
          <button onClick={onClose} className="text-slate-400 text-sm">Đóng</button>
        </div>

        {loading && <p className="text-center text-sm text-slate-400 py-8">Đang tải...</p>}
        {!loading && sorted.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Chưa có tài khoản nào</p>
        )}
        <ul className="space-y-2">
          {sorted.map((acc) => {
            const isPending = acc.approved === false
            const isExpanded = expandedId === acc.id
            const orders = (acc.orders || []).filter((o) => !o.cancelled)
            const revenue = orders.reduce((sum, o) => sum + o.total, 0)
            const lastOrder = orders[0]
            return (
              <li key={acc.id} className="bg-slate-50 rounded-lg overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : acc.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5"
                >
                  <span className="text-sm text-slate-700 truncate mr-2 text-left">
                    {acc.accountEmail || acc.id}
                    {isPending && (
                      <span className="ml-1.5 text-[11px] font-semibold text-amber-600 bg-amber-50 rounded-full px-1.5 py-0.5">
                        Chờ duyệt
                      </span>
                    )}
                  </span>
                  {isPending ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleApprove(acc.id)
                      }}
                      disabled={approvingId === acc.id}
                      className="shrink-0 bg-brand-700 text-white text-xs font-medium rounded-lg px-3 py-2 disabled:opacity-50"
                    >
                      {approvingId === acc.id ? 'Đang duyệt...' : 'Duyệt'}
                    </button>
                  ) : (
                    <span className="shrink-0 text-xs text-slate-400">{isExpanded ? '▲' : '▼'}</span>
                  )}
                </button>
                {isExpanded && !isPending && (
                  <div className="border-t border-slate-100 bg-white px-3 py-2.5 text-sm">
                    <p className="text-slate-500 mb-1">
                      Cửa hàng: <span className="font-medium text-slate-800">{acc.settings?.shopName || '—'}</span>
                    </p>
                    <p className="text-slate-500 mb-1">
                      Sản phẩm: <span className="font-medium text-slate-800">{(acc.products || []).length}</span> · Hóa đơn:{' '}
                      <span className="font-medium text-slate-800">{orders.length}</span>
                    </p>
                    <p className="text-slate-500 mb-1">
                      Doanh thu (chưa trừ trả hàng): <span className="font-medium text-slate-800">{formatVND(revenue)}</span>
                    </p>
                    <p className="text-slate-500 mb-3">
                      Hoạt động gần nhất: <span className="font-medium text-slate-800">{lastOrder ? formatDateTime(lastOrder.createdAt) : 'Chưa có hóa đơn'}</span>
                    </p>
                    <button
                      onClick={() => handleExport(acc)}
                      disabled={exportingId === acc.id}
                      className="w-full flex items-center justify-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-medium rounded-lg py-2.5 disabled:opacity-50"
                    >
                      {exportingId === acc.id ? null : <ExportIcon className="h-4 w-4" />}
                      {exportingId === acc.id ? 'Đang xuất...' : 'Xuất Excel dữ liệu tài khoản này'}
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
