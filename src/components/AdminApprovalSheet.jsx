import React, { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, doc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

export default function AdminApprovalSheet({ open, onClose }) {
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [approvingId, setApprovingId] = useState(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const q = query(collection(db, 'shops'), where('approved', '==', false))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPending(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [open])

  if (!open) return null

  async function handleApprove(uid) {
    setApprovingId(uid)
    try {
      await setDoc(doc(db, 'shops', uid), { approved: true }, { merge: true })
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white rounded-t-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Duyệt tài khoản mới</h2>
          <button onClick={onClose} className="text-slate-400 text-sm">Đóng</button>
        </div>

        {loading && <p className="text-center text-sm text-slate-400 py-8">Đang tải...</p>}
        {!loading && pending.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Không có tài khoản nào đang chờ duyệt</p>
        )}
        <ul className="space-y-2">
          {pending.map((p) => (
            <li key={p.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2.5">
              <span className="text-sm text-slate-700 truncate mr-2">{p.accountEmail || p.id}</span>
              <button
                onClick={() => handleApprove(p.id)}
                disabled={approvingId === p.id}
                className="shrink-0 bg-brand-700 text-white text-xs font-medium rounded-lg px-3 py-2 disabled:opacity-50"
              >
                {approvingId === p.id ? 'Đang duyệt...' : 'Duyệt'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
