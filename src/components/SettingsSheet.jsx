import React, { useEffect, useState } from 'react'
import { useData } from '../store/DataContext'

export default function SettingsSheet({ open, onClose }) {
  const { settings, updateSettings } = useData()
  const [shopName, setShopName] = useState('')
  const [shopAddress, setShopAddress] = useState('')

  useEffect(() => {
    if (open) {
      setShopName(settings.shopName || '')
      setShopAddress(settings.shopAddress || '')
    }
  }, [open, settings.shopName, settings.shopAddress])

  if (!open) return null

  function handleSubmit(e) {
    e.preventDefault()
    const trimmedName = shopName.trim()
    if (!trimmedName) return
    updateSettings({ shopName: trimmedName, shopAddress: shopAddress.trim() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-t-2xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-bold text-slate-800 mb-3">Cài đặt cửa hàng</h2>

        <label className="block text-xs font-medium text-slate-500 mb-1">Tên cửa hàng</label>
        <input
          autoFocus
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="VD: Tạp hóa Minh Anh"
        />
        <p className="text-xs text-slate-400 mb-4">Tên này sẽ hiện trên hóa đơn khi in</p>

        <label className="block text-xs font-medium text-slate-500 mb-1">Địa chỉ (tùy chọn)</label>
        <input
          value={shopAddress}
          onChange={(e) => setShopAddress(e.target.value)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-1 focus:outline-none focus:ring-2 focus:ring-brand-400"
          placeholder="VD: 123 Lê Lợi, Q.1, TP.HCM"
        />
        <p className="text-xs text-slate-400 mb-4">Địa chỉ sẽ hiện dưới tên cửa hàng trên hóa đơn</p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl py-3 font-medium text-slate-600 bg-slate-100"
          >
            Hủy
          </button>
          <button type="submit" className="flex-1 rounded-xl py-3 font-medium text-white bg-brand-700">
            Lưu
          </button>
        </div>
      </form>
    </div>
  )
}
