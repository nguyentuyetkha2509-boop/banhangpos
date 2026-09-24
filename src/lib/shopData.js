import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'

export const DATA_COLLECTIONS = ['products', 'orders', 'stockMovements', 'returns', 'shrinkages', 'debtPayments']

// Sau khi chuyen sang v2, cac mang cu duoc dat ve [] (khong xoa) de may con chay ban app
// cu khong tu tao lai san pham mau. Mang khong rong o v2 nghia la may cu vua ghi them du lieu.
export function hasLegacyArrays(data) {
  return DATA_COLLECTIONS.some(
    (name) => Array.isArray(data?.[name]) && (data.storageVersion !== 2 || data[name].length > 0)
  )
}

export function emptyLegacyArrays() {
  return Object.fromEntries(DATA_COLLECTIONS.map((name) => [name, []]))
}

export function sortRecords(name, records) {
  const list = [...records]
  if (name === 'products') {
    return list.sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || String(a.id).localeCompare(String(b.id)))
  }
  return list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
}

export async function fetchShopRecords(uid, rootData) {
  if (rootData?.storageVersion === 2 && !hasLegacyArrays(rootData)) {
    const entries = await Promise.all(
      DATA_COLLECTIONS.map(async (name) => {
        const snap = await getDocs(collection(db, 'shops', uid, name))
        return [name, sortRecords(name, snap.docs.map((d) => ({ id: d.id, ...d.data() })))]
      })
    )
    return Object.fromEntries(entries)
  }
  return Object.fromEntries(DATA_COLLECTIONS.map((name) => [name, rootData?.[name] || []]))
}
