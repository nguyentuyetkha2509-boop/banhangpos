export function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Ten san pham co ghi "khuyen mai" / "KM" / "hang tang" nhung chua gan nhan Khuyen mai
const PROMO_WORDS = /(^| )(khuyen mai|km|hang tang|tang kem|qua tang|hang km)( |$)/g

export function isPromoByName(name) {
  PROMO_WORDS.lastIndex = 0
  return PROMO_WORDS.test(normalizeText(name))
}

export function stripPromoWords(name) {
  return normalizeText(name).replace(PROMO_WORDS, ' ').replace(/\s+/g, ' ').trim()
}

export function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const s = String(value ?? '').replace(/\s/g, '')
  if (!s || s === '-' || s === '–') return 0
  if (/^-?\d{1,3}([.,]\d{3})+$/.test(s)) return Number(s.replace(/[.,]/g, ''))
  const n = parseFloat(s.replace(/,/g, '.').replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : 0
}

export function columnLetter(index) {
  let n = index
  let s = ''
  do {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return s
}

const FIELD_RULES = {
  name: (h) => /(^| )(ten hang|ten san pham|ten sp|san pham|ten hang hoa|hang hoa)( |$)/.test(h) && !/tang|loai/.test(h),
  code: (h) => /(^| )(ma hang|ma san pham|ma sp|ma vt|sku)( |$)/.test(h),
  qty: (h) => /(^| )(so luong|sl)( |$)/.test(h) && !/tang|giao|km|khuyen|con lai|ton/.test(h),
  gift: (h) => /(^| )(so luong|sl)( |$)/.test(h) && /tang|khuyen mai/.test(h),
  giftName: (h) => /(hang tang|qua tang|hang khuyen mai)/.test(h) && !/(^| )(so luong|sl)( |$)/.test(h),
  unitCost: (h) => /(gia nhap|gia von|gia npp|don gia|gia mua)/.test(h) && !/vat/.test(h),
  lineTotal: (h) => /thanh tien|tong tien/.test(h) && !/vat/.test(h),
  sell: (h) => /(gia ntd|gia ban|gia le|gia niem yet)/.test(h)
}

export function detectHeaderRow(rows) {
  let best = { index: 0, score: -1 }
  rows.slice(0, 60).forEach((row, index) => {
    const headers = row.map(normalizeText)
    const score = Object.values(FIELD_RULES).reduce((sum, rule) => sum + (headers.some((h) => h && rule(h)) ? 1 : 0), 0)
    if (score > best.score) best = { index, score }
  })
  return best
}

function firstMatch(headers, rule, preferExact) {
  for (const text of [].concat(preferExact || [])) {
    const exact = headers.findIndex((h) => h === text || h === `${text} vnd`)
    if (exact >= 0) return exact
  }
  return headers.findIndex((h) => h && rule(h))
}

export function detectColumns(headerRow) {
  const headers = headerRow.map(normalizeText)
  const find = (field, exact) => {
    const i = firstMatch(headers, FIELD_RULES[field], exact)
    return i >= 0 ? i : null
  }
  const unitCost = find('unitCost', 'gia nhap lan nay')
  const lineTotal = find('lineTotal')
  return {
    name: find('name', ['ten san pham', 'ten hang']),
    code: find('code'),
    qty: find('qty', ['so luong nhap them', 'so luong dat hang']),
    gift: find('gift'),
    giftName: find('giftName', ['hang tang khuyen mai', 'ten hang tang']),
    sell: find('sell', 'gia ban tu lo nay'),
    cost: unitCost != null ? `unit:${unitCost}` : lineTotal != null ? `total:${lineTotal}` : ''
  }
}

export function parseLines(rows, headerIndex, map) {
  const lines = []
  const cell = (row, col) => (col == null || col === '' ? '' : row[col])
  const [costType, costColRaw] = String(map.cost || '').split(':')
  const costCol = costColRaw === undefined ? null : Number(costColRaw)
  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    const name = String(cell(row, map.name) ?? '').trim()
    if (!name) continue
    const qty = toNumber(cell(row, map.qty))
    const gift = toNumber(cell(row, map.gift))
    if (qty <= 0 && gift <= 0) continue
    let cost = 0
    if (costCol != null) {
      const raw = toNumber(cell(row, costCol))
      cost = costType === 'total' ? (qty > 0 ? raw / qty : 0) : raw
    }
    const sell = toNumber(cell(row, map.sell))
    const code = String(cell(row, map.code) ?? '').trim()
    // Hang tang co the la san pham khac hang mua (vd mua rong bien tang khan sua)
    const giftName = String(cell(row, map.giftName) ?? '').trim()
    const giftIsOther = giftName && normalizeText(giftName) !== normalizeText(name)
    if (qty > 0) lines.push({ key: `${i}-m`, name, code, qty, cost: Math.round(cost), sell, isGift: false })
    if (gift > 0) {
      lines.push({
        key: `${i}-g`,
        name: giftName || name,
        code: giftIsOther ? '' : code,
        qty: gift,
        cost: 0,
        sell: 0,
        isGift: true
      })
    }
  }
  return lines
}

export function isPromoProduct(p) {
  return Boolean(p.isPromotion) || isPromoByName(p.name)
}

