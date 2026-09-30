import React, { useEffect, useState } from 'react'
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode'
import { loadData, saveData } from '../lib/storage'

const REGION_ID = 'barcode-scanner-region'
const CAMERA_KEY = 'scannerCameraId'

const label = (c) => (c.label || '').trim()
const isBackCamera = (c) => /back|rear|environment/i.test(label(c))
const isSpecialLens = (c) => /ultra|wide angle|telephoto|0\.5x|zoom|dual|triple|desk/i.test(label(c))

function shortName(c) {
  const l = label(c)
  if (/ultra/i.test(l)) return 'Góc siêu rộng (quét sát, ~3-8cm)'
  if (/tele/i.test(l)) return 'Tele (quét xa)'
  if (/^back camera$/i.test(l)) return 'Camera chính'
  return l.replace(/^back\s*/i, '') || 'Camera'
}

export default function BarcodeScannerModal({ open, onClose, onDetected }) {
  const [error, setError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [cameras, setCameras] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [chosenId, setChosenId] = useState(() => loadData(CAMERA_KEY, null))

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

    async function pickCameraDeviceId() {
      // iPhone Pro co nhieu ong kinh (chinh/sieu rong/tele) va camera ao Dual/Triple;
      // "environment" co the chon nham ong kinh khong lay net duoc. Chu dong chon camera,
      // mac dinh la camera chinh, nguoi dung co the doi sang ong kinh khac bang nut tren man hinh.
      try {
        const list = await Html5Qrcode.getCameras()
        const back = (list || []).filter(isBackCamera).filter((c) => !/dual|triple|desk/i.test(label(c)))
        if (!cancelled) setCameras(back)
        if (chosenId && back.some((c) => c.id === chosenId)) return chosenId
        const preferred =
          back.find((c) => /^back camera$/i.test(label(c))) || back.find((c) => !isSpecialLens(c)) || back[0]
        return preferred?.id || null
      } catch {
        return null
      }
    }

    pickCameraDeviceId().then((deviceId) => {
      if (cancelled) return
      setActiveId(deviceId)
      const videoConstraints = deviceId
        ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      scanner
        .start(
          deviceId || { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => ({
              width: Math.floor(viewfinderWidth * 0.85),
              height: Math.floor(viewfinderHeight * 0.4)
            }),
            disableFlip: true,
            videoConstraints
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
          if (cancelled) {
            safeStop()
            return
          }
          // Thu bat lay net lien tuc (khong phai trinh duyet nao cung ho tro, loi thi bo qua)
          scanner.applyVideoConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(() => {})
        })
        .catch((err) => {
          if (cancelled) return
          const detail = err?.message || err?.name || String(err)
          setError(`Không thể mở camera (${detail}). Vui lòng cấp quyền camera cho trình duyệt và thử lại.`)
        })
    })

    return () => {
      cancelled = true
      safeStop()
    }
  }, [open, retryKey, chosenId])

  function switchCamera() {
    if (cameras.length < 2) return
    const idx = cameras.findIndex((c) => c.id === activeId)
    const next = cameras[(idx + 1) % cameras.length]
    saveData(CAMERA_KEY, next.id)
    setChosenId(next.id)
  }

  if (!open) return null

  const active = cameras.find((c) => c.id === activeId)

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
      {cameras.length > 1 && (
        <div className="px-4 pt-2 text-center">
          <button
            onClick={switchCamera}
            className="rounded-lg bg-white/15 text-white text-sm font-medium px-4 py-2.5"
          >
            Đổi ống kính{active ? `: ${shortName(active)}` : ''}
          </button>
        </div>
      )}
      <p className="pb-6 pt-2 px-4 text-center text-xs text-white/60">
        Giữ yên, đủ sáng. Nếu hình bị mờ: lùi ra xa 15-25cm, hoặc bấm "Đổi ống kính" sang góc siêu rộng rồi đưa mã vạch thật
        sát (3-8cm).
      </p>
    </div>
  )
}
