import React, { useEffect, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'

const REGION_ID = 'barcode-scanner-region'

export default function BarcodeScannerModal({ open, onClose, onDetected }) {
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setError('')
    const scanner = new Html5Qrcode(REGION_ID, { useBarCodeDetectorIfSupported: false, verbose: false })

    function safeStop() {
      if (scanner.getState() === Html5QrcodeScannerState.SCANNING || scanner.getState() === Html5QrcodeScannerState.PAUSED) {
        scanner.stop().then(() => scanner.clear()).catch(() => {})
      }
    }

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 300, height: 160 },
          disableFlip: true,
          videoConstraints: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        },
        (decodedText) => {
          if (cancelled) return
          cancelled = true
          onDetected(decodedText)
        },
        () => {}
      )
      .then(() => {
        // Component co the da bi unmount truoc khi camera khoi dong xong
        if (cancelled) safeStop()
      })
      .catch((err) => {
        if (cancelled) return
        const detail = err?.message || err?.name || String(err)
        setError(`Không thể mở camera (${detail}). Vui lòng cấp quyền camera cho trình duyệt và thử lại.`)
      })

    return () => {
      cancelled = true
      safeStop()
    }
  }, [open, retryKey])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-black" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="font-bold text-white">Quét mã vạch</h2>
        <button onClick={onClose} className="text-sm text-white/80">
          Đóng
        </button>
      </div>
      <div id={REGION_ID} className="flex-1" />
      {error && (
        <div className="p-4 text-center">
          <p className="text-sm text-red-300 mb-3">{error}</p>
          <button
            onClick={() => setRetryKey((k) => k + 1)}
            className="rounded-lg bg-white/10 text-white text-sm font-medium px-4 py-2"
          >
            Thử lại
          </button>
        </div>
      )}
      <p className="pb-6 pt-2 text-center text-xs text-white/60">
        Đưa mã vạch vào giữa khung hình, giữ yên, đủ sáng và cách camera khoảng 10-15cm
      </p>
    </div>
  )
}