export function findProductForLine(products, line) {
  const code = normalizeText(line.code)
  const name = stripPromoWords(line.name)
  const candidates = products.filter((p) => isPromoProduct(p) === Boolean(line.isGift))
  return (
    (code && candidates.find((p) => p.supplierCode && normalizeText(p.supplierCode) === code)) ||
    candidates.find((p) => stripPromoWords(p.name) === name) ||
    null
  )
}

function tokensOf(text) {
  return new Set(stripPromoWords(text).split(' ').filter(Boolean))
}

// Diem giong nhau giua 2 ten (0..1). Chi tu dong khop khi ten nay chua tron ten kia,
// cung bo so/kich co (50g, 120ml...) va phan trung du lon, de khong nham cac vi/loai khac nhau.
export function compareNames(a, b) {
  const ta = tokensOf(a)
  const tb = tokensOf(b)
  if (ta.size === 0 || tb.size === 0) return { score: 0, safe: false }
  let inter = 0
  ta.forEach((t) => {
    if (tb.has(t)) inter += 1
  })
  const union = ta.size + tb.size - inter
  const score = inter / union
  const subset = inter === ta.size || inter === tb.size
  const digits = (set) => [...set].filter((t) => /\d/.test(t)).sort().join(',')
  const coverage = inter / Math.max(ta.size, tb.size)
  return { score, safe: subset && coverage >= 0.75 && digits(ta) === digits(tb) }
}

// Hang thuong chi goi y san pham thuong. Hang tang goi y ca san pham co san chua gan nhan
// Khuyen mai (san pham KM xep truoc) de nguoi dung co the chon nhap vao do.
export function rankProducts(products, line) {
  return products
    .filter((p) => line.isGift || !isPromoProduct(p))
    .map((product) => ({ product, ...compareNames(product.name, line.name) }))
    .sort((x, y) => y.score - x.score || Number(isPromoProduct(y.product)) - Number(isPromoProduct(x.product)))
}

export async function readWorkbookFile(file) {
  const { XLSX } = await import('./excelStyle')
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const sheets = wb.SheetNames.map((name) => ({
    name,
    rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '', raw: true })
  }))
  return sheets
}

export async function downloadTemplateFile() {
  const { XLSX } = await import('./excelStyle')
  const ws = XLSX.utils.aoa_to_sheet([
    ['Tên sản phẩm', 'Mã hàng', 'Số lượng nhập thêm', 'Số lượng hàng tặng', 'Giá nhập lần này (VND)', 'Giá bán từ lô này (VND)'],
    ['Ví dụ: Bột hành Anpaso 50g', 'AADGVBGHANH050', 44, 4, 29000, 49000],
    ['Ví dụ: Nước mắm cá cơm Anpaso 120ml', 'AADGVNMCACO120', 200, 40, 34000, 55000]
  ])
  ws['!cols'] = [{ wch: 40 }, { wch: 22 }, { wch: 20 }, { wch: 20 }, { wch: 22 }, { wch: 24 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Nhap kho')
  XLSX.writeFile(wb, 'mau-nhap-kho.xlsx')
}

export function bestSheet(sheets) {
  let best = { index: 0, score: -1 }
  sheets.forEach((s, index) => {
    const { score } = detectHeaderRow(s.rows)
    const hasData = parseLinesQuick(s.rows) > 0 ? 1 : 0
    const total = score * 10 + hasData
    if (total > best.score) best = { index, score: total }
  })
  return best.index
}

function parseLinesQuick(rows) {
  const { index } = detectHeaderRow(rows)
  const map = detectColumns(rows[index] || [])
  if (map.name == null || map.qty == null) return 0
  return parseLines(rows, index, map).length
}

const TEMPLATE_KEY = 'importTemplates'

export function templateFromMapping(headerRow, map) {
  const head = (col) => (col == null || col === '' ? null : normalizeText(headerRow[col]))
  const [costType, costCol] = String(map.cost || '').split(':')
  return {
    name: head(map.name),
    code: head(map.code),
    qty: head(map.qty),
    gift: head(map.gift),
    giftName: head(map.giftName),
    sell: head(map.sell),
    costType: costType || null,
    cost: costCol === undefined ? null : head(Number(costCol))
  }
}

export function applyTemplate(template, headerRow, detected) {
  const headers = headerRow.map(normalizeText)
  const locate = (text, fallback) => {
    if (!text) return fallback
    const i = headers.findIndex((h) => h === text)
    return i >= 0 ? i : fallback
  }
  const costIdx = template.cost ? headers.findIndex((h) => h === template.cost) : -1
  return {
    name: locate(template.name, detected.name),
    code: locate(template.code, detected.code),
    qty: locate(template.qty, detected.qty),
    gift: locate(template.gift, detected.gift),
    giftName: locate(template.giftName, detected.giftName),
    sell: locate(template.sell, detected.sell),
    cost: costIdx >= 0 ? `${template.costType || 'unit'}:${costIdx}` : detected.cost
  }
}

export function loadTemplates() {
  try {
    return JSON.parse(localStorage.getItem(`banhang_pos_${TEMPLATE_KEY}`)) || {}
  } catch {
    return {}
  }
}

export function saveTemplates(templates) {
  try {
    localStorage.setItem(`banhang_pos_${TEMPLATE_KEY}`, JSON.stringify(templates))
  } catch {
    // khong luu duoc thi bo qua
  }
}
