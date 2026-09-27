import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { loadData, saveData } from '../lib/storage'
import { buildDeliveryNote, formatNumber, renderDeliveryNoteToBlob } from '../lib/deliveryNote'
import { PrintIcon, ShareIcon } from './Icons'

const RECIPIENTS_KEY = 'deliveryRecipients'

function isStandaloneApp() {
  return (
    window.navigator.standalone === true ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)
  )
}

const cell = { border: '1px solid #333', padding: '6px 8px' }
const headCell = { ...cell, background: '#f1f5f9', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }
const NOTE_WIDTH = 720

function fitScale() {
  return Math.min(1, (window.innerWidth - 8) / NOTE_WIDTH)
}

export default function DeliveryNoteModal({ order, settings, onClose }) {
  const customerName = (order.customerName || '').trim()
  const [recipient, setRecipient] = useState(() => {
    const saved = customerName ? loadData(RECIPIENTS_KEY, {})[customerName] : null
    return { name: customerName || 'Khách lẻ', address: saved?.address || '', phone: saved?.phone || '', note: '' }
  })
  const [sharing, setSharing] = useState(false)
  const [scale, setScale] = useState(fitScale)

  useEffect(() => {
    const onResize = () => setScale(fitScale())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const note = useMemo(() => buildDeliveryNote(order, settings, recipient), [order, settings, recipient])

  function update(field, value) {
    setRecipient((prev) => ({ ...prev, [field]: value }))
  }

  function rememberRecipient() {
    const name = recipient.name.trim()
    if (!name || name === 'Khách lẻ') return
    const all = loadData(RECIPIENTS_KEY, {})
    all[name] = { address: recipient.address.trim(), phone: recipient.phone.trim() }
    saveData(RECIPIENTS_KEY, all)
  }

  function handlePrint() {
    rememberRecipient()
    if (isStandaloneApp()) {
      alert(
        'In trực tiếp không hoạt động khi mở app từ icon màn hình chính (giới hạn của iOS/Android khi chạy như app riêng).\n\nCách khắc phục: bấm "Chia sẻ ảnh biên bản" rồi in ảnh đó, hoặc mở link app bằng trình duyệt (Safari/Chrome) thường để in trực tiếp.'
      )
      return
    }
    window.print()
  }

  async function handleShare() {
    if (sharing) return
    rememberRecipient()
    setSharing(true)
    try {
      const blob = await renderDeliveryNoteToBlob(note)
      const fileName = `bien-ban-giao-hang-${note.code}.png`
      const file = new File([blob], fileName, { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Biên bản giao nhận hàng' })
        } catch {
          // Nguoi dung huy chia se
        }
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setSharing(false)
    }
  }

  const inputClass =
    'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'

  return createPortal(
    <div className="delivery-print-wrapper fixed inset-0 z-50 flex flex-col bg-white">
      <div className="no-print p-3 border-b border-slate-100">
        <div className="flex gap-2 mb-2">
          <button onClick={onClose} className="flex-1 rounded-lg bg-brand-50 text-brand-700 text-sm font-semibold py-2.5">
            ← Quay lại
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-brand-700 text-white text-sm font-semibold py-2.5"
          >
            <PrintIcon className="h-5 w-5" />
            In
          </button>
        </div>
        <button
          onClick={handleShare}
          disabled={sharing}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-semibold py-2.5 mb-3 disabled:opacity-50"
        >
          {sharing ? null : <ShareIcon className="h-5 w-5" />}
          {sharing ? 'Đang tạo ảnh...' : 'Chia sẻ ảnh biên bản'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={recipient.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="Tên bên nhận hàng"
            className={`${inputClass} col-span-2`}
          />
          <input
            value={recipient.address}
            onChange={(e) => update('address', e.target.value)}
            placeholder="Địa chỉ bên nhận"
            className={`${inputClass} col-span-2`}
          />
          <input
            value={recipient.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="Điện thoại"
            inputMode="tel"
            className={inputClass}
          />
          <input
            value={recipient.note}
            onChange={(e) => update('note', e.target.value)}
            placeholder="Ghi chú"
            className={inputClass}
          />
        </div>
      </div>

      <div className="delivery-print-scroll flex-1 overflow-auto">
        <div
          className="delivery-print-area mx-auto my-4 px-4 box-border"
          style={{
            width: NOTE_WIDTH,
            zoom: scale,
            color: '#111',
            fontFamily: 'Arial, "Helvetica Neue", sans-serif',
            fontSize: 13
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>BIÊN BẢN GIAO NHẬN HÀNG</p>
            <p style={{ margin: '4px 0 0', color: '#333' }}>
              {note.code}&nbsp;&nbsp;&nbsp;&nbsp;Ngày {note.date}
            </p>
          </div>

          <p style={{ margin: '2px 0' }}>
            <b>{note.shopName.toUpperCase()}</b>
            {note.shopPhone && <>&nbsp;&nbsp;&nbsp;SĐT: {note.shopPhone}</>}
          </p>
          {note.shopAddress && <p style={{ margin: '2px 0' }}>Địa chỉ: {note.shopAddress}</p>}
          {note.bankInfo && <p style={{ margin: '2px 0' }}>Tài khoản: {note.bankInfo}</p>}

          <p style={{ margin: '10px 0 2px' }}>
            <b>Bên nhận hàng: {note.recipientName}</b>
          </p>
          <p style={{ margin: '2px 0' }}>Địa chỉ: {note.recipientAddress}</p>
          <p style={{ margin: '2px 0 10px' }}>Điện thoại: {note.recipientPhone}</p>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...headCell, width: 40 }}>STT</th>
                <th style={headCell}>Tên hàng</th>
                <th style={{ ...headCell, width: 80 }}>Số lượng</th>
                <th style={{ ...headCell, width: 90 }}>Đơn giá</th>
                <th style={{ ...headCell, width: 100 }}>Thành tiền</th>
                <th style={{ ...headCell, width: 90 }}>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {note.items.map((item) => (
                <tr key={item.stt}>
                  <td style={{ ...cell, textAlign: 'center' }}>{item.stt}</td>
                  <td style={cell}>{item.name}</td>
                  <td style={{ ...cell, textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ ...cell, textAlign: 'right' }}>{formatNumber(item.price)}</td>
                  <td style={{ ...cell, textAlign: 'right' }}>{formatNumber(item.total)}</td>
                  <td style={cell} />
                </tr>
              ))}
            </tbody>
          </table>

          <table style={{ width: '100%', marginTop: 8, fontWeight: 700 }}>
            <tbody>
              {note.discount > 0 && (
                <tr>
                  <td style={{ textAlign: 'right', padding: '4px 8px' }}>Cộng tiền hàng</td>
                  <td style={{ textAlign: 'right', padding: '4px 8px', width: 110 }}>{formatNumber(note.subtotal)}</td>
                  <td style={{ width: 90 }} />
                </tr>
              )}
              {note.discount > 0 && (
                <tr>
                  <td style={{ textAlign: 'right', padding: '4px 8px' }}>
                    Chiết khấu (giảm giá) hóa đơn{note.discountPercent ? ` (${note.discountPercent}%)` : ''}
                  </td>
                  <td style={{ textAlign: 'right', padding: '4px 8px' }}>{formatNumber(note.discount)}</td>
                  <td />
                </tr>
              )}
              <tr>
                <td style={{ textAlign: 'right', padding: '4px 8px' }}>Tổng tiền thanh toán</td>
                <td style={{ textAlign: 'right', padding: '4px 8px', width: 110 }}>{formatNumber(note.total)}</td>
                <td style={{ width: 90 }} />
              </tr>
            </tbody>
          </table>

          <p style={{ margin: '10px 0 24px' }}>
            <b>Ghi chú:</b> {note.note}
          </p>

          <div style={{ display: 'flex', textAlign: 'center', paddingBottom: 80 }}>
            {['THỦ KHO', 'NGƯỜI GIAO HÀNG', 'NGƯỜI NHẬN HÀNG'].map((label) => (
              <div key={label} style={{ flex: 1 }}>
                <p style={{ margin: 0 }}>{label}</p>
                <p style={{ margin: '2px 0 0', fontSize: 11, color: '#666' }}>(Ký, ghi rõ họ tên)</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
