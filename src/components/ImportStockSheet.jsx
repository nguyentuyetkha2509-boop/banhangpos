import React, { useMemo, useState } from 'react'
import { useData } from '../store/DataContext'
import { formatVND } from '../lib/storage'
import {
  applyTemplate,
  bestSheet,
  columnLetter,
  downloadTemplateFile,
  detectColumns,
  detectHeaderRow,
  findProductForLine,
  loadTemplates,
  parseLines,
  rankProducts,
  readWorkbookFile,
  saveTemplates,
  templateFromMapping
} from '../lib/stockImport'

const inputClass =
  'w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'

function ColumnSelect({ label, value, onChange, headerRow, required, allowNone = true }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-500 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} className={inputClass}>
        {allowNone && <option value="">— Không có —</option>}
        {headerRow.map((h, i) =>
          String(h).trim() ? (
            <option key={i} value={i}>
              {columnLetter(i)}: {String(h).trim().slice(0, 40)}
            </option>
          ) : null
        )}
      </select>
    </label>
  )
}

export default function ImportStockSheet({ onClose }) {
  const { products, importStock } = useData()
  const [fileName, setFileName] = useState('')
  const [sheets, setSheets] = useState(null)
  const [sheetIndex, setSheetIndex] = useState(0)
  const [headerIndex, setHeaderIndex] = useState(0)
  const [map, setMap] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState(loadTemplates)
  const [templateName, setTemplateName] = useState('')
  const [updateSellPrice, setUpdateSellPrice] = useState(false)
  const [excluded, setExcluded] = useState({})
  const [choices, setChoices] = useState({})
  const [done, setDone] = useState(null)

  const rows = sheets?.[sheetIndex]?.rows || []
  const headerRow = rows[headerIndex] || []

  function configureSheet(allSheets, index, templateKey) {
    const sheetRows = allSheets[index].rows
    const header = detectHeaderRow(sheetRows).index
    const detected = detectColumns(sheetRows[header] || [])
    const tpl = templateKey ? loadTemplates()[templateKey] : null
    setSheetIndex(index)
    setHeaderIndex(header)
    setMap(tpl ? applyTemplate(tpl, sheetRows[header] || [], detected) : detected)
    setExcluded({})
    setChoices({})
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setLoading(true)
    setDone(null)
    try {
      const loaded = await readWorkbookFile(file)
      if (loaded.length === 0) throw new Error('empty')
      setFileName(file.name)
      setSheets(loaded)
      configureSheet(loaded, bestSheet(loaded), templateName)
    } catch {
      setError('Không đọc được file này. Hãy dùng file Excel (.xlsx, .xls) hoặc CSV.')
      setSheets(null)
    } finally {
      setLoading(false)
    }
  }

  function changeHeader(value) {
    const idx = Math.max(0, Number(value) - 1 || 0)
    setHeaderIndex(idx)
    setMap(detectColumns(rows[idx] || []))
    setExcluded({})
  }

  function pickTemplate(name) {
    setTemplateName(name)
    if (sheets && name) configureSheet(sheets, sheetIndex, name)
  }

  function saveTemplate() {
    const name = templateName.trim()
    if (!name || !map) return
    const next = { ...templates, [name]: templateFromMapping(headerRow, map) }
    setTemplates(next)
    saveTemplates(next)
    alert(`Đã lưu mẫu "${name}". Lần sau chọn mẫu này, app tự nhận đúng các cột.`)
  }

  function deleteTemplate() {
    if (!templates[templateName] || !confirm(`Xóa mẫu "${templateName}"?`)) return
    const next = { ...templates }
    delete next[templateName]
    setTemplates(next)
    saveTemplates(next)
    setTemplateName('')
  }

  function setField(field, value) {
    setMap((prev) => ({ ...prev, [field]: value }))
    setExcluded({})
  }

  const [costType, costColRaw] = String(map?.cost || '').split(':')
  const costCol = costColRaw === undefined ? null : Number(costColRaw)

  function setCost(type, col) {
    setMap((prev) => ({ ...prev, cost: col == null ? '' : `${type}:${col}` }))
  }

  const ready = map && map.name != null && map.qty != null
  const lines = useMemo(() => (ready ? parseLines(rows, headerIndex, map) : []), [rows, headerIndex, map, ready])
  const preview = useMemo(
    () =>
      lines.map((line) => {
        const exact = findProductForLine(products, line)
        const ranked = exact ? [] : rankProducts(products, line)
        const suggested = !exact && ranked[0]?.safe ? ranked[0].product : null
        const choice = choices[line.key]
        let match = exact || suggested
        if (!exact && choice !== undefined) match = choice === 'new' ? null : products.find((p) => p.id === choice) || null
        return { ...line, exact, ranked, match, fuzzy: Boolean(!exact && match) }
      }),
    [lines, products, choices]
  )
  const chosen = preview.filter((l) => !excluded[l.key])
  const totalQty = chosen.reduce((s, l) => s + l.qty, 0)
  const totalCost = chosen.reduce((s, l) => s + l.qty * l.cost, 0)
  const newCount = new Set(chosen.filter((l) => !l.match).map((l) => `${l.isGift}-${l.name}`)).size

  function handleImport() {
    if (chosen.length === 0) return
    const result = importStock(chosen.map((l) => ({ ...l, productId: l.match?.id })), { updateSellPrice, note: `Nhập từ file ${fileName}` })
    setDone(result)
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[92vh] flex flex-col bg-white rounded-t-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">Nhập kho từ file</h2>
          <button onClick={onClose} className="text-slate-400 text-sm">
            Đóng
          </button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <p className="font-bold text-lg text-slate-800 mb-1">Đã nhập kho xong</p>
            <p className="text-sm text-slate-500 mb-4">
              {done.lineCount} dòng hàng
              {done.createdCount > 0 ? `, tạo mới ${done.createdCount} sản phẩm (giá bán có thể cần chỉnh lại)` : ''}.
            </p>
            <button onClick={onClose} className="w-full rounded-xl py-3 font-medium text-white bg-brand-700">
              Xong
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            {Object.keys(templates).length > 0 && (
              <label className="block mb-3">
                <span className="block text-xs font-medium text-slate-500 mb-1">Nhãn hàng (mẫu đã lưu)</span>
                <select value={templateName} onChange={(e) => pickTemplate(e.target.value)} className={inputClass}>
                  <option value="">— Tự nhận dạng —</option>
                  {Object.keys(templates).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <button
              type="button"
              onClick={() => downloadTemplateFile()}
              className="w-full text-xs text-brand-700 underline mb-2"
            >
              Tải file Excel mẫu (tiêu đề cột trùng tên trong app)
            </button>

            <label className="flex items-center justify-center rounded-lg bg-brand-50 text-brand-700 text-sm font-semibold py-3 cursor-pointer mb-2">
              {loading ? 'Đang đọc file...' : fileName ? `Đổi file (${fileName})` : 'Chọn file Excel (.xlsx, .xls, .csv)'}
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" disabled={loading} />
            </label>
            {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

            {sheets && map && (
              <>
                {sheets.length > 1 && (
                  <label className="block mb-3">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Trang tính</span>
                    <select
                      value={sheetIndex}
                      onChange={(e) => configureSheet(sheets, Number(e.target.value), templateName)}
                      className={inputClass}
                    >
                      {sheets.map((s, i) => (
                        <option key={s.name} value={i}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <label className="block col-span-2">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Dòng tiêu đề (số dòng trong Excel)</span>
                    <input
                      type="number"
                      min="1"
                      value={headerIndex + 1}
                      onChange={(e) => changeHeader(e.target.value)}
                      className={inputClass}
                    />
                  </label>
                  <ColumnSelect label="Tên sản phẩm" required allowNone={false} value={map.name} onChange={(v) => setField('name', v)} headerRow={headerRow} />
                  <ColumnSelect label="Số lượng nhập thêm" required allowNone={false} value={map.qty} onChange={(v) => setField('qty', v)} headerRow={headerRow} />
                  <ColumnSelect label="Số lượng hàng tặng" value={map.gift} onChange={(v) => setField('gift', v)} headerRow={headerRow} />
                  <ColumnSelect label="Mã hàng" value={map.code} onChange={(v) => setField('code', v)} headerRow={headerRow} />
                  <ColumnSelect label="Giá bán từ lô này" value={map.sell} onChange={(v) => setField('sell', v)} headerRow={headerRow} />
                  <div>
                    <ColumnSelect label="Giá nhập lần này" value={costCol} onChange={(v) => setCost(costType || 'unit', v)} headerRow={headerRow} />
                  </div>
                  <label className="block col-span-2">
                    <span className="block text-xs font-medium text-slate-500 mb-1">Cột "Giá nhập lần này" là</span>
                    <select value={costType || 'unit'} onChange={(e) => setCost(e.target.value, costCol)} className={inputClass}>
                      <option value="unit">Giá nhập của 1 sản phẩm</option>
                      <option value="total">Thành tiền cả dòng (app chia cho số lượng nhập thêm)</option>
                    </select>
                  </label>
                </div>

                <div className="rounded-lg bg-slate-50 p-2.5 mb-3">
                  <p className="text-xs font-medium text-slate-500 mb-1.5">Lưu cách đọc cột này cho nhãn hàng</p>
                  <div className="flex gap-2">
                    <input
                      value={templateName}
                      onChange={(e) => setTemplateName(e.target.value)}
                      placeholder="VD: Anpaso"
                      className={inputClass}
                    />
                    <button onClick={saveTemplate} disabled={!templateName.trim()} className="shrink-0 rounded-lg bg-brand-700 text-white text-sm font-medium px-3 disabled:opacity-40">
                      Lưu
                    </button>
                    {templates[templateName] && (
                      <button onClick={deleteTemplate} className="shrink-0 rounded-lg bg-red-50 text-red-600 text-sm font-medium px-3">
                        Xóa
                      </button>
                    )}
                  </div>
                </div>

                <label className="flex items-start gap-2 mb-3 text-sm text-slate-600">
                  <input type="checkbox" checked={updateSellPrice} onChange={(e) => setUpdateSellPrice(e.target.checked)} className="mt-1" />
                  <span>Cập nhật giá bán theo file cho cả sản phẩm đã có (sản phẩm mới luôn lấy giá bán từ file)</span>
                </label>

                {!ready ? (
                  <p className="text-sm text-amber-600">Hãy chọn cột Tên sản phẩm và cột Số lượng nhập thêm để xem trước.</p>
                ) : preview.length === 0 ? (
                  <p className="text-sm text-amber-600">Không có dòng nào có số lượng lớn hơn 0 trong trang tính này.</p>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-slate-500 mb-1.5">Xem trước ({preview.length} dòng)</p>
                    <ul className="rounded-lg border border-slate-200 divide-y divide-slate-100 mb-3">
                      {preview.map((l) => (
                        <li key={l.key} className={`flex items-start gap-2 px-2.5 py-2 ${excluded[l.key] ? 'opacity-40' : ''}`}>
                          <input
                            type="checkbox"
                            checked={!excluded[l.key]}
                            onChange={() => setExcluded((prev) => ({ ...prev, [l.key]: !prev[l.key] }))}
                            className="mt-1"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-800 leading-snug">
                              {l.name}
                              {l.isGift && <span className="ml-1 text-[11px] font-bold text-amber-700 bg-amber-50 rounded-full px-1.5 py-0.5">Tặng</span>}
                              {!l.match && <span className="ml-1 text-[11px] font-bold text-sky-700 bg-sky-50 rounded-full px-1.5 py-0.5">Sản phẩm mới</span>}
                              {l.fuzzy && <span className="ml-1 text-[11px] font-bold text-violet-700 bg-violet-50 rounded-full px-1.5 py-0.5">Tên gần giống</span>}
                            </p>
                            <p className="text-xs text-slate-400">
                              SL {l.qty} · giá nhập {formatVND(l.cost)}
                              {!l.isGift && l.sell > 0 ? ` · giá bán ${formatVND(l.sell)}` : ''}
                            </p>
                            {!l.exact && (
                              <select
                                value={l.match ? l.match.id : 'new'}
                                onChange={(e) => setChoices((prev) => ({ ...prev, [l.key]: e.target.value }))}
                                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-1.5 py-1 text-xs text-slate-600"
                              >
                                <option value="new">Tạo sản phẩm mới</option>
                                {l.ranked.map(({ product }) => (
                                  <option key={product.id} value={product.id}>
                                    Nhập vào: {product.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                          <span className="shrink-0 text-sm font-medium text-slate-700">{formatVND(l.qty * l.cost)}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-slate-600 mb-3">
                      Nhập <b>{chosen.length}</b> dòng · <b>{totalQty}</b> sản phẩm · tiền nhập <b>{formatVND(totalCost)}</b>
                      {newCount > 0 ? ` · ${newCount} sản phẩm mới` : ''}
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {!done && sheets && ready && preview.length > 0 && (
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleImport}
              disabled={chosen.length === 0}
              className="w-full rounded-xl py-3 font-medium text-white bg-brand-700 disabled:opacity-40"
            >
              Nhập kho {chosen.length} dòng
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
