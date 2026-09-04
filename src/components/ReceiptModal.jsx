import React from 'react'
import { formatVND } from '../lib/storage'

const DEFAULT_SHOP_NAME = 'Bán Hàng POS'

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export default function ReceiptModal({ order, settings, onClose }) {
  if (!order) return null

  const shopName = settings?.shopName || DEFAULT_SHOP_NAME
  const shopAddress = settings?.shopAddress

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="no-print flex gap-2 p-3 border-b border-slate-100">
        <button
          onClick={onClose}
          className="flex-1 rounded-lg bg-brand-50 text-brand-700 text-sm font-semibold py-2.5"
        >
          ← Quay lại
        </button>
        <button
          onClick={() => window.print()}
          className="flex-1 rounded-lg bg-brand-700 text-white text-sm font-semibold py-2.5"
        >
          🖨️ In
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div
          className="receipt-print-area mx-auto my-4"
          style={{ width: 300, fontFamily: "'Courier New', Courier, monospace", color: '#111' }}
        >
          <div className="text-center">
            <p className="font-bold" style={{ fontSize: 18 }}>{shopName}</p>
            {shopAddress && <p style={{ fontSize: 12, color: '#333', margin: '2px 0' }}>{shopAddress}</p>}
            <p style={{ fontSize: 12, color: '#333', margin: '2px 0' }}>Hóa đơn bán hàng</p>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '10px 0' }} />

          <p style={{ fontSize: 12, color: '#333', margin: '2px 0' }}>
            Mã hóa đơn: #{order.id.slice(-6).toUpperCase()}
          </p>
          <p style={{ fontSize: 12, color: '#333', margin: '2px 0' }}>
            Thời gian: {formatDateTime(order.createdAt)}
          </p>

          <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '10px 0' }} />

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <tbody>
              {order.items.map((item) => (
                <React.Fragment key={item.productId}>
                  <tr>
                    <td colSpan={2} style={{ paddingTop: 6 }}>{item.name}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#444' }}>{item.qty} x {formatVND(item.price)}</td>
                    <td style={{ textAlign: 'right' }}>{formatVND(item.qty * item.price)}</td>
                  </tr>
                </React.Fragment>
              ))}
              <tr>
                <td style={{ paddingTop: 10, fontSize: 15, fontWeight: 700 }}>Tổng cộng</td>
                <td style={{ paddingTop: 10, fontSize: 15, fontWeight: 700, textAlign: 'right' }}>
                  {formatVND(order.total)}
                </td>
              </tr>
            </tbody>
          </table>

          <hr style={{ border: 'none', borderTop: '1px dashed #999', margin: '10px 0' }} />

          <p className="text-center" style={{ fontSize: 12 }}>Cảm ơn quý khách!</p>
        </div>
      </div>
    </div>
  )
}
